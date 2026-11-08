// Après la fête : tout le trafic de p.uyt.re et de pandemonium2026.uyt.re arrive sur la page de fin (dossier fin/ du dépôt).
// Ici : la page, ses photos (celles de la révélation) et la collecte des analytics, sans cookie.
import html from "../../fin/index.html";
import og from "../../fin/og.png";
import { utilisateurConnecte, type EnvAuth } from "./auth";
import { photosRevelation } from "./mur";

export const HOTE_TEASER = "pandemonium2026.uyt.re";
const TYPES_CLIC = ["partage", "partage_ok", "copie", "pandemonium", "langue"];
const MAX_CLICS_PAR_VISITE = 60;
const MAX_VISITES_PAR_JOUR = 400; // par empreinte : au-delà, on ignore (rechargements en boucle, robot)

export const pageFin = (status = 200) =>
  new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" } });

export const imageOG = () =>
  new Response(og, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });

type EnvFin = { DB: D1Database; SESSION_SECRET?: string } & Partial<EnvAuth>;

/** Photos de la mosaïque : celles de la révélation (accord du joueur, pas écartées par le MJ). Cache de 5 min. */
async function photos(req: Request, env: EnvFin): Promise<Response> {
  const cache = typeof caches !== "undefined" ? (caches as unknown as { default?: Cache }).default : undefined;
  const cle = new Request(new URL("/fin/photos.json", req.url).toString());
  const deja = cache && (await cache.match(cle));
  if (deja) return deja;
  const r = new Response(JSON.stringify({ photos: await photosRevelation(env.DB, 30) }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
  });
  if (cache) await cache.put(cle, r.clone());
  return r;
}

const RESEAUX = /(^|\.)(facebook\.com|fb\.me|messenger\.com|instagram\.com|t\.co|x\.com|twitter\.com|linkedin\.com|lnkd\.in|whatsapp\.com|reddit\.com|threads\.net|tiktok\.com|bsky\.app|snapchat\.com|youtube\.com)$/;
const RECHERCHE = /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|qwant\.com|ecosia\.org|yahoo\.[a-z.]+|search\.brave\.com|startpage\.com)$/;
const ROBOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|embedly|whatsapp|telegram|discord|curl|wget|python|monitor/i;

export function appareilDe(ua: string) {
  const os = /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows"
    : /CrOS/.test(ua) ? "ChromeOS" : /Mac OS X|Macintosh/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Autre";
  const navigateur = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /SamsungBrowser/.test(ua) ? "Samsung Internet"
    : /FBAN|FBAV|FB_IAB|Instagram/.test(ua) ? "Facebook / Instagram (intégré)" : /Firefox|FxiOS/.test(ua) ? "Firefox"
    : /CriOS|Chrome/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : "Autre";
  const appareil = /iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)) ? "Tablette"
    : /Mobi|iPhone|iPod|Android/.test(ua) ? "Mobile" : "Ordinateur";
  return { appareil, navigateur, os };
}

/** Provenance : campagne (utm) > étiquette scannée > réseaux sociaux > moteur de recherche > autre site > ancien teaser > direct. */
export function sourceDe(p: { utm: boolean; code: string | null; referent: string | null; hote: string }) {
  if (p.utm) return "campagne";
  if (p.code) return "etiquette";
  if (p.referent && RESEAUX.test(p.referent)) return "reseaux";
  if (p.referent && RECHERCHE.test(p.referent)) return "recherche";
  if (p.referent) return "site";
  if (p.hote === HOTE_TEASER) return "teaser";
  return "direct";
}

const court = (x: unknown, n = 80) => (typeof x === "string" && x ? x.slice(0, n) : null);
async function empreinte(secret: string, ...parts: string[]) {
  const o = await crypto.subtle.digest("SHA-256", new TextEncoder().encode([secret, ...parts].join("|")));
  return [...new Uint8Array(o)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function corps(req: Request): Promise<Record<string, unknown> | null> {
  const t = await req.text().catch(() => "");
  if (t.length > 4000) return null;
  try { const j = JSON.parse(t); return j && typeof j === "object" ? j : null; } catch { return null; }
}
const vide = (status = 204) => new Response(null, { status });

/** Début de visite : la page envoie ce que le serveur ne voit pas (chemin, référent, utm, langue, écran, app installée). */
async function debutVisite(req: Request, env: EnvFin, t: number): Promise<Response> {
  const j = await corps(req);
  if (!j) return vide(400);
  // Le MJ connecté ne se compte pas lui-même
  if (env.PUBLIC_ORIGIN && (await utilisateurConnecte(req, env as EnvAuth).catch(() => null))) return Response.json({ id: null, mj: true });
  const ua = req.headers.get("User-Agent") || "";
  const iso = new Date(t).toISOString(), jour = iso.slice(0, 10);
  const ip = req.headers.get("CF-Connecting-IP") || "";
  const visiteur = await empreinte(env.SESSION_SECRET || "fin", jour, ip, ua);
  const deja = (await env.DB.prepare("SELECT COUNT(*) AS n FROM visites WHERE visiteur = ? AND le >= ?").bind(visiteur, jour).first<{ n: number }>())?.n ?? 0;
  if (deja >= MAX_VISITES_PAR_JOUR) return Response.json({ id: null });

  const hote = new URL(req.url).hostname;
  const chemin = court(j.chemin, 120) || "/";
  const m = chemin.match(/^\/([A-Za-z0-9]{4,6})\/?$/);
  const code = m ? (await env.DB.prepare("SELECT code FROM etiquettes WHERE code = ?").bind(m[1].toUpperCase()).first<{ code: string }>())?.code ?? null : null;
  let referent: string | null = null;
  try { const r = new URL(String(j.referent || "")); if (r.hostname !== hote) referent = r.hostname.replace(/^www\./, "").slice(0, 80); } catch { /* pas de référent */ }
  const q = new URLSearchParams(court(j.recherche, 400) || "");
  const utm = { source: court(q.get("utm_source"), 60), medium: court(q.get("utm_medium"), 60), campagne: court(q.get("utm_campaign"), 60) };
  const cf = (req as unknown as { cf?: { country?: string; region?: string; city?: string } }).cf || {};
  const { appareil, navigateur, os } = appareilDe(ua);
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO visites (id, le, visiteur, hote, chemin, code, source, referent, utm_source, utm_medium, utm_campaign, pays, region, ville,
       appareil, navigateur, os, langue, app, ecran, bot, vu_le) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).bind(id, iso, visiteur, hote, chemin, code, sourceDe({ utm: !!(utm.source || utm.campagne), code, referent, hote }), referent,
    utm.source, utm.medium, utm.campagne, court(cf.country, 4), court(cf.region, 60), court(cf.city, 60),
    appareil, navigateur, os, court(j.langue, 12)?.toLowerCase() ?? null, j.app ? 1 : 0, court(j.ecran, 20), ROBOT.test(ua) || !ua ? 1 : 0, iso).run();
  return Response.json({ id });
}

/** Temps passé (page visible) et défilement : envoyés en sendBeacon quand la page se cache ou se ferme. */
async function suiteVisite(req: Request, env: EnvFin, t: number): Promise<Response> {
  const j = await corps(req);
  if (!j || typeof j.id !== "string") return vide(400);
  const d = Math.max(0, Math.min(6 * 3600_000, Math.round(Number(j.duree) || 0)));
  const s = Math.max(0, Math.min(100, Math.round(Number(j.defilement) || 0)));
  await env.DB.prepare("UPDATE visites SET duree_ms = MAX(duree_ms, ?), defilement = MAX(defilement, ?), vu_le = ? WHERE id = ?")
    .bind(d, s, new Date(t).toISOString(), j.id).run();
  return vide();
}

async function clic(req: Request, env: EnvFin, t: number): Promise<Response> {
  const j = await corps(req);
  if (!j || typeof j.id !== "string" || !TYPES_CLIC.includes(String(j.type))) return vide(400);
  const v = await env.DB.prepare("SELECT (SELECT COUNT(*) FROM clics_fin WHERE visite_id = ?1) AS n, (SELECT 1 FROM visites WHERE id = ?1) AS ok")
    .bind(j.id).first<{ n: number; ok: number | null }>();
  if (!v?.ok || v.n >= MAX_CLICS_PAR_VISITE) return vide();
  await env.DB.prepare("INSERT INTO clics_fin (visite_id, type, le) VALUES (?, ?, ?)").bind(j.id, j.type, new Date(t).toISOString()).run();
  return vide();
}

/** Routes /fin/… ; null si le chemin n'en est pas une. */
export async function routeFin(req: Request, env: EnvFin, url: URL, t = Date.now()): Promise<Response | null> {
  const p = url.pathname;
  if (p === "/og.png" || p === "/fin/og.png") return imageOG();
  if (p === "/fin/photos.json" && req.method === "GET") return photos(req, env);
  if (req.method !== "POST") return p.startsWith("/fin/") ? vide(405) : null;
  if (p === "/fin/v") return debutVisite(req, env, t);
  if (p === "/fin/f") return suiteVisite(req, env, t);
  if (p === "/fin/e") return clic(req, env, t);
  return null;
}
