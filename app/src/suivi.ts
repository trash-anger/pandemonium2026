// Frise d'activité (ADM-14) et suggestions de réglage au MJ (ADM-16, barème §6), LOT-3 E.
// - La frise se calcule à la demande depuis les tables du jeu : rien à échantillonner pendant la soirée.
// - Les signaux sont évalués toutes les 10 min (Cron Trigger, /api/notifs en secours). Le serveur n'applique
//   jamais rien : il propose au MJ par notification push et dans l'admin ; au plus une suggestion toutes les 15 min.
import { baremeDe, ecrireConfig, HEURES_PAR_DEFAUT, lireConfig, lireParametres, PREREGLAGES, type Heures, type NomPrereglage } from "./config";
import { partCorrompus, relancerFoyer, type EnvRoles } from "./jumeaux";
import { localVersIso } from "./temps";

const MIN = 60_000;
export const TRANCHE_MIN = 5;
const TRANCHE = TRANCHE_MIN * MIN;
const EVALUATION_MIN = 10;
const ENTRE_SUGGESTIONS_MIN = 15;
const MEME_SIGNAL_MIN = 45; // une suggestion ignorée ne revient pas avant 45 min
const iso = (t: number) => new Date(t).toISOString();
const ORDRE: NomPrereglage[] = ["lent", "normal", "rapide", "tres_rapide"];
const NOMS: Record<NomPrereglage, string> = { lent: "Lent", normal: "Normal", rapide: "Rapide", tres_rapide: "Très rapide" };
const virgule = (x: number, d = 1) => x.toFixed(d).replace(".", ",");

async function heures(db: D1Database) {
  const h = { ...HEURES_PAR_DEFAUT, ...((await lireConfig(db, "heures")) as Partial<Heures>) };
  const ms = (k: keyof Heures) => Date.parse(localVersIso(h[k]));
  return { debut: ms("debut"), minuit: ms("minuit"), jumeaux: ms("jumeaux"), revelation: ms("revelation"), fin: ms("fin"), brut: h };
}

/** Nouvelles cartes attendues à l'instant t par le préréglage : actifs × cartes par joueur × part de la soirée écoulée. */
function attendu(actifs: number, parJoueur: number, t: number, debut: number, revelation: number) {
  return actifs * parJoueur * Math.max(0, Math.min(1, (t - debut) / (revelation - debut)));
}

// ---------- Frise d'activité (ADM-14) ----------
export interface Tranche { debut: string; nouvelles: number; rescans: number; joueurs: number; actifs: number; corrompus: number; cumul: number; attendu: number }
export interface Repere { le: string; type: "heure" | "palier" | "sanction" | "mission" | "message" | "pause" | "suggestion" | "melange"; libelle: string }

export async function frise(env: { DB: D1Database }, t: number) {
  const db = env.DB, h = await heures(db), b = baremeDe(await lireParametres(db));
  const n = Math.ceil((h.fin - h.debut) / TRANCHE);
  const vues = Math.max(0, Math.min(n, Math.ceil((Math.min(t, h.fin) - h.debut) / TRANCHE)));
  const d0 = iso(h.debut), d1 = iso(Math.min(t, h.fin));

  const scans = (await db.prepare(
    `SELECT CAST((julianday(horodatage_serveur) - julianday(?1)) * 288 AS INTEGER) AS b,
       SUM(resultat = 'nouvelle_carte') AS nouvelles, SUM(resultat IN ('deja_vu', 'deja_vu_repete')) AS rescans
     FROM scans WHERE horodatage_serveur >= ?1 AND horodatage_serveur < ?2 GROUP BY b`,
  ).bind(d0, d1).all<{ b: number; nouvelles: number; rescans: number }>()).results;
  const joueurs = (await db.prepare("SELECT cree_le FROM personnages WHERE est_mj = 0 AND suspendu = 0 AND cree_le < ?").bind(d1).all<{ cree_le: string }>()).results.map((x) => Date.parse(x.cree_le));
  const corr = (await db.prepare(
    "SELECT c.personnage_id AS p, c.debut, c.fin FROM corruptions c JOIN personnages pe ON pe.id = c.personnage_id WHERE pe.est_mj = 0 AND c.fin > ?1 AND c.debut < ?2",
  ).bind(d0, d1).all<{ p: string; debut: string; fin: string }>()).results.map((x) => ({ p: x.p, a: Date.parse(x.debut), z: Date.parse(x.fin) }));
  const cartesAvant = (await db.prepare(
    "SELECT COUNT(*) AS n FROM collection c JOIN personnages p ON p.id = c.possesseur_id WHERE p.est_mj = 0 AND c.premier_scan_le < ?",
  ).bind(d0).first<{ n: number }>())?.n ?? 0;

  const parB = new Map(scans.map((s) => [s.b, s]));
  const tranches: Tranche[] = [];
  let cumul = cartesAvant;
  for (let i = 0; i < vues; i++) {
    const a = h.debut + i * TRANCHE, z = Math.min(a + TRANCHE, t);
    const s = parB.get(i);
    cumul += s?.nouvelles ?? 0;
    const actifs = joueurs.filter((x) => x <= z).length;
    tranches.push({
      debut: iso(a), nouvelles: s?.nouvelles ?? 0, rescans: s?.rescans ?? 0,
      joueurs: joueurs.filter((x) => x >= a && x < a + TRANCHE).length, actifs,
      corrompus: new Set(corr.filter((c) => c.a <= z && c.z > z).map((c) => c.p)).size,
      cumul, attendu: Math.round(attendu(actifs, b.cartes_par_joueur, z, h.debut, h.revelation)),
    });
  }

  // Repères : heures clés, mélanges des légendaires, actions du MJ et suggestions (RG-020-14)
  const prm = await lireParametres(db);
  const reperes: Repere[] = [
    { le: iso(h.minuit), type: "heure", libelle: "Minuit" },
    { le: iso(h.jumeaux), type: "heure", libelle: "2 h : jumeaux" },
    { le: iso(h.revelation), type: "heure", libelle: "Révélation" },
  ];
  for (let x = h.debut + prm.legendaires.melange_min * MIN; x < h.fin; x += prm.legendaires.melange_min * MIN) reperes.push({ le: iso(x), type: "melange", libelle: "Mélange des légendaires" });
  const ajouter = async (type: Repere["type"], sql: string, lib: (r: Record<string, string>) => string) => {
    for (const r of (await db.prepare(sql).bind(d0, d1).all<Record<string, string>>()).results) reperes.push({ le: r.le, type, libelle: lib(r) });
  };
  await ajouter("palier", "SELECT debut AS le, donnees FROM evenements WHERE type = 'palier' AND debut >= ?1 AND debut < ?2", (r) => `Palier ${JSON.parse(r.donnees).n}`);
  await ajouter("message", "SELECT debut AS le, donnees FROM evenements WHERE type = 'message' AND debut >= ?1 AND debut < ?2", (r) => `Message : ${JSON.parse(r.donnees).texte}`);
  await ajouter("pause", "SELECT debut AS le FROM evenements WHERE type = 'pause' AND debut >= ?1 AND debut < ?2", () => "Pause « Fermé pour inventaire »");
  await ajouter("sanction", "SELECT s.le, s.niveau, p.pseudo FROM sanctions s JOIN personnages p ON p.id = s.personnage_id WHERE s.le >= ?1 AND s.le < ?2", (r) => `Sanction ${r.niveau} : ${r.pseudo}`);
  await ajouter("mission", "SELECT m.debut AS le, m.code, p.pseudo FROM missions m JOIN personnages p ON p.id = m.personnage_id WHERE m.debut >= ?1 AND m.debut < ?2", (r) => `Mission ${r.code} : ${r.pseudo}`);
  await ajouter("suggestion", "SELECT cree_le AS le, texte, etat FROM suggestions WHERE cree_le >= ?1 AND cree_le < ?2", (r) => `Suggestion (${r.etat}) : ${r.texte}`);
  reperes.sort((x, y) => x.le.localeCompare(y.le));

  const der = tranches[tranches.length - 1];
  return {
    debut: iso(h.debut), fin: iso(h.fin), tranche_min: TRANCHE_MIN, nb: n, tranches, reperes,
    prereglage: b.prereglage, cartes_par_joueur: b.cartes_par_joueur,
    ratio: der && der.attendu > 0 ? der.cumul / der.attendu : null,
  };
}

// ---------- Signaux et suggestions (ADM-16, barème §6) ----------
export interface Suggestion { cle: string; texte: string; action: { prereglage?: NomPrereglage; transmission?: number; foyer?: boolean; rescan_quete?: number } }

const voisin = (p: NomPrereglage, sens: 1 | -1) => ORDRE[ORDRE.indexOf(p) + sens] as NomPrereglage | undefined;

/** Les signaux qui se déclenchent à l'instant t, par ordre de priorité. */
export async function signaux(env: { DB: D1Database }, t: number): Promise<Suggestion[]> {
  const db = env.DB, h = await heures(db), prm = await lireParametres(db), b = baremeDe(prm);
  if (t < h.debut + 30 * MIN || t >= h.revelation) return [];
  const out: Suggestion[] = [];
  const c = await partCorrompus(db, t);

  // Connexions : nouvelles cartes comparées à la courbe attendue du préréglage
  const cartes = (await db.prepare(
    "SELECT COUNT(*) AS n FROM collection c JOIN personnages p ON p.id = c.possesseur_id WHERE p.est_mj = 0 AND c.premier_scan_le <= ?",
  ).bind(iso(t)).first<{ n: number }>())?.n ?? 0;
  const att = attendu(c.actifs, b.cartes_par_joueur, t, h.debut, h.revelation);
  if (c.actifs >= 20 && att >= 30 && t >= h.debut + 45 * MIN) {
    const r = cartes / att, plus = voisin(b.prereglage, 1), moins = voisin(b.prereglage, -1);
    if (r > 2 && plus) out.push({ cle: "plus_rapide", texte: `Les connexions vont ${virgule(r)} fois plus vite que prévu. Passer au préréglage ${NOMS[plus]} ?`, action: { prereglage: plus } });
    if (r < 0.5 && moins) out.push({ cle: "plus_lent", texte: `Les connexions vont ${virgule(1 / r)} fois moins vite que prévu. Passer au préréglage ${NOMS[moins]} ?`, action: { prereglage: moins } });
  }

  // Palier atteint plus de 45 min avant l'heure prévue par le préréglage
  const pal = await db.prepare("SELECT debut, donnees FROM evenements WHERE type = 'palier' AND debut > ? AND debut <= ? ORDER BY id DESC LIMIT 1")
    .bind(iso(t - 15 * MIN), iso(t)).first<{ debut: string; donnees: string }>();
  const plus = voisin(b.prereglage, 1);
  if (pal && plus && c.actifs >= 20) {
    const d = JSON.parse(pal.donnees) as { n: number; seuil: number };
    const part = d.seuil / (c.actifs * b.cartes_par_joueur);
    const prevu = part >= 1 ? Infinity : h.debut + part * (h.revelation - h.debut);
    const avance = (prevu - Date.parse(pal.debut)) / MIN;
    if (avance > 45) out.push({
      cle: "palier",
      texte: `Palier ${d.n} atteint ${Number.isFinite(avance) ? `${Math.round(avance)} min avant l'heure prévue` : "alors que le préréglage ne l'attendait pas"}. Passer au préréglage ${NOMS[plus]} ?`,
      action: { prereglage: plus },
    });
  }

  // Contagion : plus de 50 % pendant 20 min, ou moins de 10 % une heure après le premier chat noir
  if (c.actifs >= 10 && c.part > 0.5) {
    const avant = await Promise.all([10, 20].map((m) => partCorrompus(db, t - m * MIN)));
    if (avant.every((x) => x.part > 0.5) && b.transmission > 0.1) {
      const v = Math.round(b.transmission * 100) - 10;
      out.push({ cle: "transmission", texte: `${Math.round(c.part * 100)} % de corrompus depuis 20 min. Baisser la transmission à ${v} % ?`, action: { transmission: v / 100 } });
    }
  }
  const chat = await db.prepare("SELECT MIN(chat_noir_le) AS le FROM personnages WHERE chat_noir_le IS NOT NULL").first<{ le: string | null }>();
  if (chat?.le && t - Date.parse(chat.le) >= 60 * MIN && c.actifs >= 20 && c.part < 0.1) {
    out.push({ cle: "foyer", texte: "Moins de 10 % de corrompus. Relancer un foyer ?", action: { foyer: true } });
  }

  // Rescans plus nombreux que les nouvelles cartes depuis 30 min
  const r30 = await db.prepare("SELECT SUM(resultat = 'nouvelle_carte') AS n, SUM(resultat IN ('deja_vu', 'deja_vu_repete')) AS r FROM scans WHERE horodatage_serveur > ? AND horodatage_serveur <= ?")
    .bind(iso(t - 30 * MIN), iso(t)).first<{ n: number | null; r: number | null }>();
  if ((r30?.r ?? 0) >= 20 && (r30?.r ?? 0) > (r30?.n ?? 0) && b.rescan_quete > 0.1) {
    out.push({ cle: "rescans", texte: "Plus de rescans que de nouvelles cartes depuis 30 min. Réduire la contribution des rescans à 0,1 ?", action: { rescan_quete: 0.1 } });
  }
  return out;
}

/**
 * Toutes les 10 min : évalue les signaux et propose au plus une suggestion (une toutes les 15 min au plus,
 * le même signal pas avant 45 min). La nouvelle remplace celle qui attendait encore. Le MJ est prévenu par push.
 */
export async function tickSuggestions(env: { DB: D1Database }, t: number, o: { force?: boolean } = {}) {
  const db = env.DB;
  if (!o.force) {
    const r = await db.prepare("SELECT valeur FROM compteurs WHERE cle = 'suggestions:tick'").first<{ valeur: number }>();
    if (r && t >= r.valeur && t - r.valeur < EVALUATION_MIN * MIN - 30_000) return null;
  }
  await db.prepare("INSERT INTO compteurs (cle, valeur) VALUES ('suggestions:tick', ?) ON CONFLICT (cle) DO UPDATE SET valeur = excluded.valeur").bind(t).run();
  const derniere = await db.prepare("SELECT MAX(cree_le) AS le FROM suggestions").first<{ le: string | null }>();
  if (derniere?.le && t - Date.parse(derniere.le) < ENTRE_SUGGESTIONS_MIN * MIN && t >= Date.parse(derniere.le)) return null;
  const recentes = new Set((await db.prepare("SELECT DISTINCT cle FROM suggestions WHERE cree_le > ?").bind(iso(t - MEME_SIGNAL_MIN * MIN)).all<{ cle: string }>()).results.map((x) => x.cle));
  const s = (await signaux(env, t)).find((x) => !recentes.has(x.cle));
  if (!s) return null;
  await db.prepare("UPDATE suggestions SET etat = 'perimee', traitee_le = ? WHERE etat = 'proposee'").bind(iso(t)).run();
  const r = await db.prepare("INSERT INTO suggestions (cle, texte, action, cree_le) VALUES (?, ?, ?, ?) RETURNING id")
    .bind(s.cle, s.texte, JSON.stringify(s.action), iso(t)).first<{ id: number }>();
  // Notification au MJ : ses personnages reçoivent une notif « suggestion », poussée par le tick des notifications
  const mjs = (await db.prepare("SELECT id FROM personnages WHERE est_mj = 1").all<{ id: string }>()).results;
  if (mjs.length) await db.batch(mjs.map((m) => db.prepare("INSERT INTO notifs (personnage_id, type, donnees, le) VALUES (?, 'suggestion', ?, ?)").bind(m.id, JSON.stringify({ id: r?.id, texte: s.texte }), iso(t))));
  return { id: r?.id, ...s };
}

export async function suggestionsEnCours(db: D1Database) {
  return (await db.prepare("SELECT id, cle, texte, action, cree_le, etat, traitee_le FROM suggestions ORDER BY id DESC LIMIT 8")
    .all<{ id: number; cle: string; texte: string; action: string; cree_le: string; etat: string; traitee_le: string | null }>()).results;
}

/** Le MJ applique (en un toucher) ou ignore une suggestion. Renvoie le message pour l'admin. */
export async function traiterSuggestion(env: EnvRoles, id: number, appliquer: boolean, auteur: string, heureDe: (id: string) => Promise<number>) {
  const db = env.DB;
  const s = await db.prepare("SELECT action, etat FROM suggestions WHERE id = ?").bind(id).first<{ action: string; etat: string }>();
  if (!s) return { erreur: "Suggestion introuvable." };
  if (s.etat !== "proposee") return { erreur: "Cette suggestion a déjà été traitée ou remplacée." };
  let message = "Suggestion ignorée.";
  if (appliquer) {
    const a = JSON.parse(s.action) as Suggestion["action"];
    const p = await lireParametres(db);
    if (a.prereglage && a.prereglage in PREREGLAGES) {
      await ecrireConfig(db, "parametres", { ...p, prereglage: a.prereglage, bareme: {} });
      message = `Préréglage « ${NOMS[a.prereglage]} » appliqué ; saisies manuelles du barème effacées.`;
    } else if (typeof a.transmission === "number") {
      await ecrireConfig(db, "parametres", { ...p, bareme: { ...p.bareme, transmission: a.transmission } });
      message = `Transmission réglée à ${Math.round(a.transmission * 100)} %.`;
    } else if (typeof a.rescan_quete === "number") {
      await ecrireConfig(db, "parametres", { ...p, bareme: { ...p.bareme, rescan_quete: a.rescan_quete } });
      message = `Contribution des rescans réglée à ${virgule(a.rescan_quete)}.`;
    } else if (a.foyer) {
      const n = await relancerFoyer(env, heureDe, 3);
      message = n ? `Foyer relancé : ${n} joueur(s) corrompu(s).` : "Aucun joueur sain à corrompre.";
    }
  }
  await db.prepare("UPDATE suggestions SET etat = ?, traitee_le = ?, auteur = ? WHERE id = ?").bind(appliquer ? "appliquee" : "ignoree", iso(Date.now()), auteur, id).run();
  return { message };
}
