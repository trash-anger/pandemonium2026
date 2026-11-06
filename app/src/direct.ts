// Temps réel du LOT-3 (étape A) : quête collective (FEAT-009), points de faction (FEAT-011),
// événements globaux (paliers, soldes éclair, glitch, messages du MJ ; ADM-5, ADM-6).
// Les téléphones interrogent /api/direct toutes les ~10 s ; la réponse est la même pour tous,
// donc mise en cache quelques secondes en périphérie (REQ-007, REQ-015).
import { baremeDe, HEURES_PAR_DEFAUT, lireConfig, lireParametres, type Heures } from "./config";
import { FACTIONS } from "./catalogue";
import { localVersIso } from "./temps";

interface EnvDirect { DB: D1Database }

const SOLDE_MIN = 5;
const GLITCH_S = 5;
/** Effets des paliers P-1 à P-5 (barème §1.2). P-3 (indice des jumeaux) prendra effet au LOT-4. */
export const EFFETS_PALIERS = ["solde", "glitch", "indice_jumeaux", "solde", "image_complete"] as const;
const MULTI_FACTIONS = [1, 1, 1.25, 1.5]; // RG-011-5 : selon 1, 2 ou 3 factions

export interface Joueur { id: string; est_mj: number; surconsommation: number }

const isoPlus = (t: number, ms: number) => new Date(t + ms).toISOString();

export async function ajouterCompteur(db: D1Database, cle: string, v: number): Promise<number> {
  const r = await db.prepare(
    "INSERT INTO compteurs (cle, valeur) VALUES (?, ?) ON CONFLICT (cle) DO UPDATE SET valeur = valeur + excluded.valeur RETURNING valeur",
  ).bind(cle, v).first<{ valeur: number }>();
  return r?.valeur ?? v;
}

export async function evenement(db: D1Database, e: { type: string; cle?: string; donnees?: object; debut: string; fin?: string | null; auteur?: string }) {
  const r = await db.prepare("INSERT OR IGNORE INTO evenements (type, cle, donnees, debut, fin, auteur) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(e.type, e.cle ?? null, JSON.stringify(e.donnees ?? {}), e.debut, e.fin ?? null, e.auteur ?? null).run();
  return r.meta.changes > 0;
}

async function factionsDe(db: D1Database, id: string): Promise<string[]> {
  const r = await db.prepare("SELECT DISTINCT faction_id AS f FROM etiquettes WHERE personnage_id = ? AND faction_id IS NOT NULL").bind(id).all<{ f: string }>();
  return r.results.map((x) => x.f);
}

/**
 * Crédite un scan (barème §1.1 et §2) : contribution à la quête et points de faction.
 * Le MJ ne gagne rien et ne fait rien gagner à ses factions ; être scanné par lui ne compte pas non plus.
 * Renvoie la contribution à la quête (à enregistrer avec le scan) et le nouveau total.
 */
export async function crediterScan(env: EnvDirect, t: number, scanneur: Joueur, cible: Joueur, sorte: "nouvelle" | "rescan") {
  if (scanneur.est_mj) return { quete: 0, total: null as number | null };
  const iso = new Date(t).toISOString();
  const params = await lireParametres(env.DB), b = baremeDe(params);
  const [fs, fc] = await Promise.all([factionsDe(env.DB, scanneur.id), factionsDe(env.DB, cible.id)]);

  // Quête : 1 connexion par nouvelle carte, une fraction par rescan compté ; ×1,25 par faction en plus ; ×0,5 en surconsommation
  let quete = sorte === "nouvelle" ? 1 : b.rescan_quete;
  quete *= MULTI_FACTIONS[Math.min(3, Math.max(1, fs.length))];
  if (scanneur.surconsommation) quete *= 0.5;
  if (sorte === "nouvelle" && (await soldeEnCours(env.DB, iso))) quete *= 2; // P-1, P-4

  // Points de faction : à chacune des factions du joueur (RG-011-4), −50 % en surconsommation
  const gains: { id: string; factions: string[]; points: number; raison: string; surconso: number }[] = [];
  if (sorte === "nouvelle") {
    gains.push({ id: scanneur.id, factions: fs, points: 10, raison: "nouvelle_carte", surconso: scanneur.surconsommation });
    if (fs.length && fc.length && !fs.some((f) => fc.includes(f))) gains.push({ id: scanneur.id, factions: fs, points: 5, raison: "inter_faction", surconso: scanneur.surconsommation });
    if (!cible.est_mj) gains.push({ id: cible.id, factions: fc, points: 5, raison: "scanne", surconso: cible.surconsommation });
  } else {
    gains.push({ id: scanneur.id, factions: fs, points: 2, raison: "rescan", surconso: scanneur.surconsommation });
  }
  const requetes: D1PreparedStatement[] = [];
  for (const g of gains) {
    const p = g.surconso ? g.points / 2 : g.points;
    for (const f of g.factions) {
      requetes.push(env.DB.prepare("INSERT INTO points_faction (personnage_id, faction, points, raison, le) VALUES (?, ?, ?, ?, ?)").bind(g.id, f, p, g.raison, iso));
      requetes.push(env.DB.prepare("INSERT INTO compteurs (cle, valeur) VALUES (?, ?) ON CONFLICT (cle) DO UPDATE SET valeur = valeur + excluded.valeur").bind("faction:" + f, p));
    }
  }
  if (requetes.length) await env.DB.batch(requetes);
  const total = await ajouterCompteur(env.DB, "quete", quete);
  await franchirPaliers(env, total, t, b.paliers);
  return { quete, total };
}

async function soldeEnCours(db: D1Database, iso: string) {
  return !!(await db.prepare("SELECT 1 AS x FROM evenements WHERE type = 'solde' AND debut <= ? AND fin > ? LIMIT 1").bind(iso, iso).first());
}

/** Chaque palier n'est franchi qu'une fois (clé unique), et son effet démarre au moment du franchissement. */
export async function franchirPaliers(env: EnvDirect, total: number, t: number, seuils: number[]) {
  const iso = new Date(t).toISOString();
  for (let i = 0; i < seuils.length; i++) {
    if (total < seuils[i]) break;
    const effet = EFFETS_PALIERS[i];
    if (!(await evenement(env.DB, { type: "palier", cle: `palier:${i + 1}`, donnees: { n: i + 1, effet, seuil: seuils[i] }, debut: iso }))) continue;
    if (effet === "solde") await evenement(env.DB, { type: "solde", donnees: { palier: i + 1 }, debut: iso, fin: isoPlus(t, SOLDE_MIN * 60_000) });
    if (effet === "glitch") await evenement(env.DB, { type: "glitch", donnees: { palier: i + 1 }, debut: iso, fin: isoPlus(t, GLITCH_S * 1000) });
  }
}

export async function heuresIso(db: D1Database) {
  const h = { ...HEURES_PAR_DEFAUT, ...((await lireConfig(db, "heures")) as Partial<Heures>) };
  const r = {} as Record<keyof Heures, string>;
  for (const k of Object.keys(HEURES_PAR_DEFAUT) as (keyof Heures)[]) r[k] = localVersIso(h[k]);
  return r;
}

/** État du direct, identique pour tous les joueurs. */
export async function etatDirect(env: EnvDirect, t: number) {
  const iso = new Date(t).toISOString();
  const b = baremeDe(await lireParametres(env.DB));
  const cpt = Object.fromEntries((await env.DB.prepare("SELECT cle, valeur FROM compteurs").all<{ cle: string; valeur: number }>()).results.map((x) => [x.cle, x.valeur]));
  const membres = Object.fromEntries((await env.DB.prepare(
    "SELECT e.faction_id AS f, COUNT(DISTINCT e.personnage_id) AS n FROM etiquettes e JOIN personnages p ON p.id = e.personnage_id WHERE e.etat = 'reclamee' AND p.est_mj = 0 GROUP BY e.faction_id",
  ).all<{ f: string; n: number }>()).results.map((x) => [x.f, x.n]));
  const total = cpt.quete ?? 0;
  const franchis = b.paliers.filter((s) => total >= s).length;
  // Les 20 derniers événements : chaque téléphone retient ceux qu'il a déjà montrés
  const evts = (await env.DB.prepare("SELECT id, type, donnees, debut, fin FROM evenements ORDER BY id DESC LIMIT 20").all<{ id: number; type: string; donnees: string; debut: string; fin: string | null }>()).results;
  const solde = evts.find((e) => e.type === "solde" && e.debut <= iso && e.fin && e.fin > iso);
  return {
    t: iso,
    quete: { total: Math.floor(total * 100) / 100, seuils: b.paliers, franchis, prochain: b.paliers[franchis] ?? null, prereglage: b.prereglage },
    solde: solde ? { fin: solde.fin } : null,
    factions: Object.fromEntries(FACTIONS.map((f) => {
      const points = cpt["faction:" + f] ?? 0, n = membres[f] ?? 0;
      return [f, { points, membres: n, moyenne: n ? Math.round((points / n) * 10) / 10 : 0 }];
    })),
    evenements: evts.reverse().map((e) => ({ ...e, donnees: JSON.parse(e.donnees) })),
    heures: await heuresIso(env.DB),
  };
}

/** GET /api/direct : mis en cache 4 s en périphérie quand l'heure n'est pas simulée. */
export async function routeDirect(req: Request, env: EnvDirect, t: number, simule: boolean): Promise<Response> {
  const cache = !simule && typeof caches !== "undefined" ? (caches as unknown as { default: Cache }).default : null;
  const cle = new Request(new URL("/api/direct", req.url).toString());
  if (cache) {
    const r = await cache.match(cle);
    if (r) return r;
  }
  const r = new Response(JSON.stringify(await etatDirect(env, t)), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=4" },
  });
  if (cache) await cache.put(cle, r.clone());
  return new Response(r.body, { headers: { ...Object.fromEntries(r.headers), "Cache-Control": "no-store" } });
}

/** Heure de Montréal au format des réglages (AAAA-MM-JJTHH:MM), pour « déclencher la révélation maintenant ». */
export function isoVersLocal(t: number): string {
  const s = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(t));
  return s.replace(" ", "T");
}
