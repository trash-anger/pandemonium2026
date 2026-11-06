// API du jeu. LOT-1 : scan, création du personnage, étiquettes multiples, collection, réintégration par PIN.
// LOT-2 : faux souvenirs, jauge de mémoire, réactions, temps d'écran.
// Specs : FEAT-002 à FEAT-006, FEAT-014, FEAT-019. Le serveur est la source de vérité (DEC-052).
import { signer, verifier } from "./auth";
import { ATTRIBUTS, auHasard, CLASSES, COULEURS, FACTIONS, genererPseudo, TYPES, tirerFaction, type Langue } from "./catalogue";
import { normaliserCode } from "./codes";
import { baremeDe, lireParametres, type Heures } from "./config";
import { crediterScan, heuresIso, routeDirect, type Joueur } from "./direct";
import { routeRevelation } from "./revelation";
import { effetActif, effetsEnCours, expirerMissions, legendesDe, missionActive, pauseEnCours, scanMJ, verifierMissions } from "./mj";
import { brouiller, estFlou, fauxSouvenir, grainePaire, type PersoSouvenir } from "./souvenirs";
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


async function maxFactions(db: D1Database): Promise<number> {
  return (await lireParametres(db)).surconsommation.max_factions ?? 3;
}

// ---------- Faux souvenirs et jauge de mémoire (FEAT-006, barème §3) ----------
/** Réactions d'Halloween, liste fermée (RG-014-3). */
export const EMOJIS_REACTION = ["🎃", "👻", "💀", "🦇", "🕷️", "🧛", "🔮", "🖤"];
const UNE_HEURE_MS = 3_600_000;

async function joueurDe(env: EnvJeu, id: string): Promise<Joueur> {
  return (await env.DB.prepare("SELECT id, est_mj, surconsommation FROM personnages WHERE id = ?").bind(id).first<Joueur>()) ?? { id, est_mj: 0, surconsommation: 0 };
}

const versSouvenir = (p: LignePerso): PersoSouvenir => ({ id: p.id, pseudo: p.pseudo, type: p.type, couleur: p.couleur, attributs: JSON.parse(p.attributs) });

/** Souvenir commun vu par « me » : identique des deux côtés, sauf s'il est flou dans sa propre mémoire. */
function souvenirVu(me: LignePerso, autre: PersoSouvenir, seuilFlou: number) {
  const g = grainePaire(me.id, autre.id);
  const flou = estFlou(me.souvenirs, seuilFlou, g);
  const texte = (l: Langue) => {
    const s = fauxSouvenir(versSouvenir(me), autre, l);
    return flou ? brouiller(s, g) : s;
  };
  return { fr: texte("fr"), en: texte("en"), flou };
}

async function mesReactions(env: EnvJeu, auteur: string, cible: string): Promise<string[]> {
  const r = await env.DB.prepare("SELECT emoji FROM reactions WHERE auteur_id = ? AND cible_id = ? ORDER BY pose_le").bind(auteur, cible).all<{ emoji: string }>();
  return r.results.map((x) => x.emoji);
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
  souvenirs: number; temps_ecran_s: number; bloque_cause: string | null; suspendu: number;
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
    WHERE p.est_mj = 0 AND p.suspendu = 0 AND c.premier_scan_le < ?
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
  // RG-014-5 : le porteur ne voit que les totaux par emoji, jamais les auteurs
  const reac = (await env.DB.prepare("SELECT emoji, COUNT(*) AS n FROM reactions WHERE cible_id = ? GROUP BY emoji").bind(p.id).all<{ emoji: string; n: number }>()).results;
  return {
    personnage: {
      id: p.id, pseudo: p.pseudo, type: p.type, couleur: p.couleur, attributs: JSON.parse(p.attributs), classe: p.classe,
      photos_ok: !!p.photos_ok, est_mj: !!p.est_mj, surconsommation: !!p.surconsommation,
      bloque_jusqu_a: p.bloque_jusqu_a && p.bloque_jusqu_a > new Date(t).toISOString() ? p.bloque_jusqu_a : null,
      cree_le: p.cree_le, premier_scanne_le: p.premier_scanne_le, souvenirs: p.souvenirs, temps_ecran_s: p.temps_ecran_s,
      bloque_cause: p.bloque_jusqu_a && p.bloque_jusqu_a > new Date(t).toISOString() ? p.bloque_cause : null, suspendu: !!p.suspendu,
    },
    reactions: Object.fromEntries(EMOJIS_REACTION.map((e) => [e, reac.find((x) => x.emoji === e)?.n ?? 0]).filter(([, n]) => n)),
    etiquettes, badges, nb_cartes: nb?.n ?? 0, droits: droits(p, h, t), heures: h,
    medailles: await medaillesDe(env, p.id, h),
    factions: await factionsDe(env, p.id),
    partie: await pouls(env),
    ...(await personnel(env, p.id, t)),
  };
}

/** Mission personnelle du MJ et effets en cours (légendaires, solde privée) : dans /api/moi et /api/notifs. */
async function personnel(env: EnvJeu, id: string, t: number) {
  await expirerMissions(env, t, id);
  return { mission_mj: await missionActive(env.DB, id), effets: await effetsEnCours(env.DB, id, t) };
}

/** GET /api/notifs?apres=N : messages personnels (sanctions, missions) ; sans N, ceux des 30 dernières minutes. */
async function notifs(req: Request, env: EnvJeu, t: number, url: URL): Promise<Response> {
  const me = await personnageDe(req, env, t);
  if (!me) return erreur("sans_personnage", 401);
  const extra = await personnel(env, me.id, t);
  const apres = Number(url.searchParams.get("apres"));
  const q = Number.isFinite(apres) && apres >= 0 && url.searchParams.has("apres")
    ? env.DB.prepare("SELECT id, type, donnees, le FROM notifs WHERE personnage_id = ? AND id > ? ORDER BY id LIMIT 20").bind(me.id, apres)
    : env.DB.prepare("SELECT id, type, donnees, le FROM notifs WHERE personnage_id = ? AND le >= ? ORDER BY id LIMIT 20").bind(me.id, new Date(t - 30 * 60_000).toISOString());
  const n = (await q.all<{ id: number; type: string; donnees: string; le: string }>()).results.map((x) => ({ ...x, donnees: JSON.parse(x.donnees) }));
  const dernier = (await env.DB.prepare("SELECT MAX(id) AS m FROM notifs WHERE personnage_id = ?").bind(me.id).first<{ m: number | null }>())?.m ?? 0;
  return json({ notifs: n, dernier, ...extra, bloque_jusqu_a: me.bloque_jusqu_a && me.bloque_jusqu_a > new Date(t).toISOString() ? me.bloque_jusqu_a : null, suspendu: !!me.suspendu });
}

/** Preuve sociale (écran « Ta mission ») : joueurs lancés et record de cartes. Le MJ ne compte pas. */
async function pouls(env: EnvJeu) {
  const j = await env.DB.prepare("SELECT COUNT(*) AS n FROM personnages WHERE est_mj = 0").first<{ n: number }>();
  const r = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM collection c JOIN personnages p ON p.id = c.possesseur_id WHERE p.est_mj = 0 GROUP BY c.possesseur_id ORDER BY n DESC LIMIT 1",
  ).first<{ n: number }>();
  return { joueurs: j?.n ?? 0, record: r?.n ?? 0 };
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

const PALIERS_RESCAN: Record<number, string> = { 3: "boucle_detectee", 6: "jour_marmotte", 13: "client_maudit" };

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
    if (p === "/api/direct" && req.method === "GET") return routeDirect(req, env, t, devActif(env) && req.headers.has("X-Dev-Maintenant"));
    if (p === "/api/notifs" && req.method === "GET") return notifs(req, env, t, url);
    if (p === "/api/revelation" && req.method === "GET") return routeRevelation(req, env, t, devActif(env) && req.headers.has("X-Dev-Maintenant"));
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
    if (p === "/api/reaction") return reagir(req, env, t, corps);
    if (p === "/api/ecran") return tempsEcran(req, env, t, corps);
    if (p === "/api/installe") {
      // BDG-4 : l'app signale qu'elle tourne installée (display-mode standalone)
      const me = await personnageDe(req, env, t);
      if (!me) return erreur("sans_personnage", 401);
      return json({ badge: (await donnerBadge(env, me.id, "installe_portail", t)) ? "installe_portail" : null });
    }
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

  const etiquetteMJ = e.role === "personnelle_mj" || e.role === "speciale_mj";
  const enregistrer = async (resultat: string, reponse: object, cible: string | null = null, quete = 0) => {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO scans (id_client, scanneur_id, code, cible_id, source, resultat, horodatage_client, horodatage_serveur, reponse, quete) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(idClient, me?.id ?? null, e.code, cible, source, resultat, typeof c.horodatage === "string" ? c.horodatage : null, iso, JSON.stringify(reponse), quete).run();
    // Missions personnelles (ADM-19) : vérifiées après chaque scan, et les « Livraison express » après un scan d'étiquette du MJ
    if (me) await verifierMissions(env, t, me.id, etiquetteMJ);
    return json(reponse);
  };

  if (e.etat === "desactivee") return json({ type: "retiree", code: e.code });
  if (iso < h.debut) return json({ type: "bientot", code: e.code, debut: h.debut });
  if (iso >= h.fin) return json({ type: "ferme", code: e.code });
  // ADM-18 niveau 5 « Interdit de magasin » : le personnage ne scanne plus
  if (me?.suspendu) return enregistrer("suspendu", { type: "suspendu", code: e.code });
  if (me?.bloque_jusqu_a && me.bloque_jusqu_a > iso) {
    const pause = me.bloque_cause === "pause" ? await pauseEnCours(env.DB, t) : null;
    return enregistrer("bloque", { type: "bloque", code: e.code, jusqu_a: me.bloque_jusqu_a, cause: me.bloque_cause, reouverture: pause?.fin ?? null });
  }
  if (etiquetteMJ && me) {
    // FEAT-022 : légendaire ou piège selon le mélange ; pause « Fermé pour inventaire » (ADM-17)
    const r = await scanMJ(env, t, me, e);
    if (r) return enregistrer(r.resultat, r.reponse);
  }
  if (e.role === "speciale_mj") return enregistrer("special", { type: "special", code: e.code }); // spectateur
  if (e.etat === "vierge") {
    // Pas d'effet tant que le joueur n'a pas répondu ou créé son personnage
    return json(me ? { type: "a_toi", code: e.code } : { type: "creation", code: e.code, mj: e.role === "personnelle_mj" });
  }
  // Étiquette réclamée
  const cible = e.personnage_id!;
  // Personnage suspendu (ADM-18 niveau 5) : ses étiquettes ne répondent plus
  if ((await env.DB.prepare("SELECT suspendu FROM personnages WHERE id = ?").bind(cible).first<{ suspendu: number }>())?.suspendu) {
    return json({ type: "retiree", code: e.code });
  }
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
    // BDG-18 : première personne de l'une de ses factions
    const memeFaction = await env.DB.prepare(
      "SELECT 1 AS x FROM etiquettes a JOIN etiquettes b ON a.faction_id = b.faction_id WHERE a.personnage_id = ? AND b.personnage_id = ? LIMIT 1",
    ).bind(me.id, cible).first();
    const badges = memeFaction && (await donnerBadge(env, me.id, "collegue_de_rayon", t)) ? ["collegue_de_rayon"] : [];
    const m = (await lireParametres(env.DB)).memoire;
    const credit = await crediterScan(env, t, me, await joueurDe(env, cible), "nouvelle");
    return enregistrer("nouvelle_carte", {
      type: "nouvelle_carte", code: e.code, carte, nb_cartes: nb?.n ?? 1, badges,
      souvenir: souvenirVu(me, carte!, m.seuil_flou), mes_reactions: [], quete_total: credit.total,
    }, cible, credit.quete);
  }
  return dejaVu(env, t, h, me, carte!, e.code, enregistrer);
}

/**
 * Rescan (FEAT-005) : compte une fois par fenêtre de 5 min et par paire (RG-005-3) ; paliers ×3, ×6, ×13 (RG-005-2).
 * Un rescan compté donne +1 souvenir au scanné ; au-delà de N rescans faits dans l'heure, le scanneur en perd 1 (barème §3).
 */
async function dejaVu(
  env: EnvJeu, t: number, h: Record<keyof Heures, string>, me: LignePerso, carte: PersoSouvenir, code: string,
  enregistrer: (resultat: string, reponse: object, cible: string | null, quete?: number) => Promise<Response>,
): Promise<Response> {
  const iso = new Date(t).toISOString(), cible = carte.id;
  const params = await lireParametres(env.DB), m = params.memoire;
  // L-6 « Boucle temporelle » : pendant 10 min, chaque rescan compte, sans délai
  const fenetreMin = (await effetActif(env.DB, me.id, "L-6", t)) ? 0 : Math.max(0, Number(params.rescan?.fenetre_min) || 0);
  const dejaRescanne = await env.DB.prepare("SELECT 1 AS x FROM scans WHERE scanneur_id = ? AND resultat IN ('deja_vu', 'deja_vu_repete') LIMIT 1").bind(me.id).first();
  const fenetre = new Date(t - fenetreMin * 60_000).toISOString();
  const maj = await env.DB.prepare(
    "UPDATE collection SET nb_scans = nb_scans + 1, dernier_scan_le = ? WHERE possesseur_id = ? AND personnage_id = ? AND dernier_scan_le <= ?",
  ).bind(iso, me.id, cible, fenetre).run();
  const compte = maj.meta.changes > 0;
  const n = (await env.DB.prepare("SELECT nb_scans AS n FROM collection WHERE possesseur_id = ? AND personnage_id = ?").bind(me.id, cible).first<{ n: number }>())?.n ?? 2;
  const badges: string[] = [];
  const palier = compte && PALIERS_RESCAN[n] ? n : null;
  if (palier && (await donnerBadge(env, me.id, PALIERS_RESCAN[palier], t))) badges.push(PALIERS_RESCAN[palier]);

  let perte = false;
  const credit = compte ? await crediterScan(env, t, me, await joueurDe(env, cible), "rescan") : { quete: 0, total: null };
  if (compte) {
    await env.DB.prepare("UPDATE personnages SET souvenirs = souvenirs + 1 WHERE id = ?").bind(cible).run(); // RG-005-6
    const dansLHeure = await env.DB.prepare("SELECT COUNT(*) AS n FROM scans WHERE scanneur_id = ? AND resultat = 'deja_vu' AND horodatage_serveur > ?")
      .bind(me.id, new Date(t - UNE_HEURE_MS).toISOString()).first<{ n: number }>();
    if ((dansLHeure?.n ?? 0) >= baremeDe(params).rescans_par_heure) {
      // Boucle infinie (RG-005-5) : la jauge ne descend pas sous 0 ; à 0, badge « Amnésie »
      const r = await env.DB.prepare("UPDATE personnages SET souvenirs = souvenirs - 1 WHERE id = ? AND souvenirs > 0").bind(me.id).run();
      perte = r.meta.changes > 0;
      me = { ...me, souvenirs: Math.max(0, me.souvenirs - (perte ? 1 : 0)) };
      if (me.souvenirs === 0 && (await donnerBadge(env, me.id, "amnesie", t))) badges.push("amnesie");
    }
  }

  // RG-005-7 « Fermer la boucle » : en fin de soirée (dernière heure avant la révélation et après), rescanner sa toute première personne
  if (iso >= new Date(Date.parse(h.revelation) - UNE_HEURE_MS).toISOString()) {
    const premiere = await env.DB.prepare("SELECT personnage_id AS id FROM collection WHERE possesseur_id = ? ORDER BY premier_scan_le LIMIT 1").bind(me.id).first<{ id: string }>();
    if (premiere?.id === cible && (await donnerBadge(env, me.id, "fermer_boucle", t))) badges.push("fermer_boucle");
  }

  // ×13 : la liste des heures de scan, comme un ticket de caisse (textes §2)
  const heures = palier === 13
    ? [...(await env.DB.prepare("SELECT horodatage_serveur AS h FROM scans WHERE scanneur_id = ? AND cible_id = ? AND resultat IN ('nouvelle_carte', 'deja_vu') ORDER BY horodatage_serveur")
        .bind(me.id, cible).all<{ h: string }>()).results.map((x) => x.h), iso].slice(-13)
    : undefined;
  return enregistrer(compte ? "deja_vu" : "deja_vu_repete", {
    type: "deja_vu", code, carte, n, compte, fenetre_min: fenetreMin, badges, palier, heures,
    premier_rescan: !dejaRescanne, // CA-005-4 : l'invitation ne s'affiche qu'une fois
    souvenir: souvenirVu(me, carte, m.seuil_flou), souvenirs: me.souvenirs, perte,
    mes_reactions: await mesReactions(env, me.id, cible), quete_total: credit.total,
  }, cible, credit.quete);
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
      `INSERT INTO personnages (id, pseudo, type, couleur, attributs, classe, photos_ok, pin_sel, pin_empreinte, langue, est_mj, cree_le, souvenirs)
       SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM etiquettes WHERE code = ? AND etat = 'vierge')`,
    ).bind(id, tir.pseudo, v.type, v.couleur, JSON.stringify(v.attributs), tir.classe, c.photos ? 1 : 0, sel,
      await empreintePin(env, sel, String(c.pin)), langueDe(c.langue), e.role === "personnelle_mj" ? 1 : 0, iso,
      (await lireParametres(env.DB)).memoire.depart, e.code),
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
    await env.DB.prepare("UPDATE personnages SET surconsommation = 1, bloque_jusqu_a = ?, bloque_cause = 'surconsommation' WHERE id = ?").bind(jusqu_a, me.id).run();
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
  const seuil = (await lireParametres(env.DB)).memoire.seuil_flou;
  const reac = (await env.DB.prepare("SELECT cible_id AS c, emoji FROM reactions WHERE auteur_id = ? ORDER BY pose_le").bind(me.id).all<{ c: string; emoji: string }>()).results;
  return json({
    souvenirs: me.souvenirs,
    legendes: await legendesDe(env.DB, versSouvenir(me), t),
    cartes: r.results.map((x) => {
      const attributs = JSON.parse(String(x.attributs));
      const id = String(x.id);
      return {
        ...x, attributs, est_mj: !!x.est_mj,
        factions: x.factions ? String(x.factions).split(",") : [],
        souvenir: souvenirVu(me, { id, pseudo: String(x.pseudo), type: String(x.type), couleur: String(x.couleur), attributs }, seuil),
        mes_reactions: reac.filter((y) => y.c === id).map((y) => y.emoji),
      };
    }),
  });
}

/** Réaction en un toucher sur une carte de sa collection (FEAT-014) ; actif: false la retire (RG-014-4). */
async function reagir(req: Request, env: EnvJeu, t: number, c: Record<string, unknown>): Promise<Response> {
  const me = await personnageDe(req, env, t);
  if (!me) return erreur("sans_personnage", 401);
  const cible = String(c.cible ?? ""), emoji = String(c.emoji ?? "");
  if (!EMOJIS_REACTION.includes(emoji)) return erreur("emoji_invalide");
  const connue = await env.DB.prepare("SELECT 1 AS x FROM collection WHERE possesseur_id = ? AND personnage_id = ?").bind(me.id, cible).first();
  if (!connue) return erreur("hors_collection", 403);
  if (c.actif === false) {
    await env.DB.prepare("DELETE FROM reactions WHERE auteur_id = ? AND cible_id = ? AND emoji = ?").bind(me.id, cible, emoji).run();
  } else {
    await env.DB.prepare("INSERT OR IGNORE INTO reactions (auteur_id, cible_id, emoji, pose_le) VALUES (?, ?, ?, ?)").bind(me.id, cible, emoji, new Date(t).toISOString()).run();
  }
  return json({ mes_reactions: await mesReactions(env, me.id, cible) });
}

/**
 * Temps d'écran (RG-015-4) : l'app envoie les secondes passées au premier plan depuis son dernier envoi.
 * Le cumul ne dépasse jamais le temps réellement écoulé depuis la création du personnage (et s'arrête à la fin du jeu).
 */
async function tempsEcran(req: Request, env: EnvJeu, t: number, c: Record<string, unknown>): Promise<Response> {
  const me = await personnageDe(req, env, t);
  if (!me) return erreur("sans_personnage", 401);
  const s = Math.floor(Number(c.secondes));
  if (!Number.isFinite(s) || s <= 0) return json({ temps_ecran_s: me.temps_ecran_s });
  const h = await heuresIso(env.DB);
  const plafond = Math.max(0, Math.floor((Math.min(t, Date.parse(h.fin)) - Date.parse(me.cree_le)) / 1000));
  await env.DB.prepare("UPDATE personnages SET temps_ecran_s = MIN(temps_ecran_s + ?, ?) WHERE id = ?").bind(Math.min(s, 6 * 3600), plafond, me.id).run();
  const r = await env.DB.prepare("SELECT temps_ecran_s AS s FROM personnages WHERE id = ?").bind(me.id).first<{ s: number }>();
  return json({ temps_ecran_s: r?.s ?? 0 });
}
