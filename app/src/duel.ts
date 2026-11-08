// Duel D&D (FEAT-010 §10.3). A défie B depuis l'écran de résultat d'un scan de B ; B accepte ou refuse en 60 s
// (RG-010-6, RG-010-9). À l'acceptation, le serveur tire l'épreuve et les d20, modifiés par la classe et le costume
// (RG-010-7). Enjeu (RG-010-8, choix du 7 nov.) : +10 points de faction au gagnant, rien n'est retiré au perdant.
// Un duel accepté par heure entre deux mêmes personnes (RG-010-10).
// Les délais du duel (60 s, 5 min, 1 h) se comptent en temps réel du serveur, pas sur l'horloge du jeu : deux
// personnes face à face ont besoin de 60 vraies secondes, même quand le banc accélère la soirée. `t` (l'heure du
// jeu) date seulement les points et les notifications.
import { hasard } from "./catalogue";
import { ajouterPoints, type EnvDirect } from "./direct";
import { notifier } from "./mj";

export const DUEL_DELAI_S = 60;
export const DUEL_POINTS = 10;
const HEURE = 3_600_000;
const REFUS_PAUSE = 5 * 60_000; // après un refus, A attend 5 min avant de redéfier B
const iso = (t: number) => new Date(t).toISOString();

/** Les épreuves sont les spécialités des huit classes (libellés dans public/app.js, CLASSES). */
export const EPREUVES = ["force", "charisme", "sagesse", "constitution", "intelligence", "patience", "perception", "dexterite"] as const;
export type Epreuve = (typeof EPREUVES)[number];

/** Bonus de classe : +3 dans sa spécialité. */
export const BONUS_CLASSE: Record<string, Partial<Record<Epreuve, number>>> = {
  barbare: { force: 3 }, barde: { charisme: 3 }, clerc: { sagesse: 3 }, druide: { constitution: 3 },
  magicien: { intelligence: 3 }, paladin: { patience: 3 }, rodeur: { perception: 3 }, voleur: { dexterite: 3 },
};
/** Bonus de costume (« Charisme vestimentaire » +2 si paillettes) : au plus +3 au total. */
export const BONUS_ATTRIBUT: Record<string, [Epreuve, number]> = {
  paillettes: ["charisme", 2], armure: ["constitution", 2], arme: ["force", 2], couronne: ["charisme", 1], maquillage: ["charisme", 1],
  perruque: ["charisme", 1], plumes: ["charisme", 1], latex: ["charisme", 1], ailes: ["dexterite", 1], cape: ["dexterite", 1],
  masque: ["dexterite", 1], queue: ["dexterite", 1], tentacules: ["dexterite", 1], cornes: ["force", 1], crocs: ["force", 1],
  sang: ["force", 1], chaines: ["constitution", 1], tatouages: ["constitution", 1], integral: ["patience", 1],
  lunettes: ["perception", 1], lumieres: ["perception", 1], accessoire: ["perception", 1], pancarte: ["intelligence", 1], chapeau: ["sagesse", 1],
};
const BONUS_COSTUME_MAX = 3;

interface Perso { id: string; pseudo: string; type: string; couleur: string; classe: string; attributs: string; est_mj: number; suspendu: number }
export interface Jet { de: number; classe: number; costume: number; total: number }

export function modificateurs(p: { classe: string; attributs: string[] }, e: Epreuve) {
  const classe = BONUS_CLASSE[p.classe]?.[e] ?? 0;
  const costume = Math.min(BONUS_COSTUME_MAX, p.attributs.reduce((s, a) => s + (BONUS_ATTRIBUT[a]?.[0] === e ? BONUS_ATTRIBUT[a][1] : 0), 0));
  return { classe, costume };
}

/** Le 20 naturel l'emporte (sauf double 20) ; sinon le plus haut total ; égalité parfaite : match nul. */
export function vainqueur(a: Jet, b: Jet): "a" | "b" | null {
  if (a.de === 20 && b.de !== 20) return "a";
  if (b.de === 20 && a.de !== 20) return "b";
  return a.total > b.total ? "a" : b.total > a.total ? "b" : null;
}

const lirePerso = (db: D1Database, id: string) =>
  db.prepare("SELECT id, pseudo, type, couleur, classe, attributs, est_mj, suspendu FROM personnages WHERE id = ?").bind(id).first<Perso>();
const publique = (p: Perso) => ({ id: p.id, pseudo: p.pseudo, type: p.type, couleur: p.couleur, classe: p.classe });

export type Refus = "cible" | "pas_scanne" | "deja_en_cours" | "occupe" | "trop_tot" | "refus_recent";

/** A défie B. B doit être dans la collection de A (« après avoir scanné B »). */
export async function defier(env: EnvDirect, aId: string, bId: unknown, t: number, reel = Date.now()): Promise<{ id: number; expire_le: string } | { erreur: Refus }> {
  if (typeof bId !== "string" || bId === aId) return { erreur: "cible" };
  const [a, b] = [await lirePerso(env.DB, aId), await lirePerso(env.DB, bId)];
  if (!a || !b || a.est_mj || b.est_mj || b.suspendu || a.suspendu) return { erreur: "cible" };
  const vu = await env.DB.prepare("SELECT 1 AS x FROM collection WHERE possesseur_id = ? AND personnage_id = ?").bind(aId, bId).first();
  if (!vu) return { erreur: "pas_scanne" };
  const maintenant = iso(reel);
  // Un défi en attente à la fois, de chaque côté
  if (await env.DB.prepare("SELECT 1 AS x FROM duels WHERE a_id = ? AND etat = 'attente' AND expire_le > ?").bind(aId, maintenant).first()) return { erreur: "deja_en_cours" };
  if (await env.DB.prepare("SELECT 1 AS x FROM duels WHERE (a_id = ?1 OR b_id = ?1) AND etat = 'attente' AND expire_le > ?2").bind(bId, maintenant).first()) return { erreur: "occupe" };
  const paire = "((a_id = ?1 AND b_id = ?2) OR (a_id = ?2 AND b_id = ?1))";
  if (await env.DB.prepare(`SELECT 1 AS x FROM duels WHERE ${paire} AND etat = 'accepte' AND resolu_le > ?3`).bind(aId, bId, iso(reel - HEURE)).first()) return { erreur: "trop_tot" };
  if (await env.DB.prepare("SELECT 1 AS x FROM duels WHERE a_id = ? AND b_id = ? AND etat = 'refuse' AND resolu_le > ?").bind(aId, bId, iso(reel - REFUS_PAUSE)).first()) return { erreur: "refus_recent" };
  const expire = iso(reel + DUEL_DELAI_S * 1000);
  const r = await env.DB.prepare("INSERT INTO duels (a_id, b_id, etat, cree_le, expire_le) VALUES (?, ?, 'attente', ?, ?) RETURNING id")
    .bind(aId, bId, maintenant, expire).first<{ id: number }>();
  await notifier(env.DB, bId, "duel", { id: r!.id, de: a.pseudo, type: a.type, couleur: a.couleur, expire_le: expire }, t);
  return { id: r!.id, expire_le: expire };
}

interface LigneDuel { id: number; a_id: string; b_id: string; etat: string; cree_le: string; expire_le: string; resolu_le: string | null; resultat: string | null }

/** B répond. Accepter tire les dés et verse l'enjeu, une seule fois. */
export async function repondre(env: EnvDirect, bId: string, id: unknown, accepte: boolean, t: number, reel = Date.now()) {
  const d = await env.DB.prepare("SELECT * FROM duels WHERE id = ?").bind(Number(id)).first<LigneDuel>();
  if (!d || d.b_id !== bId) return { erreur: "introuvable" as const };
  if (d.etat !== "attente") return { erreur: "deja_repondu" as const };
  if (d.expire_le <= iso(reel)) return { erreur: "expire" as const };
  if (!accepte) {
    const r = await env.DB.prepare("UPDATE duels SET etat = 'refuse', resolu_le = ? WHERE id = ? AND etat = 'attente'").bind(iso(reel), d.id).run();
    if (r.meta.changes) await notifier(env.DB, d.a_id, "duel_refuse", { id: d.id }, t);
    return { ok: true };
  }
  const [a, b] = [await lirePerso(env.DB, d.a_id), await lirePerso(env.DB, d.b_id)];
  if (!a || !b) return { erreur: "introuvable" as const };
  const epreuve = EPREUVES[hasard(EPREUVES.length)];
  const jet = (p: Perso): Jet => {
    const m = modificateurs({ classe: p.classe, attributs: JSON.parse(p.attributs || "[]") }, epreuve);
    const de = hasard(20) + 1;
    return { de, ...m, total: de + m.classe + m.costume };
  };
  const ja = jet(a), jb = jet(b), v = vainqueur(ja, jb);
  const gagnant = v === "a" ? a.id : v === "b" ? b.id : null;
  const resultat = { epreuve, a: ja, b: jb, gagnant, points: gagnant ? DUEL_POINTS : 0 };
  // Garde contre une double acceptation : seule la première écriture verse l'enjeu
  const r = await env.DB.prepare("UPDATE duels SET etat = 'accepte', resolu_le = ?, resultat = ? WHERE id = ? AND etat = 'attente'")
    .bind(iso(reel), JSON.stringify(resultat), d.id).run();
  if (!r.meta.changes) return { erreur: "deja_repondu" as const };
  if (gagnant) await ajouterPoints(env, gagnant, DUEL_POINTS, "duel", t);
  return { ok: true };
}

/** État d'un duel, pour A ou B. */
export async function lireDuel(env: EnvDirect, moiId: string, id: unknown, reel = Date.now()) {
  const d = await env.DB.prepare("SELECT * FROM duels WHERE id = ?").bind(Number(id)).first<LigneDuel>();
  if (!d || (d.a_id !== moiId && d.b_id !== moiId)) return null;
  const [a, b] = [await lirePerso(env.DB, d.a_id), await lirePerso(env.DB, d.b_id)];
  if (!a || !b) return null;
  const etat = d.etat === "attente" && d.expire_le <= iso(reel) ? "expire" : d.etat;
  return {
    // reste_ms : le téléphone compte à rebours sur sa propre horloge, qui peut être simulée (banc)
    id: d.id, etat, expire_le: d.expire_le, reste_ms: etat === "attente" ? Date.parse(d.expire_le) - reel : 0, moi: d.a_id === moiId ? "a" : "b",
    a: publique(a), b: publique(b), resultat: etat === "accepte" && d.resultat ? JSON.parse(d.resultat) : null,
  };
}
