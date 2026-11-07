// Missions éclair globales (FEAT-013, LOT-6) : lancées par le MJ, annoncées à tous (bannière et push),
// une seule à la fois (RG-013-4), condition vérifiée par le serveur après chaque scan (RG-013-1),
// récompense versée une seule fois (CA-013-1), plus aucun progrès après l'échéance (CA-013-2).
import { ajouterPoints, evenement, type EnvDirect } from "./direct";
import { notifier } from "./mj";

export const ECLAIRS: Record<string, { nom: string; duree: number; points: number }> = {
  "E-1": { nom: "Rafle : 3 nouvelles pièces", duree: 5, points: 15 },
  "E-2": { nom: "Rayon : scanner un emoji précis", duree: 5, points: 15 },
  "E-3": { nom: "Ensemble assorti : deux attributs", duree: 10, points: 20 },
  "E-4": { nom: "Retour client : rescanner sa première rencontre", duree: 10, points: 20 },
};
const SCANS_DE_JOUEUR = "('nouvelle_carte', 'deja_vu', 'deja_vu_repete')";
const iso = (t: number) => new Date(t).toISOString();

export interface Eclair { id: number; debut: string; fin: string; donnees: { code: string; type?: string; attributs?: string[]; points: number } }

export async function eclairActive(db: D1Database, t: number): Promise<Eclair | null> {
  const e = await db.prepare("SELECT id, debut, fin, donnees FROM evenements WHERE type = 'mission' AND debut <= ?1 AND fin > ?1 ORDER BY id DESC LIMIT 1")
    .bind(iso(t)).first<{ id: number; debut: string; fin: string; donnees: string }>();
  return e ? { ...e, donnees: JSON.parse(e.donnees) } : null;
}

/** Lance une mission (MJ). Les paramètres sont tirés parmi les vrais joueurs, pour qu'elle soit faisable. */
export async function lancerEclair(env: EnvDirect, code: string, auteur: string, t: number): Promise<string | null> {
  const def = ECLAIRS[code];
  if (!def) return "Mission éclair inconnue.";
  if (await eclairActive(env.DB, t)) return "Une mission éclair est déjà en cours (une seule à la fois) : arrête-la d'abord.";
  const d: Eclair["donnees"] = { code, points: def.points };
  if (code === "E-2") {
    const r = await env.DB.prepare("SELECT type FROM personnages WHERE est_mj = 0 AND suspendu = 0 GROUP BY type HAVING COUNT(*) >= 2 ORDER BY random() LIMIT 1").first<{ type: string }>();
    if (!r) return "Pas assez de joueurs : il faut au moins deux personnages du même type.";
    d.type = r.type;
  }
  if (code === "E-3") {
    const r = await env.DB.prepare("SELECT attributs FROM personnages WHERE est_mj = 0 AND suspendu = 0 AND json_array_length(attributs) >= 2 ORDER BY random() LIMIT 1").first<{ attributs: string }>();
    if (!r) return "Aucun joueur ne porte deux attributs : mission impossible pour l'instant.";
    const a = JSON.parse(r.attributs) as string[];
    const i = Math.floor(Math.random() * a.length);
    let j = Math.floor(Math.random() * (a.length - 1)); if (j >= i) j++;
    d.attributs = [a[i], a[j]];
  }
  await evenement(env.DB, { type: "mission", donnees: d, debut: iso(t), fin: iso(t + def.duree * 60_000), auteur });
  return null;
}

/** Arrête la mission en cours (MJ) : plus aucun progrès ensuite. */
export async function arreterEclair(db: D1Database, t: number): Promise<boolean> {
  const e = await eclairActive(db, t);
  if (!e) return false;
  await db.prepare("UPDATE evenements SET fin = ? WHERE id = ?").bind(iso(t), e.id).run();
  return true;
}

async function remplie(db: D1Database, e: Eclair, id: string, t: number): Promise<boolean> {
  const d = e.donnees, borne = [id, e.debut, iso(t)];
  const fenetre = "s.scanneur_id = ?1 AND s.horodatage_serveur >= ?2 AND s.horodatage_serveur <= ?3";
  if (d.code === "E-1") {
    return ((await db.prepare(`SELECT COUNT(*) AS n FROM scans s WHERE ${fenetre} AND s.resultat = 'nouvelle_carte'`).bind(...borne).first<{ n: number }>())?.n ?? 0) >= 3;
  }
  if (d.code === "E-2") {
    return !!(await db.prepare(`SELECT 1 AS x FROM scans s JOIN personnages p ON p.id = s.cible_id WHERE ${fenetre} AND s.resultat IN ${SCANS_DE_JOUEUR} AND p.type = ?4 LIMIT 1`)
      .bind(...borne, d.type).first());
  }
  if (d.code === "E-3") {
    const [a, b] = d.attributs ?? [];
    return !!(await db.prepare(
      `SELECT 1 AS x FROM scans s JOIN personnages p ON p.id = s.cible_id WHERE ${fenetre} AND s.resultat IN ${SCANS_DE_JOUEUR}
       AND EXISTS (SELECT 1 FROM json_each(p.attributs) WHERE value = ?4) AND EXISTS (SELECT 1 FROM json_each(p.attributs) WHERE value = ?5) LIMIT 1`,
    ).bind(...borne, a, b).first());
  }
  if (d.code === "E-4") {
    const premiere = await db.prepare("SELECT personnage_id AS p FROM collection WHERE possesseur_id = ? ORDER BY premier_scan_le LIMIT 1").bind(id).first<{ p: string }>();
    return !!premiere && !!(await db.prepare(`SELECT 1 AS x FROM scans s WHERE ${fenetre} AND s.cible_id = ?4 AND s.resultat IN ('deja_vu', 'deja_vu_repete') LIMIT 1`)
      .bind(...borne, premiere.p).first());
  }
  return false;
}

/** Après chaque scan d'un joueur : récompense s'il vient de remplir la mission en cours. */
export async function verifierEclair(env: EnvDirect, t: number, id: string): Promise<boolean> {
  const e = await eclairActive(env.DB, t);
  if (!e) return false;
  if (await env.DB.prepare("SELECT 1 AS x FROM eclair_reussites WHERE evenement_id = ? AND personnage_id = ?").bind(e.id, id).first()) return false;
  if (!(await remplie(env.DB, e, id, t))) return false;
  const ins = await env.DB.prepare("INSERT OR IGNORE INTO eclair_reussites (evenement_id, personnage_id, le) VALUES (?, ?, ?)").bind(e.id, id, iso(t)).run();
  if (!ins.meta.changes) return false;
  const p = await env.DB.prepare("SELECT surconsommation AS s, est_mj AS mj FROM personnages WHERE id = ?").bind(id).first<{ s: number; mj: number }>();
  if (!p?.mj) await ajouterPoints(env, id, e.donnees.points, "mission_eclair", t, { surconso: !!p?.s });
  await notifier(env.DB, id, "eclair_reussie", { code: e.donnees.code, points: e.donnees.points }, t);
  return true;
}

/** Bilan pour l'admin : mission en cours et nombre de joueurs qui l'ont réussie. */
export async function bilanEclair(db: D1Database, t: number) {
  const e = await eclairActive(db, t);
  if (!e) return null;
  const n = (await db.prepare("SELECT COUNT(*) AS n FROM eclair_reussites WHERE evenement_id = ?").bind(e.id).first<{ n: number }>())?.n ?? 0;
  return { ...e, reussites: n };
}
