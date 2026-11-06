// Costume du MJ et animation en direct (LOT-3, étape C).
// - FEAT-022 : 10 légendaires et 5 pièges redistribués toutes les 20 min entre les étiquettes spéciales.
// - ADM-17 : pause « Fermé pour inventaire ». ADM-18 : derniers clients et sanctions. ADM-19 : missions personnelles.
// Heure de référence : une action du MJ sur un joueur part de la dernière activité de ce joueur si elle est
// plus tard que l'heure réelle (téléphones du banc en heure simulée) ; en production, c'est l'heure réelle.
import { HEURES_PAR_DEFAUT, lireConfig, lireParametres, type Heures } from "./config";
import { ajouterPoints, evenement, heuresIso } from "./direct";
import { bancEnvironnement, type EnvMode } from "./mode";
import { fauxSouvenir, type PersoSouvenir } from "./souvenirs";
import { localVersIso } from "./temps";
import type { Langue } from "./catalogue";

export interface EnvMJ extends EnvMode { DB: D1Database; SESSION_SECRET?: string }

export const LEGENDAIRES = ["L-1", "L-2", "L-3", "L-4", "L-5", "L-6", "L-7", "L-8", "L-9", "L-10"] as const;
export const PIEGES = ["T-1", "T-2", "T-3", "T-4", "T-5"] as const;
export const EFFETS_SPECIAUX = [...LEGENDAIRES, ...PIEGES];
/** Durée (min) des légendaires limitées dans le temps ; usages des légendaires à consommer. */
const DUREE_EFFET_MIN: Record<string, number> = { "L-1": 30, "L-3": 10, "L-6": 10, "L-10": 15 };
const USAGES: Record<string, number> = { "L-2": 1, "L-4": 1, "L-5": 3 };
const POINTS_LEGENDAIRE = 15; // barème §2
const PAUSE_BLOCAGE_MIN = 2; // RG-020-5
const MIN = 60_000;
const iso = (t: number) => new Date(t).toISOString();

// ---------- Heures de référence ----------
/** Heure d'un joueur : sa dernière activité si elle dépasse l'heure réelle (banc en heure simulée). */
export async function heureDuJoueur(db: D1Database, id: string): Promise<number> {
  const r = await db.prepare("SELECT MAX(vu_le) AS v FROM appareils WHERE personnage_id = ?").bind(id).first<{ v: string | null }>();
  return Math.max(Date.now(), r?.v ? Date.parse(r.v) : 0);
}
/** Heure d'une action globale (pause) : réelle en production ; ailleurs, l'heure du banc si elle est plus tard. */
export async function heureGlobale(env: EnvMJ): Promise<number> {
  if (!bancEnvironnement(env)) return Date.now();
  const r = await env.DB.prepare("SELECT MAX(vu_le) AS v FROM appareils").first<{ v: string | null }>();
  return Math.max(Date.now(), r?.v ? Date.parse(r.v) : 0);
}

// ---------- Mélange toutes les 20 min (RG-022-9, CA-022-3) ----------
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Graine tirée d'un secret du serveur : le code étant public, l'attribution ne doit pas être calculable. */
async function graine(secret: string, texte: string): Promise<number> {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(texte)));
  return ((s[0] << 24) | (s[1] << 16) | (s[2] << 8) | s[3]) >>> 0;
}

export async function attribution(env: EnvMJ, t: number) {
  const h = await heuresIso(env.DB), p = await lireParametres(env.DB);
  const pas = Math.max(1, Number(p.legendaires.melange_min) || 20) * MIN;
  const periode = Math.max(0, Math.floor((t - Date.parse(h.debut)) / pas));
  const tags = (await env.DB.prepare("SELECT code, banc FROM etiquettes WHERE role = 'speciale_mj' AND etat <> 'desactivee' ORDER BY code")
    .all<{ code: string; banc: number }>()).results;
  const effets = new Map<string, string>();
  // Les étiquettes du banc ont leur propre mélange, pour ne jamais toucher aux vraies
  for (const banc of [0, 1]) {
    const groupe = tags.filter((x) => (x.banc ? 1 : 0) === banc);
    if (!groupe.length) continue;
    const alea = mulberry32(await graine(env.SESSION_SECRET || "dev-seulement", `melange:${periode}:${banc}`));
    const perm = [...EFFETS_SPECIAUX];
    for (let i = perm.length - 1; i > 0; i--) { const j = Math.floor(alea() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
    groupe.forEach((x, i) => effets.set(x.code, perm[i % perm.length]));
  }
  return { periode, prochain: iso(Date.parse(h.debut) + (periode + 1) * pas), effets };
}

// ---------- Pause « Fermé pour inventaire » (ADM-17) ----------
export async function pauseEnCours(db: D1Database, t: number) {
  return db.prepare("SELECT id, debut, fin FROM evenements WHERE type = 'pause' AND debut <= ? AND (fin IS NULL OR fin > ?) ORDER BY id DESC LIMIT 1")
    .bind(iso(t), iso(t)).first<{ id: number; debut: string; fin: string | null }>();
}
export async function ouvrirPause(env: EnvMJ, minutes: number, auteur: string) {
  const t = await heureGlobale(env);
  await fermerPause(env);
  await evenement(env.DB, { type: "pause", donnees: { minutes }, debut: iso(t), fin: minutes > 0 ? iso(t + minutes * MIN) : null, auteur });
}
export async function fermerPause(env: EnvMJ) {
  const t = await heureGlobale(env);
  await env.DB.prepare("UPDATE evenements SET fin = ? WHERE type = 'pause' AND (fin IS NULL OR fin > ?)").bind(iso(t), iso(t)).run();
}

// ---------- Dernier exemplaire (L-7) : remis en rayon à 21 h, minuit et 3 h ----------
async function heuresLocales(db: D1Database): Promise<Heures> {
  return { ...HEURES_PAR_DEFAUT, ...((await lireConfig(db, "heures")) as Partial<Heures>) };
}
/** Dernière remise en rayon passée (ISO), ou null avant la première. Une remise pendant une pause attend la fin de la pause (RG-020-6). */
export async function remiseEnRayon(db: D1Database, t: number): Promise<{ courante: string | null; prochaine: string | null }> {
  const h = await heuresLocales(db), p = await lireParametres(db);
  const jour = h.debut.slice(0, 10), lendemain = iso(Date.parse(jour + "T12:00:00Z") + 24 * 3600_000).slice(0, 10);
  const pauses = (await db.prepare("SELECT debut, fin FROM evenements WHERE type = 'pause'").all<{ debut: string; fin: string | null }>()).results;
  const remises = (p.legendaires.dernier_exemplaire as string[]).map((hh) => {
    let r = localVersIso(`${Number(hh.slice(0, 2)) >= 12 ? jour : lendemain}T${hh}`);
    for (const x of pauses) if (x.debut <= r && (!x.fin || x.fin > r)) r = x.fin ?? "9999";
    return r;
  }).sort();
  const maintenant = iso(t);
  return { courante: remises.filter((r) => r <= maintenant).pop() ?? null, prochaine: remises.find((r) => r > maintenant && r < "9999") ?? null };
}

// ---------- Effets en cours ----------
export async function effetActif(db: D1Database, id: string, effet: string, t: number): Promise<boolean> {
  return !!(await db.prepare("SELECT 1 AS x FROM effets WHERE personnage_id = ? AND effet = ? AND ((fin IS NOT NULL AND fin > ?) OR (reste IS NOT NULL AND reste > 0))")
    .bind(id, effet, iso(t)).first());
}
/** Consomme un usage (L-2, L-5, M-6…) ; vrai s'il en restait un. */
export async function consommer(db: D1Database, id: string, effet: string): Promise<boolean> {
  const r = await db.prepare("UPDATE effets SET reste = reste - 1 WHERE personnage_id = ? AND effet = ? AND reste > 0").bind(id, effet).run();
  return r.meta.changes > 0;
}
/** Effets visibles par le joueur : en cours (fin à venir ou usages restants). */
export async function effetsEnCours(db: D1Database, id: string, t: number) {
  return (await db.prepare("SELECT effet, fin, reste FROM effets WHERE personnage_id = ? AND ((fin IS NOT NULL AND fin > ?) OR (reste IS NOT NULL AND reste > 0)) ORDER BY obtenu_le")
    .bind(id, iso(t)).all<{ effet: string; fin: string | null; reste: number | null }>()).results;
}

async function donnerBadge(db: D1Database, id: string, badge: string, t: number) {
  return (await db.prepare("INSERT OR IGNORE INTO badges (personnage_id, badge, obtenu_le) VALUES (?, ?, ?)").bind(id, badge, iso(t)).run()).meta.changes > 0;
}
async function bloquer(db: D1Database, id: string, jusqu_a: string, cause: string) {
  await db.prepare("UPDATE personnages SET bloque_cause = CASE WHEN COALESCE(bloque_jusqu_a, '') < ?1 THEN ?2 ELSE bloque_cause END, bloque_jusqu_a = MAX(COALESCE(bloque_jusqu_a, ''), ?1) WHERE id = ?3")
    .bind(jusqu_a, cause, id).run();
}
export async function notifier(db: D1Database, id: string, type: string, donnees: object, t: number) {
  await db.prepare("INSERT INTO notifs (personnage_id, type, donnees, le) VALUES (?, ?, ?, ?)").bind(id, type, JSON.stringify(donnees), iso(t)).run();
}

// ---------- L-9 « Ticket de caisse infini » : toutes vos vies antérieures avec le MJ ----------
export async function ticketInfini(db: D1Database, moi: PersoSouvenir) {
  const mj = await db.prepare("SELECT id, pseudo, type, couleur, attributs FROM personnages WHERE est_mj = 1 ORDER BY cree_le LIMIT 1")
    .first<{ id: string; pseudo: string; type: string; couleur: string; attributs: string }>();
  const lui: PersoSouvenir = mj ? { ...mj, attributs: JSON.parse(mj.attributs) } : { id: "mj", pseudo: "MJ", type: "inclassable", couleur: "noir", attributs: ["chapeau", "cape"] };
  const vies = (l: Langue) => [1, 2, 3, 4, 5, 6].map((k) => `${l === "en" ? "Life" : "Vie"} n° ${k}. ${fauxSouvenir(moi, { ...lui, id: `${lui.id}#vie${k}` }, l)}`).join("\n\n");
  return { fr: vies("fr"), en: vies("en") };
}

interface Joueur { id: string; pseudo: string; type: string; couleur: string; attributs: string; est_mj: number; surconsommation: number }

/**
 * Scan d'une étiquette du MJ (personnelle ou spéciale) par un joueur. Renvoie null s'il faut suivre
 * le chemin normal (étiquette personnelle hors pause). Le MJ qui scanne voit l'effet sans le subir.
 */
export async function scanMJ(env: EnvMJ, t: number, me: Joueur, e: { code: string; role: string }): Promise<{ resultat: string; reponse: Record<string, unknown> } | null> {
  const db = env.DB;
  const pause = me.est_mj ? null : await pauseEnCours(db, t);
  if (pause) {
    // RG-020-5 : toutes ses étiquettes deviennent un piège spécial, 2 min à chaque scan, hors « une seule fois »
    const jusqu_a = iso(t + PAUSE_BLOCAGE_MIN * MIN);
    await bloquer(db, me.id, jusqu_a, "pause");
    return { resultat: "pause", reponse: { type: "piege", code: e.code, effet: "pause", jusqu_a, reouverture: pause.fin } };
  }
  if (e.role !== "speciale_mj") return null;
  const effet = (await attribution(env, t)).effets.get(e.code);
  if (!effet) return { resultat: "special", reponse: { type: "special", code: e.code } };
  if (me.est_mj) return { resultat: "special_mj", reponse: { type: effet.startsWith("L") ? "legendaire" : "piege", code: e.code, effet, mj: true } };

  if (effet.startsWith("T")) {
    // RG-022-5 : un piège ne piège qu'une fois ; L-2 « Retour sans reçu » protège du prochain
    const deja = await db.prepare("SELECT 1 AS x FROM effets WHERE personnage_id = ? AND effet = ?").bind(me.id, effet).first();
    if (deja) return { resultat: "piege_deja", reponse: { type: "piege", code: e.code, effet, deja: true } };
    await db.prepare("INSERT INTO effets (personnage_id, effet, obtenu_le) VALUES (?, ?, ?)").bind(me.id, effet, iso(t)).run();
    if (await consommer(db, me.id, "L-2")) return { resultat: "piege_protege", reponse: { type: "piege", code: e.code, effet, protege: true } };
    const [a, b] = (await lireParametres(db)).pieges.blocage_min as number[];
    const minutes = a + Math.floor(Math.random() * (b - a + 1));
    const jusqu_a = iso(t + minutes * MIN);
    await bloquer(db, me.id, jusqu_a, effet);
    return { resultat: "piege", reponse: { type: "piege", code: e.code, effet, jusqu_a, minutes } };
  }

  // Légendaire : chaque effet une seule fois par joueur (RG-022-2)
  const deja = await db.prepare("SELECT 1 AS x FROM effets WHERE personnage_id = ? AND effet = ?").bind(me.id, effet).first();
  if (deja) return { resultat: "legendaire_deja", reponse: { type: "legendaire", code: e.code, effet, deja: true } };
  if (effet === "L-7") {
    const r = await remiseEnRayon(db, t);
    const vendu = r.courante && (await db.prepare("SELECT 1 AS x FROM effets WHERE effet = 'L-7' AND obtenu_le >= ?").bind(r.courante).first());
    if (!r.courante || vendu) return { resultat: "rupture", reponse: { type: "legendaire", code: e.code, effet, rupture: true, prochaine: r.prochaine } };
  }
  const fin = DUREE_EFFET_MIN[effet] ? iso(t + DUREE_EFFET_MIN[effet] * MIN) : null;
  const reste = USAGES[effet] ?? null;
  const ins = await db.prepare("INSERT OR IGNORE INTO effets (personnage_id, effet, obtenu_le, fin, reste) VALUES (?, ?, ?, ?, ?)").bind(me.id, effet, iso(t), fin, reste).run();
  if (!ins.meta.changes) return { resultat: "legendaire_deja", reponse: { type: "legendaire", code: e.code, effet, deja: true } };
  const badges: string[] = [];
  if (effet === "L-5" && (await donnerBadge(db, me.id, "anticapitaliste", t))) badges.push("anticapitaliste");
  if (effet === "L-8") await db.prepare("UPDATE personnages SET souvenirs = souvenirs + 3 WHERE id = ?").bind(me.id).run();
  if (effet === "L-10") {
    await evenement(db, { type: "vitrine", donnees: { pseudo: me.pseudo, type: me.type, couleur: me.couleur }, debut: iso(t), fin: iso(t + DUREE_EFFET_MIN["L-10"] * MIN) });
  }
  const n = (await db.prepare("SELECT COUNT(*) AS n FROM effets WHERE personnage_id = ? AND effet LIKE 'L-%'").bind(me.id).first<{ n: number }>())?.n ?? 0;
  if (n >= LEGENDAIRES.length && (await donnerBadge(db, me.id, "garde_robe_mj", t))) badges.push("garde_robe_mj");
  const points = await ajouterPoints(env, me.id, POINTS_LEGENDAIRE, "legendaire", t, { surconso: !!me.surconsommation });
  const souvenir = effet === "L-9" ? await ticketInfini(db, { id: me.id, pseudo: me.pseudo, type: me.type, couleur: me.couleur, attributs: JSON.parse(me.attributs) }) : undefined;
  return { resultat: "legendaire", reponse: { type: "legendaire", code: e.code, effet, fin, reste, badges, points, souvenir, collection: n } };
}

/** Légendes de la collection (RG-022-1) : les légendaires obtenues, avec leur état. */
export async function legendesDe(db: D1Database, moi: PersoSouvenir, t: number) {
  const r = (await db.prepare("SELECT effet, obtenu_le, fin, reste FROM effets WHERE personnage_id = ? AND effet LIKE 'L-%' ORDER BY obtenu_le").bind(moi.id)
    .all<{ effet: string; obtenu_le: string; fin: string | null; reste: number | null }>()).results;
  return Promise.all(r.map(async (x) => ({
    ...x, actif: (!!x.fin && x.fin > iso(t)) || (x.reste ?? 0) > 0,
    ...(x.effet === "L-9" ? { souvenir: await ticketInfini(db, moi) } : {}),
  })));
}

// ---------- Sanctions graduées (ADM-18) ----------
export async function sanctionner(env: EnvMJ, id: string, niveau: number, auteur: string) {
  const db = env.DB, t = await heureDuJoueur(db, id);
  const p = await db.prepare("SELECT souvenirs FROM personnages WHERE id = ?").bind(id).first<{ souvenirs: number }>();
  if (!p || niveau < 1 || niveau > 5) return false;
  const d: Record<string, unknown> = {};
  if (niveau === 1) d.badge = await donnerBadge(db, id, "client_difficile", t);
  if (niveau === 2) await bloquer(db, id, iso(t + 5 * MIN), "sanction");
  if (niveau === 3) {
    // Corruption de 10 min sans immunité : prise en compte par le chat noir (LOT-4)
    await db.prepare("INSERT INTO effets (personnage_id, effet, obtenu_le, fin) VALUES (?, 'S-3', ?, ?) ON CONFLICT DO UPDATE SET obtenu_le = excluded.obtenu_le, fin = excluded.fin")
      .bind(id, iso(t), iso(t + 10 * MIN)).run();
    d.souvenirs = Math.min(5, p.souvenirs);
    await db.prepare("UPDATE personnages SET souvenirs = souvenirs - ? WHERE id = ?").bind(d.souvenirs, id).run();
  }
  if (niveau === 4) {
    await bloquer(db, id, iso(t + 30 * MIN), "sanction");
    d.points = await ajouterPoints(env, id, -100, "sanction", t, { repartir: true });
    d.souvenirs = p.souvenirs;
    await db.prepare("UPDATE personnages SET souvenirs = 0 WHERE id = ?").bind(id).run();
  }
  if (niveau === 5) await db.prepare("UPDATE personnages SET suspendu = 1 WHERE id = ?").bind(id).run();
  await db.prepare("INSERT INTO sanctions (personnage_id, niveau, le, auteur, donnees) VALUES (?, ?, ?, ?, ?)").bind(id, niveau, iso(t), auteur, JSON.stringify(d)).run();
  await notifier(db, id, "sanction", { niveau }, t);
  return true;
}

/** RG-020-10 : toute sanction est annulable ; ce qui a été retiré est rendu. */
export async function annulerSanction(env: EnvMJ, sid: number) {
  const db = env.DB;
  const s = await db.prepare("SELECT * FROM sanctions WHERE id = ? AND annulee_le IS NULL").bind(sid).first<{ personnage_id: string; niveau: number; donnees: string }>();
  if (!s) return null;
  const id = s.personnage_id, d = JSON.parse(s.donnees) as { badge?: boolean; souvenirs?: number; points?: number };
  const t = await heureDuJoueur(db, id);
  if (s.niveau === 1 && d.badge) await db.prepare("DELETE FROM badges WHERE personnage_id = ? AND badge = 'client_difficile'").bind(id).run();
  if (s.niveau === 2 || s.niveau === 4) await db.prepare("UPDATE personnages SET bloque_jusqu_a = NULL, bloque_cause = NULL WHERE id = ? AND bloque_cause = 'sanction'").bind(id).run();
  if (s.niveau === 3) await db.prepare("DELETE FROM effets WHERE personnage_id = ? AND effet = 'S-3'").bind(id).run();
  if (d.souvenirs) await db.prepare("UPDATE personnages SET souvenirs = souvenirs + ? WHERE id = ?").bind(d.souvenirs, id).run();
  if (d.points) await ajouterPoints(env, id, -d.points, "sanction_annulee", t, { repartir: true });
  if (s.niveau === 5) await db.prepare("UPDATE personnages SET suspendu = 0 WHERE id = ?").bind(id).run();
  await db.prepare("UPDATE sanctions SET annulee_le = ? WHERE id = ?").bind(iso(t), sid).run();
  await notifier(db, id, "sanction_annulee", { niveau: s.niveau }, t);
  return s;
}

// ---------- Missions personnelles (ADM-19) ----------
export const MISSIONS: Record<string, { duree: number; points?: number; souvenirs?: number }> = {
  "M-1": { duree: 10, points: 20 }, "M-2": { duree: 20, points: 30 }, "M-3": { duree: 10, souvenirs: 3 },
  "M-4": { duree: 15, points: 20 }, "M-5": { duree: 10, points: 20 }, "M-6": { duree: 0 }, "M-7": { duree: 15 },
};
export const RECOMPENSES_M7 = ["points", "souvenirs", "solde"] as const;
const ROLES_MJ = "('personnelle_mj', 'speciale_mj')";

interface Mission { id: number; personnage_id: string; code: string; donnees: string; debut: string; fin: string | null; etat: string }

export async function missionActive(db: D1Database, id: string) {
  const m = await db.prepare("SELECT id, code, donnees, debut, fin FROM missions WHERE personnage_id = ? AND etat = 'active' ORDER BY id DESC LIMIT 1")
    .bind(id).first<{ id: number; code: string; donnees: string; debut: string; fin: string | null }>();
  return m ? { ...m, donnees: JSON.parse(m.donnees) } : null;
}

export async function confierMission(env: EnvMJ, id: string, code: string, auteur: string, dureeMin?: number): Promise<string | null> {
  const db = env.DB, def = MISSIONS[code];
  if (!def) return "Mission inconnue";
  if (await missionActive(db, id)) return "Ce joueur a déjà une mission en cours (une seule à la fois).";
  const t = await heureDuJoueur(db, id);
  const d: Record<string, unknown> = {};
  if (code === "M-3") {
    const p = await db.prepare("SELECT personnage_id AS id FROM collection WHERE possesseur_id = ? ORDER BY premier_scan_le LIMIT 1").bind(id).first<{ id: string }>();
    if (!p) return "Ce joueur n'a encore rencontré personne : pas de « toute première rencontre ».";
    d.premier = p.id;
  }
  if (code === "M-4") d.attributs = await deuxAttributs(db, id);
  if (code === "M-6") {
    // Cadeau : ses 5 prochaines nouvelles cartes comptent double
    await db.prepare("INSERT INTO effets (personnage_id, effet, obtenu_le, reste) VALUES (?, 'M-6', ?, 5) ON CONFLICT DO UPDATE SET reste = COALESCE(reste, 0) + 5")
      .bind(id, iso(t)).run();
    await db.prepare("INSERT INTO missions (personnage_id, code, donnees, debut, etat, auteur, termine_le) VALUES (?, 'M-6', '{}', ?, 'offerte', ?, ?)").bind(id, iso(t), auteur, iso(t)).run();
    await notifier(db, id, "mission", { code, offerte: true }, t);
    return null;
  }
  const duree = code === "M-7" && dureeMin ? Math.max(1, Math.min(120, dureeMin)) : def.duree;
  const fin = iso(t + duree * MIN);
  await db.prepare("INSERT INTO missions (personnage_id, code, donnees, debut, fin, auteur) VALUES (?, ?, ?, ?, ?, ?)").bind(id, code, JSON.stringify(d), iso(t), fin, auteur).run();
  await notifier(db, id, "mission", { code, fin, ...d }, t);
  return null;
}

/** M-4 : deux attributs portés ensemble par au moins un autre joueur, pour que la mission soit faisable. */
async function deuxAttributs(db: D1Database, id: string): Promise<string[]> {
  const r = (await db.prepare("SELECT attributs FROM personnages WHERE id <> ? AND est_mj = 0 AND suspendu = 0 AND json_array_length(attributs) >= 2 ORDER BY random() LIMIT 1")
    .bind(id).first<{ attributs: string }>());
  const a = r ? (JSON.parse(r.attributs) as string[]) : ["masque", "cape"];
  const i = Math.floor(Math.random() * a.length);
  let j = Math.floor(Math.random() * (a.length - 1)); if (j >= i) j++;
  return [a[i], a[j]];
}

async function remplie(db: D1Database, m: Mission): Promise<boolean> {
  const d = JSON.parse(m.donnees) as { premier?: string; attributs?: string[] };
  const id = m.personnage_id;
  if (m.code === "M-1") {
    return ((await db.prepare("SELECT COUNT(*) AS n FROM scans WHERE scanneur_id = ? AND resultat = 'nouvelle_carte' AND horodatage_serveur >= ?").bind(id, m.debut).first<{ n: number }>())?.n ?? 0) >= 3;
  }
  if (m.code === "M-2") {
    return ((await db.prepare(
      "SELECT COUNT(DISTINCT e.faction_id) AS n FROM scans s JOIN etiquettes e ON e.personnage_id = s.cible_id WHERE s.scanneur_id = ? AND s.resultat IN ('nouvelle_carte', 'deja_vu', 'deja_vu_repete') AND s.horodatage_serveur >= ? AND e.faction_id IS NOT NULL",
    ).bind(id, m.debut).first<{ n: number }>())?.n ?? 0) >= 5;
  }
  if (m.code === "M-3") {
    return !!(await db.prepare("SELECT 1 AS x FROM scans WHERE scanneur_id = ? AND cible_id = ? AND resultat IN ('deja_vu', 'deja_vu_repete') AND horodatage_serveur >= ?").bind(id, d.premier, m.debut).first());
  }
  if (m.code === "M-4") {
    const [a, b] = d.attributs ?? [];
    return !!(await db.prepare(
      `SELECT 1 AS x FROM scans s JOIN personnages p ON p.id = s.cible_id WHERE s.scanneur_id = ? AND s.horodatage_serveur >= ? AND s.resultat IN ('nouvelle_carte', 'deja_vu', 'deja_vu_repete')
       AND EXISTS (SELECT 1 FROM json_each(p.attributs) WHERE value = ?) AND EXISTS (SELECT 1 FROM json_each(p.attributs) WHERE value = ?) LIMIT 1`,
    ).bind(id, m.debut, a, b).first());
  }
  if (m.code === "M-5") {
    // Deux personnes qui n'avaient jamais scanné une étiquette du MJ le font pendant la mission
    return ((await db.prepare(
      `SELECT COUNT(DISTINCT s.scanneur_id) AS n FROM scans s JOIN etiquettes e ON e.code = s.code
       WHERE e.role IN ${ROLES_MJ} AND s.horodatage_serveur >= ?1 AND s.scanneur_id IS NOT NULL AND s.scanneur_id <> ?2
       AND s.scanneur_id NOT IN (SELECT s2.scanneur_id FROM scans s2 JOIN etiquettes e2 ON e2.code = s2.code WHERE e2.role IN ${ROLES_MJ} AND s2.horodatage_serveur < ?1 AND s2.scanneur_id IS NOT NULL)`,
    ).bind(m.debut, id).first<{ n: number }>())?.n ?? 0) >= 2;
  }
  return false; // M-7 : validée à la main
}

/** Vérifie la mission du joueur (après chacun de ses scans) et les « Livraison express » en cours (après un scan d'étiquette du MJ). */
export async function verifierMissions(env: EnvMJ, t: number, id: string, scanMJ = false) {
  await expirerMissions(env, t, id);
  const ids = [id];
  if (scanMJ) ids.push(...(await env.DB.prepare("SELECT personnage_id AS p FROM missions WHERE etat = 'active' AND code = 'M-5'").all<{ p: string }>()).results.map((x) => x.p));
  for (const p of new Set(ids)) {
    const m = await env.DB.prepare("SELECT * FROM missions WHERE personnage_id = ? AND etat = 'active' AND (fin IS NULL OR fin > ?)").bind(p, iso(t)).first<Mission>();
    if (m && (await remplie(env.DB, m))) await reussirMission(env, m.id, t);
  }
}

export async function expirerMissions(env: EnvMJ, t: number, id: string) {
  const m = (await env.DB.prepare("SELECT id, code FROM missions WHERE personnage_id = ? AND etat = 'active' AND fin IS NOT NULL AND fin <= ?").bind(id, iso(t)).all<{ id: number; code: string }>()).results;
  for (const x of m) {
    await env.DB.prepare("UPDATE missions SET etat = 'echouee', termine_le = ? WHERE id = ?").bind(iso(t), x.id).run();
    await notifier(env.DB, id, "mission_echouee", { code: x.code }, t); // RG-020-13 : aucune pénalité
  }
}

/** Réussite : récompense et badge « Employé du mois » (BDG-16). M-7 : récompense choisie par le MJ. */
export async function reussirMission(env: EnvMJ, mid: number, t?: number, recompense?: string) {
  const db = env.DB;
  const m = await db.prepare("SELECT * FROM missions WHERE id = ? AND etat = 'active'").bind(mid).first<Mission>();
  if (!m) return false;
  const id = m.personnage_id, tt = t ?? (await heureDuJoueur(db, id));
  const ok = await db.prepare("UPDATE missions SET etat = 'reussie', termine_le = ?, donnees = json_set(donnees, '$.recompense', ?) WHERE id = ? AND etat = 'active'")
    .bind(iso(tt), recompense ?? null, mid).run();
  if (!ok.meta.changes) return false;
  const def = MISSIONS[m.code];
  const r = m.code === "M-7" ? recompense ?? "points" : null;
  const surconso = !!(await db.prepare("SELECT surconsommation AS s FROM personnages WHERE id = ?").bind(id).first<{ s: number }>())?.s;
  if (def.points || r === "points") await ajouterPoints(env, id, def.points ?? 20, "mission", tt, { surconso });
  if (def.souvenirs || r === "souvenirs") await db.prepare("UPDATE personnages SET souvenirs = souvenirs + ? WHERE id = ?").bind(def.souvenirs ?? 3, id).run();
  if (r === "solde") {
    await db.prepare("INSERT INTO effets (personnage_id, effet, obtenu_le, reste) VALUES (?, 'M-6', ?, 5) ON CONFLICT DO UPDATE SET reste = COALESCE(reste, 0) + 5").bind(id, iso(tt)).run();
  }
  const badge = await donnerBadge(db, id, "employe_du_mois", tt);
  await notifier(db, id, "mission_reussie", { code: m.code, recompense: r ?? (def.points ? "points" : "souvenirs"), badge }, tt);
  return true;
}

export async function annulerMission(env: EnvMJ, mid: number) {
  const m = await env.DB.prepare("SELECT personnage_id AS p, code FROM missions WHERE id = ? AND etat = 'active'").bind(mid).first<{ p: string; code: string }>();
  if (!m) return false;
  const t = await heureDuJoueur(env.DB, m.p);
  await env.DB.prepare("UPDATE missions SET etat = 'annulee', termine_le = ? WHERE id = ?").bind(iso(t), mid).run();
  await notifier(env.DB, m.p, "mission_annulee", { code: m.code }, t);
  return true;
}

// ---------- Tableau du MJ ----------
export async function etatMJ(env: EnvMJ) {
  const db = env.DB, t = await heureGlobale(env);
  const a = await attribution(env, t);
  const codes = [...a.effets.entries()].map(([code, effet]) => ({ code, effet }));
  const obtenus = Object.fromEntries((await db.prepare("SELECT effet, COUNT(*) AS n FROM effets WHERE effet LIKE 'L-%' OR effet LIKE 'T-%' GROUP BY effet").all<{ effet: string; n: number }>()).results.map((x) => [x.effet, x.n]));
  const r = await remiseEnRayon(db, t);
  const vendu = r.courante ? !!(await db.prepare("SELECT 1 AS x FROM effets WHERE effet = 'L-7' AND obtenu_le >= ?").bind(r.courante).first()) : true;
  // Derniers clients : les 30 dernières minutes avant le dernier scan d'une étiquette du MJ (heure du banc comprise)
  const dernier = (await db.prepare(`SELECT MAX(s.horodatage_serveur) AS h FROM scans s JOIN etiquettes e ON e.code = s.code WHERE e.role IN ${ROLES_MJ} AND s.scanneur_id IS NOT NULL`).first<{ h: string | null }>())?.h;
  const clients = dernier ? (await db.prepare(
    `SELECT s.horodatage_serveur AS le, s.code, s.resultat, json_extract(s.reponse, '$.effet') AS effet, p.id, p.pseudo, p.type, p.suspendu, e.role
     FROM scans s JOIN etiquettes e ON e.code = s.code JOIN personnages p ON p.id = s.scanneur_id
     WHERE e.role IN ${ROLES_MJ} AND p.est_mj = 0 AND s.horodatage_serveur >= ? ORDER BY s.id DESC LIMIT 60`,
  ).bind(iso(Date.parse(dernier) - 30 * MIN)).all<{ le: string; code: string; resultat: string; effet: string | null; id: string; pseudo: string; type: string; suspendu: number; role: string }>()).results : [];
  const missions = (await db.prepare("SELECT m.id, m.code, m.fin, m.donnees, p.pseudo, p.id AS pid FROM missions m JOIN personnages p ON p.id = m.personnage_id WHERE m.etat = 'active' ORDER BY m.id DESC")
    .all<{ id: number; code: string; fin: string | null; donnees: string; pseudo: string; pid: string }>()).results;
  const sanctions = (await db.prepare("SELECT s.id, s.niveau, s.le, p.pseudo FROM sanctions s JOIN personnages p ON p.id = s.personnage_id WHERE s.annulee_le IS NULL ORDER BY s.id DESC LIMIT 30")
    .all<{ id: number; niveau: number; le: string; pseudo: string }>()).results;
  return {
    t: iso(t), pause: await pauseEnCours(db, t), prochainMelange: a.prochain, codes, obtenus,
    dernierExemplaire: { remise: r.courante, prochaine: r.prochaine, disponible: !!r.courante && !vendu },
    clients, missions, sanctions,
  };
}
