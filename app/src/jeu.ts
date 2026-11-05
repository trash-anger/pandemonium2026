// API du jeu, LOT-1 : scan, création du personnage, étiquettes multiples, collection, réintégration par PIN.
// Specs : FEAT-002, FEAT-003, FEAT-004, FEAT-019. Le serveur est la source de vérité (DEC-052).
import { signer, verifier } from "./auth";
import { ATTRIBUTS, auHasard, CLASSES, COULEURS, FACTIONS, genererPseudo, TYPES, tirerFaction, type Langue } from "./catalogue";
import { normaliserCode } from "./codes";
import { HEURES_PAR_DEFAUT, lireConfig, PARAMETRES_PAR_DEFAUT, type Heures } from "./config";
import { localVersIso } from "./temps";
import { devActif } from "./mode";

export interface EnvJeu {
  DB: D1Database;
  PUBLIC_ORIGIN: string;
  SESSION_SECRET?: string;
  BANC?: string;
}

const BLOCAGE_SURCONSO_MIN = 10;
const PIN_ESSAIS_MAX = 5;
const PIN_BLOCAGE_MIN = 15;
const TIRAGE_VALIDITE_S = 30 * 60;

const json = (v: unknown, status = 200) =>
  new Response(JSON.stringify(v), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const erreur = (code: string, status = 400, extra: object = {}) => json({ erreur: code, ...extra }, status);

const enc = new TextEncoder();
export async function sha256(s: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", enc.encode(s));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const aleatoire = (n = 24) => {
  const b = crypto.getRandomValues(new Uint8Array(n));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const secret = (env: EnvJeu) => env.SESSION_SECRET || "dev-seulement";

/** Heure du serveur. En local et sur l'aperçu, le banc d'essai peut la simuler (en-tête X-Dev-Maintenant). */
export function maintenant(req: Request, env: EnvJeu): number {
  if (devActif(env)) {
    const h = Number(req.headers.get("X-Dev-Maintenant"));
    if (Number.isFinite(h) && h > 0) return h;
  }
  return Date.now();
}

async function heuresIso(db: D1Database) {
  const h = { ...HEURES_PAR_DEFAUT, ...((await lireConfig(db, "heures")) as Partial<Heures>) };
  const r: Record<keyof Heures, string> = {} as never;
  for (const k of Object.keys(HEURES_PAR_DEFAUT) as (keyof Heures)[]) r[k] = localVersIso(h[k]);
  return r;
}

async function maxFactions(db: D1Database): Promise<number> {
  const p = (await lireConfig(db, "parametres")) as typeof PARAMETRES_PAR_DEFAUT;
  return p?.surconsommation?.max_factions ?? 3;
}

async function empreintePin(env: EnvJeu, sel: string, pin: string) {
  return sha256(`${secret(env)}:${sel}:${pin}`);
}

export async function definirPin(env: EnvJeu, personnageId: string, pin: string) {
  const sel = aleatoire(12);
  await env.DB.prepare("UPDATE personnages SET pin_sel = ?, pin_empreinte = ? WHERE id = ?")
    .bind(sel, await empreintePin(env, sel, pin), personnageId).run();
}

// ---------- Personnage ----------
interface LignePerso {
  id: string; pseudo: string; type: string; couleur: string; attributs: string; classe: string;
  photos_ok: number; est_mj: number; surconsommation: number; bloque_jusqu_a: string | null;
  cree_le: string; premier_scanne_le: string | null; langue: string; pin_sel: string; pin_empreinte: string;
}

async function personnageDe(req: Request, env: EnvJeu, t: number): Promise<LignePerso | null> {
  const jeton = req.headers.get("X-Appareil");
  if (!jeton || jeton.length > 100) return null;
  const emp = await sha256(jeton);
  const p = await env.DB.prepare("SELECT p.* FROM appareils a JOIN personnages p ON p.id = a.personnage_id WHERE a.empreinte = ?")
    .bind(emp).first<LignePerso>();
  if (p) await env.DB.prepare("UPDATE appareils SET vu_le = ? WHERE empreinte = ?").bind(new Date(t).toISOString(), emp).run();
  return p;
}

export async function nouvelAppareil(env: EnvJeu, personnageId: string, t: number): Promise<string> {
  const jeton = aleatoire(32), iso = new Date(t).toISOString();
  await env.DB.prepare("INSERT INTO appareils (empreinte, personnage_id, cree_le, vu_le) VALUES (?, ?, ?, ?)")
    .bind(await sha256(jeton), personnageId, iso, iso).run();
  return jeton;
}

/** Ce que les autres joueurs voient (REQ-009). */
async function cartePublique(env: EnvJeu, id: string) {
  const p = await env.DB.prepare("SELECT id, pseudo, type, couleur, attributs, classe, est_mj FROM personnages WHERE id = ?")
    .bind(id).first<{ id: string; pseudo: string; type: string; couleur: string; attributs: string; classe: string; est_mj: number }>();
  if (!p) return null;
  const f = await env.DB.prepare("SELECT DISTINCT faction_id AS f FROM etiquettes WHERE personnage_id = ? AND faction_id IS NOT NULL ORDER BY reclamee_le")
    .bind(id).all<{ f: string }>();
  return { ...p, attributs: JSON.parse(p.attributs), est_mj: !!p.est_mj, factions: f.results.map((r) => r.f) };
}

function droits(p: LignePerso, h: Record<keyof Heures, string>, t: number) {
  const iso = new Date(t).toISOString();
  const apresMinuit = p.cree_le >= h.minuit, apresClasse = p.cree_le >= h.classe;
  return {
    pseudo: iso < h.minuit,
    costume: !p.premier_scanne_le && (iso < h.minuit || apresMinuit),
    classe: iso < h.classe || (apresClasse && !p.premier_scanne_le),
    photos: true,
  };
}

// ---------- Classements (FEAT-015, LB-1 et LB-2) et médailles de classement ----------
// Le MJ n'est pas classé. Seuls comptent les premiers scans faits avant la révélation (RG-015-2 : figés à 5 h).
// À égalité, la place revient à qui a atteint ce score en premier.
export const CLASSEMENTS = {
  collectionneurs: "possesseur_id", // LB-1 : personnages distincts scannés
  celebrites: "personnage_id",      // LB-2 : scanneurs distincts
} as const;
type IdClassement = keyof typeof CLASSEMENTS;
const MEDAILLES_PAR_CLASSEMENT = 3;

/** Classement global, ou restreint aux membres d'une faction (LB-9). Paramètres : révélation [, faction]. */
function requeteClassement(id: IdClassement, parFaction = false) {
  const col = CLASSEMENTS[id];
  return `SELECT c.${col} AS id, COUNT(*) AS n, MAX(c.premier_scan_le) AS atteint
    FROM collection c JOIN personnages p ON p.id = c.${col}
    WHERE p.est_mj = 0 AND c.premier_scan_le < ?
    ${parFaction ? "AND c." + col + " IN (SELECT personnage_id FROM etiquettes WHERE faction_id = ?)" : ""}
    GROUP BY c.${col} ORDER BY n DESC, atteint ASC`;
}

async function factionsDe(env: EnvJeu, id: string): Promise<string[]> {
  const r = await env.DB.prepare("SELECT DISTINCT faction_id AS f FROM etiquettes WHERE personnage_id = ? AND faction_id IS NOT NULL").bind(id).all<{ f: string }>();
  return r.results.map((x) => x.f);
}

async function medaillesDe(env: EnvJeu, id: string, h: Record<keyof Heures, string>) {
  // Top 3 global, et top 3 dans chacune de ses factions
  const r: { classement: string; faction: string | null; rang: number; n: number }[] = [];
  const portees: (string | null)[] = [null, ...(await factionsDe(env, id))];
  for (const c of Object.keys(CLASSEMENTS) as IdClassement[]) {
    for (const f of portees) {
      const q = env.DB.prepare(requeteClassement(c, !!f) + ` LIMIT ${MEDAILLES_PAR_CLASSEMENT}`);
      const top = (await (f ? q.bind(h.revelation, f) : q.bind(h.revelation)).all<{ id: string; n: number }>()).results;
      const i = top.findIndex((x) => x.id === id);
      if (i >= 0) r.push({ classement: c, faction: f, rang: i + 1, n: top[i].n });
    }
  }
  return r;
}

async function classements(req: Request, env: EnvJeu, t: number): Promise<Response> {
  const me = await personnageDe(req, env, t);
  if (!me) return erreur("sans_personnage", 401);
  const h = await heuresIso(env.DB);
  const mesFactions = await factionsDe(env, me.id);
  const demandee = new URL(req.url).searchParams.get("faction");
  const faction = demandee && (FACTIONS as readonly string[]).includes(demandee) ? demandee : null;
  const sortie = [];
  for (const c of Object.keys(CLASSEMENTS) as IdClassement[]) {
    const q = env.DB.prepare(requeteClassement(c, !!faction));
    const tous = (await (faction ? q.bind(h.revelation, faction) : q.bind(h.revelation)).all<{ id: string; n: number }>()).results;
    const top = tous.slice(0, 10);
    const ids = top.map((x) => x.id);
    const pseudos = ids.length
      ? Object.fromEntries((await env.DB.prepare(`SELECT id, pseudo, type, couleur FROM personnages WHERE id IN (${ids.map(() => "?").join(",")})`).bind(...ids)
          .all<{ id: string; pseudo: string; type: string; couleur: string }>()).results.map((p) => [p.id, p]))
      : {};
    const rangMoi = tous.findIndex((x) => x.id === me.id);
    sortie.push({
      id: c, participants: tous.length,
      top: top.map((x, i) => ({ rang: i + 1, n: x.n, moi: x.id === me.id, pseudo: pseudos[x.id]?.pseudo, type: pseudos[x.id]?.type, couleur: pseudos[x.id]?.couleur })),
      moi: rangMoi >= 0 ? { rang: rangMoi + 1, n: tous[rangMoi].n } : null,
    });
  }
  return json({ classements: sortie, faction, mes_factions: mesFactions, fige: new Date(t).toISOString() >= h.revelation, revelation: h.revelation });
}

async function moi(env: EnvJeu, p: LignePerso, t: number) {
  const h = await heuresIso(env.DB);
  const etiquettes = (await env.DB.prepare("SELECT code, faction_id AS faction, format FROM etiquettes WHERE personnage_id = ? ORDER BY reclamee_le")
    .bind(p.id).all()).results;
  const badges = (await env.DB.prepare("SELECT badge, obtenu_le FROM badges WHERE personnage_id = ? ORDER BY obtenu_le").bind(p.id).all()).results;
  const nb = await env.DB.prepare("SELECT COUNT(*) AS n FROM collection WHERE possesseur_id = ?").bind(p.id).first<{ n: number }>();
  return {
    personnage: {
      id: p.id, pseudo: p.pseudo, type: p.type, couleur: p.couleur, attributs: JSON.parse(p.attributs), classe: p.classe,
      photos_ok: !!p.photos_ok, est_mj: !!p.est_mj, surconsommation: !!p.surconsommation,
      bloque_jusqu_a: p.bloque_jusqu_a && p.bloque_jusqu_a > new Date(t).toISOString() ? p.bloque_jusqu_a : null,
      cree_le: p.cree_le, premier_scanne_le: p.premier_scanne_le,
    },
    etiquettes, badges, nb_cartes: nb?.n ?? 0, droits: droits(p, h, t), heures: h,
    medailles: await medaillesDe(env, p.id, h),
  };
}

async function donnerBadge(env: EnvJeu, id: string, badge: string, t: number) {
  const r = await env.DB.prepare("INSERT OR IGNORE INTO badges (personnage_id, badge, obtenu_le) VALUES (?, ?, ?)")
    .bind(id, badge, new Date(t).toISOString()).run();
  return r.meta.changes > 0;
}

async function effectifsFactions(env: EnvJeu): Promise<Record<string, number>> {
  const r = await env.DB.prepare("SELECT faction_id AS f, COUNT(DISTINCT personnage_id) AS n FROM etiquettes WHERE etat = 'reclamee' AND faction_id IS NOT NULL GROUP BY faction_id")
    .all<{ f: string; n: number }>();
  return Object.fromEntries(r.results.map((x) => [x.f, x.n]));
}

// ---------- Routes ----------
export async function routeApi(req: Request, env: EnvJeu, url: URL): Promise<Response> {
  const t = maintenant(req, env);
  const p = url.pathname;
  try {
    if (p === "/api/moi" && req.method === "GET") {
      const perso = await personnageDe(req, env, t);
      return json(perso ? await moi(env, perso, t) : { personnage: null, heures: await heuresIso(env.DB) });
    }
    if (p === "/api/collection" && req.method === "GET") return collection(req, env, t);
    if (p === "/api/classements" && req.method === "GET") return classements(req, env, t);
    if (req.method !== "POST") return erreur("methode", 405);
    // Les appels d'écriture viennent de notre page (protection CSRF)
    const origine = req.headers.get("Origin");
    if (origine && origine !== url.origin) return erreur("origine", 403);
    const corps = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (p === "/api/scan") return scan(req, env, t, corps);
    if (p === "/api/tirage") return tirage(req, env, t, corps);
    if (p === "/api/creer") return creer(req, env, t, corps);
    if (p === "/api/etiquette") return ajouterEtiquette(req, env, t, corps);
    if (p === "/api/reintegrer") return reintegrer(req, env, t, corps);
    if (p === "/api/modifier") return modifier(req, env, t, corps);
    return erreur("introuvable", 404);
  } catch (e) {
    console.error(e);
    return erreur("serveur", 500);
  }
}

interface Etiq { code: string; etat: string; role: string; personnage_id: string | null; faction_id: string | null }

async function lireEtiquette(env: EnvJeu, brut: unknown): Promise<Etiq | null> {
  const code = normaliserCode(String(brut ?? ""));
  if (!code) return null;
  return env.DB.prepare("SELECT code, etat, role, personnage_id, faction_id FROM etiquettes WHERE code = ?").bind(code).first<Etiq>();
}

/** Traitement d'un scan : arbre de décision de FEAT-003 (parcours §1). */
async function scan(req: Request, env: EnvJeu, t: number, c: Record<string, unknown>): Promise<Response> {
  const idClient = typeof c.id_client === "string" ? c.id_client.slice(0, 64) : null;
  if (idClient) {
    const deja = await env.DB.prepare("SELECT reponse FROM scans WHERE id_client = ?").bind(idClient).first<{ reponse: string }>();
    if (deja?.reponse) return json({ ...JSON.parse(deja.reponse), rejoue: true });
  }
  const source = ["app", "qr_externe", "code_manuel"].includes(String(c.source)) ? String(c.source) : "qr_externe";
  const e = await lireEtiquette(env, c.code);
  if (!e) return json({ type: "inconnue" }, 404);
  const iso = new Date(t).toISOString();
  const h = await heuresIso(env.DB);
  const me = await personnageDe(req, env, t);

  const enregistrer = async (resultat: string, reponse: object, cible: string | null = null) => {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO scans (id_client, scanneur_id, code, cible_id, source, resultat, horodatage_client, horodatage_serveur, reponse) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(idClient, me?.id ?? null, e.code, cible, source, resultat, typeof c.horodatage === "string" ? c.horodatage : null, iso, JSON.stringify(reponse)).run();
    return json(reponse);
  };

  if (e.etat === "desactivee") return json({ type: "retiree", code: e.code });
  if (iso < h.debut) return json({ type: "bientot", code: e.code, debut: h.debut });
  if (iso >= h.fin) return json({ type: "ferme", code: e.code });
  if (me?.bloque_jusqu_a && me.bloque_jusqu_a > iso) {
    return enregistrer("bloque", { type: "bloque", code: e.code, jusqu_a: me.bloque_jusqu_a });
  }
  if (e.role === "speciale_mj") {
    // Légendaires et pièges : effets au LOT-3 (FEAT-022)
    return enregistrer("special", { type: "special", code: e.code });
  }
  if (e.etat === "vierge") {
    // Pas d'effet tant que le joueur n'a pas répondu ou créé son personnage
    return json(me ? { type: "a_toi", code: e.code } : { type: "creation", code: e.code, mj: e.role === "personnelle_mj" });
  }
  // Étiquette réclamée
  const cible = e.personnage_id!;
  const carte = await cartePublique(env, cible);
  if (!me) return enregistrer("spectateur", { type: "spectateur", code: e.code, carte }, cible);
  if (cible === me.id) return enregistrer("soi_meme", { type: "soi_meme", code: e.code, carte }, cible);

  const ins = await env.DB.prepare(
    "INSERT INTO collection (possesseur_id, personnage_id, premier_scan_le, dernier_scan_le, code) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING",
  ).bind(me.id, cible, iso, iso, e.code).run();
  if (ins.meta.changes > 0) {
    // Premier scan de la cible par un autre joueur : fige son costume (RG-003-11)
    await env.DB.prepare("UPDATE personnages SET premier_scanne_le = ? WHERE id = ? AND premier_scanne_le IS NULL").bind(iso, cible).run();
    const nb = await env.DB.prepare("SELECT COUNT(*) AS n FROM collection WHERE possesseur_id = ?").bind(me.id).first<{ n: number }>();
    return enregistrer("nouvelle_carte", { type: "nouvelle_carte", code: e.code, carte, nb_cartes: nb?.n ?? 1 }, cible);
  }
  // Rescan : compteur simple ; paliers, souvenirs et limites au LOT-2 (FEAT-005)
  await env.DB.prepare("UPDATE collection SET nb_scans = nb_scans + 1, dernier_scan_le = ? WHERE possesseur_id = ? AND personnage_id = ?")
    .bind(iso, me.id, cible).run();
  const n = await env.DB.prepare("SELECT nb_scans AS n FROM collection WHERE possesseur_id = ? AND personnage_id = ?").bind(me.id, cible).first<{ n: number }>();
  return enregistrer("deja_vu", { type: "deja_vu", code: e.code, carte, n: n?.n ?? 2 }, cible);
}

function valider(c: Record<string, unknown>) {
  const type = String(c.type), couleur = String(c.couleur);
  const attributs = Array.isArray(c.attributs) ? [...new Set(c.attributs.map(String))] : [];
  if (!(TYPES as readonly string[]).includes(type)) return null;
  if (!(COULEURS as readonly string[]).includes(couleur)) return null;
  if (!attributs.every((a) => (ATTRIBUTS as readonly string[]).includes(a))) return null;
  return { type, couleur, attributs };
}
const langueDe = (v: unknown): Langue => (v === "en" ? "en" : "fr");

/** Écran 4 : pseudo, faction et classe tirés au hasard, signés pour que le client ne puisse pas les choisir. */
async function tirage(req: Request, env: EnvJeu, t: number, c: Record<string, unknown>): Promise<Response> {
  const e = await lireEtiquette(env, c.code);
  if (!e || e.etat !== "vierge") return erreur("deja_reclamee", 409);
  const v = valider(c);
  if (!v) return erreur("choix_invalides");
  const l = langueDe(c.langue);
  const faction = tirerFaction(await effectifsFactions(env));
  const classe = auHasard(CLASSES);
  const pseudo = genererPseudo(v.type, v.couleur, l);
  const jeton = await signer(secret(env), { code: e.code, pseudo, faction, classe, exp: Math.floor(t / 1000) + TIRAGE_VALIDITE_S });
  return json({ pseudo, faction, classe, jeton });
}

async function creer(req: Request, env: EnvJeu, t: number, c: Record<string, unknown>): Promise<Response> {
  const v = valider(c);
  if (!v) return erreur("choix_invalides");
  if (!/^\d{4}$/.test(String(c.pin))) return erreur("pin_invalide");
  const tir = await verifier<{ code: string; pseudo: string; faction: string; classe: string; exp: number }>(secret(env), String(c.jeton || ""));
  if (!tir || tir.exp < t / 1000) return erreur("tirage_expire");
  const e = await lireEtiquette(env, tir.code);
  if (!e) return erreur("inconnue", 404);
  if (e.etat !== "vierge" || e.role === "speciale_mj") return erreur("deja_reclamee", 409);
  const h = await heuresIso(env.DB), iso = new Date(t).toISOString();
  if (iso < h.debut || iso >= h.fin) return erreur("hors_horaires", 409);
  if (await personnageDe(req, env, t)) return erreur("deja_un_personnage", 409);

  const id = aleatoire(12), sel = aleatoire(12);
  // Réclamation atomique (CA-003-3) : le personnage n'est inséré que si l'étiquette est encore vierge,
  // et l'étiquette n'est réclamée que si le personnage vient d'être inséré. D1 exécute le lot en une transaction.
  const r = await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO personnages (id, pseudo, type, couleur, attributs, classe, photos_ok, pin_sel, pin_empreinte, langue, est_mj, cree_le)
       SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM etiquettes WHERE code = ? AND etat = 'vierge')`,
    ).bind(id, tir.pseudo, v.type, v.couleur, JSON.stringify(v.attributs), tir.classe, c.photos ? 1 : 0, sel,
      await empreintePin(env, sel, String(c.pin)), langueDe(c.langue), e.role === "personnelle_mj" ? 1 : 0, iso, e.code),
    env.DB.prepare(
      "UPDATE etiquettes SET etat = 'reclamee', personnage_id = ?, faction_id = ?, reclamee_le = ? WHERE code = ? AND etat = 'vierge' AND EXISTS (SELECT 1 FROM personnages WHERE id = ?)",
    ).bind(id, tir.faction, iso, e.code, id),
  ]);
  if (r[1].meta.changes !== 1) return erreur("deja_reclamee", 409);
  const jeton = await nouvelAppareil(env, id, t);
  await env.DB.prepare("INSERT OR IGNORE INTO scans (id_client, scanneur_id, code, cible_id, source, resultat, horodatage_serveur) VALUES (?, ?, ?, ?, 'qr_externe', 'creation', ?)")
    .bind(typeof c.id_client === "string" ? c.id_client.slice(0, 64) : null, id, e.code, id, iso).run();
  const perso = await env.DB.prepare("SELECT * FROM personnages WHERE id = ?").bind(id).first<LignePerso>();
  return json({ jeton, ...(await moi(env, perso!, t)) });
}

/** Un joueur scanne une étiquette vierge : « Cette étiquette est-elle à toi ? » (FEAT-003). */
async function ajouterEtiquette(req: Request, env: EnvJeu, t: number, c: Record<string, unknown>): Promise<Response> {
  const me = await personnageDe(req, env, t);
  if (!me) return erreur("sans_personnage", 401);
  const e = await lireEtiquette(env, c.code);
  if (!e) return erreur("inconnue", 404);
  if (e.etat !== "vierge" || e.role === "speciale_mj") return erreur("deja_reclamee", 409);
  const iso = new Date(t).toISOString();
  if (me.bloque_jusqu_a && me.bloque_jusqu_a > iso) return erreur("bloque", 423, { jusqu_a: me.bloque_jusqu_a });

  if (c.a_moi !== true) {
    // Tué dans l'œuf : badge seulement, l'étiquette reste réclamable (RG-003-6)
    const nouveau = await donnerBadge(env, me.id, "tueur_de_poussin", t);
    await env.DB.prepare("INSERT INTO scans (scanneur_id, code, source, resultat, horodatage_serveur) VALUES (?, ?, 'app', 'tue_dans_oeuf', ?)").bind(me.id, e.code, iso).run();
    return json({ type: "tue", code: e.code, badge: nouveau ? "tueur_de_poussin" : null });
  }

  const miennes = (await env.DB.prepare("SELECT faction_id AS f FROM etiquettes WHERE personnage_id = ?").bind(me.id).all<{ f: string | null }>()).results;
  const mesFactions = [...new Set(miennes.map((x) => x.f).filter((f): f is string => !!f))];
  const max = await maxFactions(env.DB);
  const surconso = miennes.length >= max;
  const faction = surconso
    ? auHasard(mesFactions.length ? mesFactions : [...FACTIONS])
    : tirerFaction(await effectifsFactions(env), FACTIONS.filter((f) => !mesFactions.includes(f)));
  const r = await env.DB.prepare("UPDATE etiquettes SET etat = 'reclamee', personnage_id = ?, faction_id = ?, reclamee_le = ? WHERE code = ? AND etat = 'vierge'")
    .bind(me.id, faction, iso, e.code).run();
  if (r.meta.changes !== 1) return erreur("deja_reclamee", 409);
  const badges: string[] = [];
  if (await donnerBadge(env, me.id, "achat_compulsif", t)) badges.push("achat_compulsif");
  let jusqu_a: string | null = null;
  if (surconso) {
    // RG-003-10 : les autres malus (points, quête, corruption) s'appliquent aux LOT-3 et LOT-4 via ce drapeau
    jusqu_a = new Date(t + BLOCAGE_SURCONSO_MIN * 60_000).toISOString();
    await env.DB.prepare("UPDATE personnages SET surconsommation = 1, bloque_jusqu_a = ? WHERE id = ?").bind(jusqu_a, me.id).run();
    if (await donnerBadge(env, me.id, "surconsommation", t)) badges.push("surconsommation");
  }
  await env.DB.prepare("INSERT INTO scans (scanneur_id, code, cible_id, source, resultat, horodatage_serveur) VALUES (?, ?, ?, 'app', 'ajout_etiquette', ?)").bind(me.id, e.code, me.id, iso).run();
  return json({ type: "ajoutee", code: e.code, faction, surconsommation: surconso, jusqu_a, badges, nb_etiquettes: miennes.length + 1 });
}

/** Réintégration par PIN depuis un navigateur sans personnage (RG-019-2, RG-019-4). */
async function reintegrer(req: Request, env: EnvJeu, t: number, c: Record<string, unknown>): Promise<Response> {
  const e = await lireEtiquette(env, c.code);
  if (!e || e.etat !== "reclamee" || !e.personnage_id) return erreur("inconnue", 404);
  const iso = new Date(t).toISOString();
  const essais = await env.DB.prepare("SELECT echecs, bloque_jusqu_a FROM pin_essais WHERE code = ?").bind(e.code).first<{ echecs: number; bloque_jusqu_a: string | null }>();
  if (essais?.bloque_jusqu_a && essais.bloque_jusqu_a > iso) return erreur("pin_bloque", 423, { jusqu_a: essais.bloque_jusqu_a });
  const p = await env.DB.prepare("SELECT * FROM personnages WHERE id = ?").bind(e.personnage_id).first<LignePerso>();
  const pin = String(c.pin ?? "");
  if (!p || !/^\d{4}$/.test(pin) || (await empreintePin(env, p.pin_sel, pin)) !== p.pin_empreinte) {
    const echecs = (essais?.bloque_jusqu_a ? 0 : essais?.echecs ?? 0) + 1;
    const bloque = echecs >= PIN_ESSAIS_MAX ? new Date(t + PIN_BLOCAGE_MIN * 60_000).toISOString() : null;
    await env.DB.prepare(
      "INSERT INTO pin_essais (code, echecs, bloque_jusqu_a) VALUES (?, ?, ?) ON CONFLICT (code) DO UPDATE SET echecs = excluded.echecs, bloque_jusqu_a = excluded.bloque_jusqu_a",
    ).bind(e.code, bloque ? 0 : echecs, bloque).run();
    return bloque ? erreur("pin_bloque", 423, { jusqu_a: bloque }) : erreur("pin_faux", 403, { restants: PIN_ESSAIS_MAX - echecs });
  }
  await env.DB.prepare("DELETE FROM pin_essais WHERE code = ?").bind(e.code).run();
  const jeton = await nouvelAppareil(env, p.id, t);
  return json({ jeton, ...(await moi(env, p, t)) });
}

/** Modifications depuis la fiche (RG-003-11, RG-003-12, REQ-010). */
async function modifier(req: Request, env: EnvJeu, t: number, c: Record<string, unknown>): Promise<Response> {
  const me = await personnageDe(req, env, t);
  if (!me) return erreur("sans_personnage", 401);
  const d = droits(me, await heuresIso(env.DB), t);
  const maj: Record<string, unknown> = {};
  let badge: string | null = null;
  if ("pseudo" in c) {
    if (!d.pseudo) return erreur("pseudo_fige", 409);
    const s = String(c.pseudo).replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim();
    if (s.length < 2 || s.length > 28) return erreur("pseudo_longueur");
    maj.pseudo = s;
  }
  if ("type" in c || "couleur" in c || "attributs" in c) {
    if (!d.costume) return erreur("costume_fige", 409);
    const v = valider({ type: c.type ?? me.type, couleur: c.couleur ?? me.couleur, attributs: c.attributs ?? JSON.parse(me.attributs) });
    if (!v) return erreur("choix_invalides");
    Object.assign(maj, { type: v.type, couleur: v.couleur, attributs: JSON.stringify(v.attributs) });
  }
  if ("classe" in c) {
    if (!d.classe) return erreur("classe_figee", 409);
    if (!(CLASSES as readonly string[]).includes(String(c.classe))) return erreur("choix_invalides");
    if (c.classe !== me.classe) {
      maj.classe = String(c.classe);
      if (await donnerBadge(env, me.id, "trans_classe", t)) badge = "trans_classe";
    }
  }
  if ("photos" in c) maj.photos_ok = c.photos ? 1 : 0;
  const cles = Object.keys(maj);
  if (cles.length) {
    await env.DB.prepare(`UPDATE personnages SET ${cles.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`).bind(...cles.map((k) => maj[k]), me.id).run();
  }
  const p = await env.DB.prepare("SELECT * FROM personnages WHERE id = ?").bind(me.id).first<LignePerso>();
  return json({ badge, ...(await moi(env, p!, t)) });
}

async function collection(req: Request, env: EnvJeu, t: number): Promise<Response> {
  const me = await personnageDe(req, env, t);
  if (!me) return erreur("sans_personnage", 401);
  const r = await env.DB.prepare(
    `SELECT c.personnage_id AS id, c.premier_scan_le, c.nb_scans, p.pseudo, p.type, p.couleur, p.attributs, p.classe, p.est_mj,
       (SELECT group_concat(DISTINCT e.faction_id) FROM etiquettes e WHERE e.personnage_id = p.id) AS factions
     FROM collection c JOIN personnages p ON p.id = c.personnage_id
     WHERE c.possesseur_id = ? ORDER BY c.premier_scan_le DESC`,
  ).bind(me.id).all<Record<string, unknown>>();
  return json({
    cartes: r.results.map((x) => ({
      ...x, attributs: JSON.parse(String(x.attributs)), est_mj: !!x.est_mj,
      factions: x.factions ? String(x.factions).split(",") : [],
    })),
  });
}
