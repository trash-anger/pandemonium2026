// Révélation de 5 h (FEAT-009, LOT-3 étape B) : constellation de toutes les connexions de la soirée.
// Le serveur fige un instantané (nœuds, liens, image cachée, paliers franchis) avec les seules données
// d'avant l'heure de révélation, une fois par heure de révélation, et le sert à tous (RG-009-13).
// Écart assumé : la disposition d3-force est calculée sur chaque téléphone, pas sur le serveur (10 ms de CPU
// par requête sur le free tier). Elle est déterministe (positions initiales issues d'un hachage, générateur
// pseudo-aléatoire fixe de d3, opérations IEEE seulement), donc tout le monde voit la même image.
import { baremeDe, lireParametres } from "./config";
import { FACTIONS } from "./catalogue";
import { heuresIso } from "./direct";

interface EnvRev { DB: D1Database }

/** Image cachée : points sur une grille l × h (coordonnées entières). Jamais dans le dépôt, sauf ce repli. */
export interface ImageCachee { nom: string; l: number; h: number; p: [number, number][] }

/** Part des joueurs aimantés vers le dessin selon les paliers franchis (barème §1.2 : complète à P-5). */
export const PART_AIMANTEE = [0.1, 0.3, 0.5, 0.7, 0.85, 1];

// Repli : « DÉJÀ VU ! » en police 5 × 7, deux lignes au-dessus pour les accents
const GLYPHES: Record<string, string[]> = {
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
};
const ACCENTS: Record<string, [string, string]> = { É: ["E", "00010"], À: ["A", "01000"] };

/** Une ligne par segment séparé par « / » (deux lignes par défaut : l'image tient mieux sur un téléphone en portrait). */
export function imageParDefaut(texte = "DÉJÀ/VU !"): ImageCachee {
  const S = 3; // chaque pixel de la police devient 3 × 3 points
  const lignes = texte.split("/").map((x) => x.trim());
  const largeur = (l: string) => [...l].reduce((n, c) => n + (c === " " ? 4 : 6), 0) - 1;
  const lmax = Math.max(...lignes.map(largeur));
  const p: [number, number][] = [];
  lignes.forEach((ligne, k) => {
    let x0 = Math.floor((lmax - largeur(ligne)) / 2);
    const y0 = k * 10; // 9 rangées (accent, vide, 7 de glyphe) + 1 d'interligne
    for (const c of ligne) {
      if (c === " ") { x0 += 4; continue; }
      const [base, accent] = ACCENTS[c] ?? [c, null];
      const g = GLYPHES[base];
      if (!g) { x0 += 6; continue; }
      [accent ?? "00000", "00000", ...g].forEach((rangee, y) => [...rangee].forEach((b, x) => {
        if (b !== "1") return;
        for (let i = 0; i < S; i++) for (let j = 0; j < S; j++) p.push([(x0 + x) * S + i, (y0 + y) * S + j]);
      }));
      x0 += 6;
    }
  });
  return { nom: texte.replace("/", " "), l: lmax * S, h: (lignes.length * 10 - 1) * S, p };
}

export async function lireImage(db: D1Database): Promise<ImageCachee> {
  const r = await db.prepare("SELECT valeur FROM config WHERE cle = 'revelation_image'").first<{ valeur: string }>();
  return r ? (JSON.parse(r.valeur) as ImageCachee) : imageParDefaut();
}

/** Valide une image envoyée par l'admin (points échantillonnés dans le navigateur du MJ). */
export function validerImage(brut: unknown): ImageCachee | null {
  const o = brut as Partial<ImageCachee> | null;
  if (!o || !Number.isInteger(o.l) || !Number.isInteger(o.h) || !Array.isArray(o.p)) return null;
  const l = o.l!, h = o.h!;
  if (l < 4 || h < 4 || l > 400 || h > 400 || o.p.length < 20 || o.p.length > 5000) return null;
  const p: [number, number][] = [];
  for (const q of o.p) {
    if (!Array.isArray(q) || !Number.isInteger(q[0]) || !Number.isInteger(q[1]) || q[0] < 0 || q[1] < 0 || q[0] >= l || q[1] >= h) return null;
    p.push([q[0], q[1]]);
  }
  return { nom: String(o.nom ?? "image").replace(/[\u0000-\u001f<>]/g, "").slice(0, 60), l, h, p };
}

export async function ecrireImage(db: D1Database, img: ImageCachee | null) {
  if (!img) await db.prepare("DELETE FROM config WHERE cle = 'revelation_image'").run();
  else await db.prepare("INSERT INTO config (cle, valeur) VALUES ('revelation_image', ?) ON CONFLICT (cle) DO UPDATE SET valeur = excluded.valeur, modifie_le = datetime('now')")
    .bind(JSON.stringify(img)).run();
}

/** Aperçu du MJ : tout l'état présent, quelle que soit la date des données (le banc les date à l'heure simulée). */
export const SANS_BORNE = "9999-12-31T23:59:59.999Z";

/**
 * Construit l'instantané de la révélation à l'heure `rev` (ISO), sans l'enregistrer.
 * Seules comptent les données d'avant `borne` (par défaut l'heure de révélation).
 */
export async function construireInstantane(env: EnvRev, rev: string, borne = rev) {
  const db = env.DB;
  const persos = (await db.prepare("SELECT id, pseudo, type, couleur, est_mj FROM personnages WHERE cree_le < ? ORDER BY cree_le, id").bind(borne)
    .all<{ id: string; pseudo: string; type: string; couleur: string; est_mj: number }>()).results;
  const index = new Map(persos.map((p, i) => [p.id, i]));
  // Connexions : paires uniques, quel que soit le sens du premier scan (RG-009-5)
  const paires = (await db.prepare(
    "SELECT DISTINCT MIN(possesseur_id, personnage_id) AS a, MAX(possesseur_id, personnage_id) AS b FROM collection WHERE possesseur_id <> personnage_id AND premier_scan_le < ?",
  ).bind(borne).all<{ a: string; b: string }>()).results;
  const liens: [number, number][] = [];
  for (const x of paires) {
    const a = index.get(x.a), b = index.get(x.b);
    if (a !== undefined && b !== undefined) liens.push([a, b]);
  }
  // Faction de rattachement (RG-011-6) : parmi les siennes, celle où le joueur a marqué le moins de points
  const fac = (await db.prepare("SELECT DISTINCT personnage_id AS id, faction_id AS f FROM etiquettes WHERE personnage_id IS NOT NULL AND faction_id IS NOT NULL")
    .all<{ id: string; f: string }>()).results;
  const pts = (await db.prepare("SELECT personnage_id AS id, faction AS f, SUM(points) AS n FROM points_faction WHERE le < ? GROUP BY personnage_id, faction").bind(borne)
    .all<{ id: string; f: string; n: number }>()).results;
  const points = new Map(pts.map((x) => [x.id + "|" + x.f, x.n]));
  const factions = new Map<string, string[]>();
  for (const x of fac) factions.set(x.id, [...(factions.get(x.id) ?? []), x.f]);
  const rattachement = (id: string) => {
    const fs = (factions.get(id) ?? []).sort((a, b) => FACTIONS.indexOf(a as never) - FACTIONS.indexOf(b as never));
    let meilleure: string | null = null, min = Infinity;
    for (const f of fs) { const n = points.get(id + "|" + f) ?? 0; if (n < min) { min = n; meilleure = f; } }
    return { f: meilleure, multi: fs.length > 1 };
  };
  // Paliers franchis à l'heure de la révélation : somme des contributions des scans d'avant
  const b = baremeDe(await lireParametres(db));
  const q = (await db.prepare("SELECT COALESCE(SUM(quete), 0) AS n FROM scans WHERE horodatage_serveur < ?").bind(borne).first<{ n: number }>())?.n ?? 0;
  const franchis = b.paliers.filter((s) => q >= s).length;
  return {
    v: 1, revelation: rev, quete: Math.floor(q * 100) / 100, franchis, part: PART_AIMANTEE[franchis],
    noeuds: persos.map((p) => {
      const r = rattachement(p.id);
      return { id: p.id, pseudo: p.pseudo, type: p.type, couleur: p.couleur, faction: r.f, ...(r.multi ? { multi: 1 } : {}), ...(p.est_mj ? { mj: 1 } : {}) };
    }),
    liens,
    image: await lireImage(db),
  };
}

/**
 * Instantané figé : construit au premier appel après l'heure, puis relu (le premier enregistré gagne).
 * Un instantané sans personnage n'est jamais figé : révélation déclenchée trop tôt, ou données du banc
 * datées de l'heure simulée. Il est reconstruit à chaque appel jusqu'à ce qu'il y ait quelqu'un.
 */
export async function instantane(env: EnvRev, rev: string, t: number): Promise<string> {
  const deja = await env.DB.prepare("SELECT donnees FROM revelations WHERE revelation = ?").bind(rev).first<{ donnees: string }>();
  if (deja && !deja.donnees.includes('"noeuds":[]')) return deja.donnees;
  const inst = await construireInstantane(env, rev);
  const donnees = JSON.stringify(inst);
  if (!inst.noeuds.length) return donnees;
  await env.DB.prepare("INSERT INTO revelations (revelation, donnees, cree_le) VALUES (?, ?, ?) ON CONFLICT (revelation) DO UPDATE SET donnees = excluded.donnees, cree_le = excluded.cree_le WHERE revelations.donnees LIKE '%\"noeuds\":[]%'")
    .bind(rev, donnees, new Date(t).toISOString()).run();
  const r = await env.DB.prepare("SELECT donnees FROM revelations WHERE revelation = ?").bind(rev).first<{ donnees: string }>();
  return r?.donnees ?? donnees;
}

/** GET /api/revelation : refusé avant l'heure ; ensuite le même instantané pour tous, en cache 30 s en périphérie. */
export async function routeRevelation(req: Request, env: EnvRev, t: number, simule: boolean): Promise<Response> {
  const h = await heuresIso(env.DB);
  if (new Date(t).toISOString() < h.revelation) {
    return new Response(JSON.stringify({ erreur: "pas_encore", revelation: h.revelation }), { status: 403, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
  }
  const cache = !simule && typeof caches !== "undefined" ? (caches as unknown as { default: Cache }).default : null;
  const cle = new Request(new URL("/api/revelation?r=" + encodeURIComponent(h.revelation), req.url).toString());
  if (cache) {
    const r = await cache.match(cle);
    if (r) return new Response(r.body, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
  }
  const corps = await instantane(env, h.revelation, t);
  if (cache) await cache.put(cle, new Response(corps, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=30" } }));
  return new Response(corps, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}
