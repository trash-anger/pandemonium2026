// LOT-4 : jumeaux et triplés (FEAT-007), chats noirs et glitch contagieux (FEAT-008), réglage en direct (ADM-7).
// Les rôles sont attribués par le serveur pendant la soirée ; rien n'est visible sur les étiquettes (CA-007-4).
import { ATTRIBUTS } from "./catalogue";
import { baremeDe, lireParametres } from "./config";
import { ajouterCompteur, ajouterPoints, franchirPaliers, heuresIso } from "./direct";
import { hash, souvenirOrigine } from "./souvenirs";

interface EnvRoles { DB: D1Database }
const MIN = 60_000;
const iso = (t: number) => new Date(t).toISOString();
/** Tirage uniforme dans [0, 1[ (crypto : imprévisible pour les joueurs). */
export let hasard = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
/** Pour les tests : remplace le tirage. */
export function fixerHasard(f: () => number) { hasard = f; }
function melanger<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(hasard() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

async function notif(db: D1Database, id: string, type: string, donnees: object, t: number) {
  await db.prepare("INSERT INTO notifs (personnage_id, type, donnees, le) VALUES (?, ?, ?, ?)").bind(id, type, JSON.stringify(donnees), iso(t)).run();
}
async function badge(db: D1Database, id: string, b: string, t: number) {
  return (await db.prepare("INSERT OR IGNORE INTO badges (personnage_id, badge, obtenu_le) VALUES (?, ?, ?)").bind(id, b, iso(t)).run()).meta.changes > 0;
}
async function effetActif(db: D1Database, id: string, effet: string, t: number) {
  return !!(await db.prepare("SELECT 1 AS x FROM effets WHERE personnage_id = ? AND effet = ? AND ((fin IS NOT NULL AND fin > ?) OR (reste IS NOT NULL AND reste > 0))").bind(id, effet, iso(t)).first());
}
async function consommer(db: D1Database, id: string, effet: string) {
  return (await db.prepare("UPDATE effets SET reste = reste - 1 WHERE personnage_id = ? AND effet = ? AND reste > 0").bind(id, effet).run()).meta.changes > 0;
}

// =====================================================================================
// Attribution dynamique (DEC-021, DEC-055, DEC-071) : courbe linéaire du départ à 2 h
// =====================================================================================

/** Départ : à la 60e activation ou à minuit, au premier des deux (le MJ ne compte pas). */
async function departFormation(db: D1Database, minuit: string, seuil: number): Promise<number> {
  const r = await db.prepare("SELECT cree_le FROM personnages WHERE est_mj = 0 ORDER BY cree_le LIMIT 1 OFFSET ?").bind(Math.max(0, seuil - 1)).first<{ cree_le: string }>();
  return Math.min(Date.parse(minuit), r ? Date.parse(r.cree_le) : Infinity);
}

/** Groupes que la courbe devrait avoir formés à t (CA-007-5 : tous à 2 h). */
export function cibleCourbe(total: number, depart: number, fin: number, t: number) {
  if (t < depart) return 0;
  if (t >= fin || fin <= depart) return total;
  return Math.min(total, Math.max(1, Math.ceil(total * (t - depart) / (fin - depart)))); // le départ forme le premier groupe
}
/** Le k-ième groupe (0, 1, …) est-il un groupe de triplés ? Les triplés sont étalés sur la soirée. */
export const estTriple = (k: number, total: number, triples: number) => total > 0 && Math.floor(((k + 1) * triples) / total) > Math.floor((k * triples) / total);

/**
 * Forme les groupes en retard sur la courbe (à chaque activation, et toutes les minutes au plus via le direct).
 * Le nouveau joueur est servi en priorité ; ses partenaires sont tirés parmi les joueurs sans groupe
 * qui ont créé leur personnage depuis au moins 10 min (sauf après 2 h, pour compléter).
 */
export async function formerGroupes(env: EnvRoles, t: number, nouveau?: string): Promise<number> {
  const db = env.DB, h = await heuresIso(db), p = (await lireParametres(db)).jumeaux;
  const total = Number(p.paires) + Number(p.triples);
  const depart = await departFormation(db, h.minuit, Number(p.seuil_activations));
  const fin = Date.parse(h.jumeaux);
  let formes = (await db.prepare("SELECT COUNT(*) AS n FROM groupes").first<{ n: number }>())?.n ?? 0;
  const voulu = cibleCourbe(total, depart, fin, t);
  if (formes >= voulu) return 0;
  const libres = (await db.prepare(
    "SELECT id, cree_le FROM personnages WHERE est_mj = 0 AND suspendu = 0 AND groupe_id IS NULL AND cree_le <= ?",
  ).bind(iso(t)).all<{ id: string; cree_le: string }>()).results;
  const ancien = t >= fin ? iso(t) : iso(t - 10 * MIN);
  // Le nouveau joueur d'abord, puis la réserve tirée au hasard
  const file = [...(nouveau && libres.some((x) => x.id === nouveau) ? [nouveau] : []),
    ...melanger(libres.filter((x) => x.id !== nouveau && x.cree_le <= ancien).map((x) => x.id))];
  let crees = 0, i = 0;
  while (formes < voulu) {
    const taille = estTriple(formes, total, Number(p.triples)) ? 3 : 2;
    if (file.length - i < taille) break;
    await creerGroupe(env, file.slice(i, i + taille), t);
    i += taille; formes++; crees++;
  }
  return crees;
}

/** Crée un groupe et prévient ses membres (RG-007-3), avec l'avertissement « déjà croisé » (RG-007-13). */
export async function creerGroupe(env: EnvRoles, membres: string[], t: number) {
  const db = env.DB;
  const g = await db.prepare("INSERT INTO groupes (type, forme_le) VALUES (?, ?) RETURNING id").bind(membres.length === 3 ? "triples" : "jumeaux", iso(t)).first<{ id: number }>();
  await db.batch(membres.map((m) => db.prepare("UPDATE personnages SET groupe_id = ? WHERE id = ?").bind(g!.id, m)));
  for (const m of membres) {
    // L-4 obtenue avant d'avoir un jumeau : l'indice bonus attendait le groupe
    if (await consommer(db, m, "L-4")) await db.prepare("UPDATE personnages SET indices_bonus = indices_bonus + 1 WHERE id = ?").bind(m).run();
    const autres = membres.filter((x) => x !== m);
    const croise = await db.prepare(`SELECT 1 AS x FROM collection WHERE possesseur_id = ? AND personnage_id IN (${autres.map(() => "?").join(",")}) LIMIT 1`).bind(m, ...autres).first();
    await notif(db, m, "jumeau", { taille: membres.length, deja_croise: !!croise }, t);
  }
  return g!.id;
}

// =====================================================================================
// Indices progressifs (RG-007-4 à RG-007-6)
// =====================================================================================
export type Indice = { k: "type" | "couleur" | "attribut" | "pseudo"; v: string; vrai?: boolean };
interface Perso { id: string; pseudo: string; type: string; couleur: string; attributs: string }

/** Indices sur « autre » vus par « moi » : type, couleur, attributs (vrais et faux, en alternance), puis pseudo. */
export function indicesSur(moi: string, autre: Perso): Indice[] {
  const g = `${moi}>${autre.id}`;
  const ordre = (liste: string[], sel: string) => [...liste].sort((a, b) => hash(`${g}#${sel}#${a}`) - hash(`${g}#${sel}#${b}`));
  const a = JSON.parse(autre.attributs) as string[];
  const vrais = ordre(a, "v").slice(0, 3);
  const faux = ordre(ATTRIBUTS.filter((x) => !a.includes(x)), "f").slice(0, 2);
  const attr: Indice[] = [];
  for (let i = 0; i < Math.max(vrais.length, faux.length); i++) {
    if (vrais[i]) attr.push({ k: "attribut", v: vrais[i], vrai: true });
    if (faux[i]) attr.push({ k: "attribut", v: faux[i], vrai: false });
  }
  return [{ k: "type", v: autre.type }, { k: "couleur", v: autre.couleur }, ...attr, { k: "pseudo", v: autre.pseudo }];
}

/** Nombre d'indices révélés : aucun avant minuit (CA-007-7), puis un toutes les 10 min ; rattrapage immédiat après minuit. */
export function indicesReveles(t: number, minuit: number, formeLe: number, intervalleMin: number, bonus: number) {
  if (t < minuit) return 0;
  return 1 + Math.floor((t - Math.max(minuit, formeLe)) / (intervalleMin * MIN)) + bonus;
}

/** Ce que le joueur sait de son groupe : indices, membres retrouvés, retrouvailles complètes. */
export async function jumeauDe(env: EnvRoles, id: string, t: number) {
  const db = env.DB;
  const moi = await db.prepare("SELECT groupe_id, indices_bonus FROM personnages WHERE id = ?").bind(id).first<{ groupe_id: number | null; indices_bonus: number }>();
  if (!moi?.groupe_id) return null;
  const g = await db.prepare("SELECT id, type, forme_le, reuni_le FROM groupes WHERE id = ?").bind(moi.groupe_id).first<{ id: number; type: string; forme_le: string; reuni_le: string | null }>();
  if (!g || Date.parse(g.forme_le) > t) return null;
  const h = await heuresIso(db), p = (await lireParametres(db)).jumeaux;
  const autres = (await db.prepare("SELECT id, pseudo, type, couleur, attributs FROM personnages WHERE groupe_id = ? AND id != ? ORDER BY id").bind(g.id, id).all<Perso>()).results;
  const paires = (await db.prepare("SELECT a, b FROM retrouvailles WHERE groupe_id = ?").bind(g.id).all<{ a: string; b: string }>()).results;
  const retrouve = (x: string) => paires.some((r) => (r.a === id && r.b === x) || (r.b === id && r.a === x));
  const p3 = (await db.prepare("SELECT 1 AS x FROM evenements WHERE type = 'palier' AND cle = 'palier:3' AND debut <= ?").bind(iso(t)).first()) ? 1 : 0;
  const minuit = Date.parse(h.minuit), intervalle = Number(p.indice_toutes_min);
  const n = indicesReveles(t, minuit, Date.parse(g.forme_le), intervalle, moi.indices_bonus + (t >= minuit ? p3 : 0));
  const prochain = t < minuit ? h.minuit : iso(Math.max(minuit, Date.parse(g.forme_le)) + (n - moi.indices_bonus - p3) * intervalle * MIN);
  let max = 0;
  const doubles = autres.map((a) => {
    const tous = indicesSur(id, a);
    max = Math.max(max, tous.length);
    const r = retrouve(a.id);
    return { retrouve: r, indices: r ? tous : tous.slice(0, n), ...(r ? { carte: { pseudo: a.pseudo, type: a.type, couleur: a.couleur } } : {}) };
  });
  return {
    type: g.type, taille: autres.length + 1, reuni: !!g.reuni_le, reuni_le: g.reuni_le, doubles,
    nb_indices: Math.min(n, max), prochain: n < max ? prochain : null,
    fui: !g.reuni_le && t >= Date.parse(h.revelation), // « Ton double a fui la Matrice. »
  };
}

/** Indice bonus (L-4, M-5) : révélé tout de suite, ou dès minuit s'il arrive avant. */
export async function indiceBonus(env: EnvRoles, id: string) {
  const r = await env.DB.prepare("UPDATE personnages SET indices_bonus = indices_bonus + 1 WHERE id = ? AND groupe_id IS NOT NULL").bind(id).run();
  return r.meta.changes > 0;
}

// =====================================================================================
// Retrouvailles : scan mutuel dans une fenêtre de 90 s (RG-007-7 à RG-007-12)
// =====================================================================================
const RESULTATS_SCAN = "('nouvelle_carte', 'deja_vu', 'deja_vu_repete')";
const POINTS_RETROUVAILLES = 50; // barème §2, pour chaque membre
const QUETE_RETROUVAILLES = 5;   // barème §1.1

/**
 * Appelé quand « moi » scanne « cible » (n'importe laquelle de ses étiquettes, CA-007-3).
 * Renvoie l'attente (premier scan de la paire) ou les retrouvailles (second scan), sinon null.
 */
export async function verifierRetrouvailles(env: EnvRoles, t: number, moi: string, cible: string) {
  const db = env.DB;
  const g = await db.prepare("SELECT a.groupe_id AS g FROM personnages a JOIN personnages b ON a.groupe_id = b.groupe_id WHERE a.id = ? AND b.id = ?").bind(moi, cible).first<{ g: number }>();
  if (!g) return null;
  const [a, b] = moi < cible ? [moi, cible] : [cible, moi];
  if (await db.prepare("SELECT 1 AS x FROM retrouvailles WHERE a = ? AND b = ?").bind(a, b).first()) return null;
  const fenetre = Number((await lireParametres(db)).jumeaux.fenetre_scan_mutuel_s) * 1000;
  const lui = await db.prepare(`SELECT 1 AS x FROM scans WHERE scanneur_id = ? AND cible_id = ? AND horodatage_serveur >= ? AND horodatage_serveur <= ? AND resultat IN ${RESULTATS_SCAN} LIMIT 1`)
    .bind(cible, moi, iso(t - fenetre), iso(t)).first();
  if (!lui) return { attente_jusqu_a: iso(t + fenetre) }; // RG-007-8 : la fenêtre redémarre au prochain scan
  if (!(await db.prepare("INSERT OR IGNORE INTO retrouvailles (groupe_id, a, b, le) VALUES (?, ?, ?, ?)").bind(g.g, a, b, iso(t)).run()).meta.changes) return null;

  const groupe = await db.prepare("SELECT type FROM groupes WHERE id = ?").bind(g.g).first<{ type: string }>();
  const membres = (await db.prepare("SELECT id, pseudo, type, couleur, surconsommation FROM personnages WHERE groupe_id = ?").bind(g.g)
    .all<{ id: string; pseudo: string; type: string; couleur: string; surconsommation: number }>()).results;
  const nbPaires = (await db.prepare("SELECT COUNT(*) AS n FROM retrouvailles WHERE groupe_id = ?").bind(g.g).first<{ n: number }>())?.n ?? 0;
  const complet = nbPaires >= (membres.length === 3 ? 3 : 1);
  const badges: Record<string, string[]> = {};
  const donner = async (id: string, x: string) => { if (await badge(db, id, x, t)) (badges[id] ??= []).push(x); };
  if (groupe?.type === "triples") for (const id of [moi, cible]) await donner(id, "triples_partiels"); // RG-007-11
  let premier = false;
  if (complet) {
    await db.prepare("UPDATE groupes SET reuni_le = ? WHERE id = ? AND reuni_le IS NULL").bind(iso(t), g.g).run();
    for (const m of membres) {
      await donner(m.id, "jumeaux_retrouves");
      await ajouterPoints(env, m.id, POINTS_RETROUVAILLES, "retrouvailles", t, { surconso: !!m.surconsommation });
    }
    const params = await lireParametres(db);
    await franchirPaliers(env, await ajouterCompteur(db, "quete", QUETE_RETROUVAILLES), t, baremeDe(params).paliers);
    // RG-007-12 : premier groupe réuni de la soirée (LB-7), annoncé à tous
    const r = await db.prepare("INSERT OR IGNORE INTO evenements (type, cle, donnees, debut) VALUES ('jumeaux_reunis', 'premiers_jumeaux', ?, ?)")
      .bind(JSON.stringify({ pseudos: membres.map((m) => m.pseudo), types: membres.map((m) => m.type) }), iso(t)).run();
    premier = r.meta.changes > 0;
  }
  const souvenir = complet ? { fr: souvenirOrigine(membres, "fr"), en: souvenirOrigine(membres, "en") } : null;
  const vu = (id: string, avec: string) => {
    const x = membres.find((m) => m.id === avec)!;
    return { avec: { pseudo: x.pseudo, type: x.type, couleur: x.couleur }, complet, triples: membres.length === 3, souvenir, premier, badges: badges[id] ?? [] };
  };
  await notif(db, cible, "retrouvailles", vu(cible, moi), t); // RG-007-9 : l'autre la voit au même moment (relevé rapide pendant l'attente)
  return { retrouvailles: vu(moi, cible) };
}

// =====================================================================================
// Chats noirs et contagion (FEAT-008)
// =====================================================================================
export interface EtatContagion { chat_noir: boolean; corrompu_jusqu_a: string | null; immunise_jusqu_a: string | null; protege_jusqu_a: string | null }

export async function etatContagion(db: D1Database, id: string, t: number): Promise<EtatContagion> {
  const n = iso(t);
  const p = await db.prepare("SELECT chat_noir_le FROM personnages WHERE id = ?").bind(id).first<{ chat_noir_le: string | null }>();
  const c = await db.prepare("SELECT MAX(fin) AS fin FROM corruptions WHERE personnage_id = ? AND debut <= ? AND fin > ?").bind(id, n, n).first<{ fin: string | null }>();
  const i = await db.prepare("SELECT MAX(immun_jusqu_a) AS f FROM corruptions WHERE personnage_id = ? AND fin <= ? AND immun_jusqu_a > ?").bind(id, n, n).first<{ f: string | null }>();
  const l1 = await db.prepare("SELECT fin FROM effets WHERE personnage_id = ? AND effet = 'L-1' AND fin > ?").bind(id, n).first<{ fin: string }>();
  return { chat_noir: !!p?.chat_noir_le && p.chat_noir_le <= n, corrompu_jusqu_a: c?.fin ?? null, immunise_jusqu_a: c?.fin ? null : i?.f ?? null, protege_jusqu_a: l1?.fin ?? null };
}
const contagieux = (e: EtatContagion) => e.chat_noir || !!e.corrompu_jusqu_a;
const receptif = (e: EtatContagion) => !e.chat_noir && !e.corrompu_jusqu_a && !e.immunise_jusqu_a && !e.protege_jusqu_a;

/** Joueurs actifs (MJ et suspendus exclus) et part de corrompus. */
export async function partCorrompus(db: D1Database, t: number) {
  const n = iso(t);
  const actifs = (await db.prepare("SELECT COUNT(*) AS n FROM personnages WHERE est_mj = 0 AND suspendu = 0 AND cree_le <= ?").bind(n).first<{ n: number }>())?.n ?? 0;
  const corrompus = (await db.prepare("SELECT COUNT(DISTINCT c.personnage_id) AS n FROM corruptions c JOIN personnages p ON p.id = c.personnage_id WHERE p.est_mj = 0 AND c.debut <= ? AND c.fin > ?")
    .bind(n, n).first<{ n: number }>())?.n ?? 0;
  const chats = (await db.prepare("SELECT COUNT(*) AS n FROM personnages WHERE chat_noir_le IS NOT NULL AND chat_noir_le <= ? AND suspendu = 0").bind(n).first<{ n: number }>())?.n ?? 0;
  return { actifs, corrompus, chats, part: actifs ? corrompus / actifs : 0 };
}

/** RG-008-5c : au-delà de 50 % de corrompus, −1 min par tranche de 5 points, minimum 3 min. */
export function dureeCorruption(base: number, part: number, seuil: number, plancher: number) {
  if (part <= seuil) return base;
  return Math.max(plancher, base - Math.floor(((part - seuil) * 100) / 5 + 1e-9));
}

/**
 * Corrompt un joueur. L-2 « Retour sans reçu » annule la corruption (un usage).
 * Immunité à la guérison dans 80 % des cas (20, 40 ou 60 min), jamais en surconsommation (RG-008-5d).
 */
export async function corrompre(env: EnvRoles, id: string, t: number, cause: string, o: { source?: string | null; duree?: number; sansImmunite?: boolean; forcer?: boolean } = {}) {
  const db = env.DB;
  if (!o.forcer && (await consommer(db, id, "L-2"))) return { protege: "L-2" as const };
  const params = await lireParametres(db), c = params.contagion;
  const surconso = !!(await db.prepare("SELECT surconsommation AS s FROM personnages WHERE id = ?").bind(id).first<{ s: number }>())?.s;
  const duree = o.duree ?? dureeCorruption(Number(c.corruption_min), (await partCorrompus(db, t)).part, Number(c.seuil_degressif), Number(c.corruption_min_plancher));
  let immun = 0;
  if (!o.sansImmunite && !surconso && hasard() < Number(c.immunite)) {
    const x = hasard(), parts = c.immunite_parts as number[], durees = c.immunite_min as number[];
    let cumul = 0;
    immun = durees[durees.length - 1];
    for (let i = 0; i < durees.length; i++) { cumul += parts[i] ?? 0; if (x < cumul) { immun = durees[i]; break; } }
  }
  const fin = t + duree * MIN;
  await db.prepare("INSERT INTO corruptions (personnage_id, debut, fin, immun_jusqu_a, source_id, cause) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(id, iso(t), iso(fin), immun ? iso(fin + immun * MIN) : null, o.source ?? null, cause).run();
  return { corrompu_jusqu_a: iso(fin) };
}

/** L-2 obtenue pendant une corruption : elle l'annule tout de suite (un usage). */
export async function guerirParL2(env: EnvRoles, id: string, t: number) {
  const n = iso(t);
  if (!(await env.DB.prepare("SELECT 1 AS x FROM corruptions WHERE personnage_id = ? AND debut <= ? AND fin > ? AND cause != 'surconsommation'").bind(id, n, n).first())) return false;
  if (!(await consommer(env.DB, id, "L-2"))) return false;
  await env.DB.prepare("UPDATE corruptions SET fin = ?, immun_jusqu_a = NULL WHERE personnage_id = ? AND debut <= ? AND fin > ?").bind(n, id, n, n).run();
  return true;
}

/**
 * Contact par scan entre « moi » (qui scanne) et « cible » (RG-008-2 à RG-008-4) : la corruption passe
 * dans les deux sens, avec la probabilité de transmission. Le MJ n'est ni contaminé ni contagieux.
 * Renvoie ce que le scanneur doit voir ; la cible contaminée est prévenue par un message (glitch).
 */
export async function contact(env: EnvRoles, t: number, moi: { id: string; est_mj: number }, cible: { id: string; est_mj: number }) {
  if (moi.est_mj || cible.est_mj) return {};
  const db = env.DB;
  const [em, ec] = await Promise.all([etatContagion(db, moi.id, t), etatContagion(db, cible.id, t)]);
  if (!contagieux(em) && !contagieux(ec)) return {};
  const p = baremeDe(await lireParametres(db)).transmission;
  const r: { corrompu?: { jusqu_a: string; par_chat: boolean }; protege?: string; contamine?: boolean; badges?: string[] } = {};
  const transmettre = async (de: string, vers: string, eDe: EtatContagion): Promise<{ protege?: string; corrompu_jusqu_a?: string; badges?: string[] }> => {
    const res = await corrompre(env, vers, t, eDe.chat_noir ? "chat" : "corrompu", { source: de });
    if ("protege" in res) return res;
    const badges: string[] = [];
    if (eDe.chat_noir) {
      // BDG-6 « Patient zéro » : la première personne corrompue par un chat noir ; barème §2 : +5 pour le chat
      const premier = await db.prepare("SELECT COUNT(*) AS n FROM corruptions WHERE cause = 'chat'").first<{ n: number }>();
      if ((premier?.n ?? 0) === 1 && (await badge(db, vers, "patient_zero", t))) badges.push("patient_zero");
      await ajouterPoints(env, de, 5, "contamination", t);
    }
    return { ...res, badges };
  };
  if (contagieux(em) && receptif(ec) && hasard() < p) {
    const res = await transmettre(moi.id, cible.id, em);
    if (res.corrompu_jusqu_a) {
      await notif(db, cible.id, "corrompu", { jusqu_a: res.corrompu_jusqu_a, par_chat: em.chat_noir, badges: res.badges }, t);
      if (em.chat_noir) r.contamine = true;
    }
  }
  if (contagieux(ec) && receptif(em) && hasard() < p) {
    const res = await transmettre(cible.id, moi.id, ec);
    if (res.protege) r.protege = res.protege;
    else { r.corrompu = { jusqu_a: res.corrompu_jusqu_a!, par_chat: ec.chat_noir }; if (res.badges?.length) r.badges = res.badges; }
  }
  return r;
}

/** RG-008-1 : 1 chat noir pour 50 joueurs actifs (au moins un dès 10 joueurs), désignés au fil des arrivées. */
export async function designerChats(env: EnvRoles, t: number) {
  const db = env.DB, h = await heuresIso(db);
  if (iso(t) < h.debut) return 0;
  const p = (await lireParametres(db)).chats_noirs;
  const { actifs, chats } = await partCorrompus(db, t);
  const voulu = actifs >= Number(p.minimum_joueurs) ? Math.max(1, Math.floor(actifs / Number(p.joueurs_par_chat))) : 0;
  let n = 0;
  for (let i = chats; i < voulu; i++) {
    const libres = (await db.prepare("SELECT id FROM personnages WHERE est_mj = 0 AND suspendu = 0 AND chat_noir_le IS NULL AND cree_le <= ?").bind(iso(t)).all<{ id: string }>()).results;
    if (!libres.length) break;
    await devenirChat(env, libres[Math.floor(hasard() * libres.length)].id, t);
    n++;
  }
  return n;
}
export async function devenirChat(env: EnvRoles, id: string, t: number) {
  await env.DB.prepare("UPDATE personnages SET chat_noir_le = ? WHERE id = ? AND chat_noir_le IS NULL").bind(iso(t), id).run();
  await env.DB.prepare("UPDATE corruptions SET fin = ? WHERE personnage_id = ? AND fin > ?").bind(iso(t), id, iso(t)).run(); // un chat ne « guérit » pas : il est contagieux d'office
  await notif(env.DB, id, "chat_noir", {}, t);
}

/**
 * RG-008-7 : relancer un foyer (MJ) : quelques joueurs sains sont corrompus. Chaque corruption est datée
 * de l'heure du joueur (sur le banc, les téléphones n'ont pas tous la même heure simulée).
 */
export async function relancerFoyer(env: EnvRoles, heureDe: (id: string) => Promise<number>, n = 3) {
  const db = env.DB, ids = (await db.prepare("SELECT id FROM personnages WHERE est_mj = 0 AND suspendu = 0 AND chat_noir_le IS NULL").all<{ id: string }>()).results.map((x) => x.id);
  let k = 0;
  for (const id of melanger(ids)) {
    if (k >= n) break;
    const t = await heureDe(id);
    if (!receptif(await etatContagion(db, id, t))) continue;
    const r = await corrompre(env, id, t, "foyer", { forcer: true });
    if (r.corrompu_jusqu_a) { await notif(db, id, "corrompu", { jusqu_a: r.corrompu_jusqu_a, par_chat: false }, t); k++; }
  }
  return k;
}

// =====================================================================================
// Tick : formation des groupes et désignation des chats, au plus une fois par minute
// =====================================================================================
export async function tickRoles(env: EnvRoles, t: number, nouveau?: string) {
  if (!nouveau) {
    const r = await env.DB.prepare("SELECT valeur FROM compteurs WHERE cle = 'roles:tick'").first<{ valeur: number }>();
    if (r && t >= r.valeur && t - r.valeur < MIN) return;
  }
  await env.DB.prepare("INSERT INTO compteurs (cle, valeur) VALUES ('roles:tick', ?) ON CONFLICT (cle) DO UPDATE SET valeur = excluded.valeur").bind(t).run();
  await formerGroupes(env, t, nouveau);
  await designerChats(env, t);
}

/** Ce que le joueur voit de son rôle : chat noir, corruption, immunité ; pendant L-3, la part de corrompus. */
export async function contagionDe(env: EnvRoles, id: string, t: number) {
  const e = await etatContagion(env.DB, id, t);
  const chatLe = (await env.DB.prepare("SELECT chat_noir_le FROM personnages WHERE id = ?").bind(id).first<{ chat_noir_le: string | null }>())?.chat_noir_le ?? null;
  const pilule = (await effetActif(env.DB, id, "L-3", t)) ? await partCorrompus(env.DB, t) : null;
  return {
    contagion: { ...e, chat_noir_le: e.chat_noir ? chatLe : null },
    pilule: pilule ? { part: Math.round(pilule.part * 100), chats: pilule.chats } : null,
  };
}

/** Tableau du MJ (ADM-4, ADM-7). */
export async function etatRoles(env: EnvRoles, t: number) {
  const db = env.DB, params = await lireParametres(db), h = await heuresIso(db);
  const p = params.jumeaux;
  const g = await db.prepare("SELECT COUNT(*) AS n, SUM(type = 'triples') AS tr, SUM(reuni_le IS NOT NULL) AS r FROM groupes").first<{ n: number; tr: number | null; r: number | null }>();
  const listeChats = (await db.prepare("SELECT pseudo, type, chat_noir_le FROM personnages WHERE chat_noir_le IS NOT NULL ORDER BY chat_noir_le").all<{ pseudo: string; type: string; chat_noir_le: string }>()).results;
  const depart = await departFormation(db, h.minuit, Number(p.seuil_activations));
  return {
    groupes: g?.n ?? 0, triples: g?.tr ?? 0, reunis: g?.r ?? 0, cible: Number(p.paires) + Number(p.triples), cible_triples: Number(p.triples),
    depart: Number.isFinite(depart) ? iso(depart) : null, complets: h.jumeaux,
    liste_chats: listeChats, ...(await partCorrompus(db, t)),
    transmission: baremeDe(params).transmission, corruption_min: Number(params.contagion.corruption_min),
  };
}
