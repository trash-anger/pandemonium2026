// Notifications Web Push (LOT-3 D, FEAT-016, CT-008).
// - Pushs sans contenu chiffré : le serveur range le texte dans abonnements_push.contenu, puis réveille le
//   téléphone ; le service worker lit ce contenu avec son adresse d'abonnement (longue et aléatoire) comme clé.
//   Pas de chiffrement par message : quelques ms de CPU seulement (free tier).
// - VAPID (RFC 8292) en WebCrypto : la clé privée est le secret VAPID_JWK (JWK P-256), jamais dans le dépôt.
// - Un « tick » par minute (Cron Trigger, et /api/notifs en secours) : annonces H−30 et révélation, messages du
//   MJ, paliers, et notifications personnelles (jumeau, chat noir, sanctions, missions).
// - RG-016-3 : au plus un push toutes les 10 min par appareil, sauf annonces de fin, jumeau et chat noir.
// - Plus de 40 envois : répartis en lots via une liaison de service vers ce même Worker (50 sous-requêtes par appel).
import { HEURES_PAR_DEFAUT, lireConfig, type Heures } from "./config";
import { localVersIso } from "./temps";

export interface EnvPush {
  DB: D1Database;
  PUBLIC_ORIGIN: string;
  VAPID_JWK?: string;
  SESSION_SECRET?: string;
  SOI?: Fetcher;
}

const MIN = 60_000;
const INTERVALLE_MIN = 10;
const PAR_LOT = 40;
const ECHECS_MAX = 10;
const ABONNEMENTS_PAR_PERSO = 5;
const iso = (t: number) => new Date(t).toISOString();

/** Notifications personnelles poussées ; les autres (corrompu, retrouvailles…) se vivent face à face. */
export const TYPES_PERSO = ["jumeau", "chat_noir", "sanction", "sanction_annulee", "mission", "mission_reussie", "mission_echouee", "mission_annulee"];
const PRIORITAIRES = ["jumeau", "chat_noir"];
const TYPES_EVT = ["message", "palier"];

// Services de push connus : le serveur ne contacte jamais une autre adresse (pas de SSRF).
const HOTES = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /(^|\.)push\.apple\.com$/,
  /^updates\.push\.services\.mozilla\.com$/, /^push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/];
export function endpointValide(e: unknown): e is string {
  if (typeof e !== "string" || e.length > 1000) return false;
  try {
    const u = new URL(e);
    return u.protocol === "https:" && HOTES.some((h) => h.test(u.hostname));
  } catch {
    return false;
  }
}

// ---------- VAPID ----------
const b64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const deB64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

function cleVapid(env: EnvPush): { x: string; y: string; d: string } | null {
  try {
    const k = JSON.parse(env.VAPID_JWK || "");
    return k && k.kty === "EC" && k.crv === "P-256" && k.x && k.y && k.d ? k : null;
  } catch {
    return null;
  }
}
/** Clé publique (point non compressé, base64url) : applicationServerKey du navigateur. */
export function clePublique(env: EnvPush): string | null {
  const k = cleVapid(env);
  return k ? b64u(new Uint8Array([4, ...deB64u(k.x), ...deB64u(k.y)])) : null;
}

const jetons = new Map<string, { jwt: string; exp: number }>();
/** JWT ES256 par service de push, gardé 11 h (valable 12 h). L'expiration suit l'heure réelle, même sur le banc. */
async function jetonVapid(env: EnvPush, aud: string): Promise<string> {
  const c = jetons.get(aud), now = Date.now();
  if (c && c.exp - now > MIN * 60) return c.jwt;
  const k = cleVapid(env)!;
  const cle = await crypto.subtle.importKey("jwk", { kty: "EC", crv: "P-256", x: k.x, y: k.y, d: k.d, ext: true }, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const exp = now + 12 * 60 * MIN;
  const enc = (o: object) => b64u(new TextEncoder().encode(JSON.stringify(o)));
  // sub : une adresse https suffit (Apple accepte mailto: ou https:) ; pas d'adresse courriel dans le dépôt
  const corps = `${enc({ typ: "JWT", alg: "ES256" })}.${enc({ aud, exp: Math.floor(exp / 1000), sub: env.PUBLIC_ORIGIN })}`;
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, cle, new TextEncoder().encode(corps)));
  const jwt = `${corps}.${b64u(sig)}`;
  jetons.set(aud, { jwt, exp });
  return jwt;
}

/** Réveille un appareil (push sans contenu). Renvoie le statut HTTP, 0 si le réseau a échoué. */
async function reveiller(env: EnvPush, endpoint: string): Promise<number> {
  try {
    const jwt = await jetonVapid(env, new URL(endpoint).origin);
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `vapid t=${jwt}, k=${clePublique(env)}`, TTL: "3600", Urgency: "high", "Content-Length": "0" },
    });
    return r.status;
  } catch {
    return 0;
  }
}

/** Envoie un lot et tient les abonnements à jour : 404/410 = abonnement mort, supprimé. */
export async function envoyerLot(env: EnvPush, endpoints: string[]) {
  const statuts = await Promise.all(endpoints.map((e) => reveiller(env, e)));
  const req: D1PreparedStatement[] = [];
  let ok = 0, morts = 0;
  statuts.forEach((s, i) => {
    if (s >= 200 && s < 300) { ok++; req.push(env.DB.prepare("UPDATE abonnements_push SET echecs = 0 WHERE endpoint = ?").bind(endpoints[i])); }
    else if (s === 404 || s === 410) { morts++; req.push(env.DB.prepare("DELETE FROM abonnements_push WHERE endpoint = ?").bind(endpoints[i])); }
    else req.push(env.DB.prepare("UPDATE abonnements_push SET echecs = echecs + 1 WHERE endpoint = ?").bind(endpoints[i]));
  });
  if (req.length) await env.DB.batch(req);
  return { ok, morts, rates: endpoints.length - ok - morts };
}

/** Jeton des appels internes (liaison de service vers soi-même). */
export async function jetonInterne(env: EnvPush) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode((env.SESSION_SECRET || "dev-seulement") + ":push-interne"));
  return b64u(new Uint8Array(h));
}

/** POST /__push/lot, appelé par le tick via la liaison SOI. */
export async function routeLotInterne(req: Request, env: EnvPush): Promise<Response> {
  if (req.headers.get("X-Push-Interne") !== (await jetonInterne(env))) return new Response("Interdit", { status: 403 });
  const { endpoints } = (await req.json().catch(() => ({}))) as { endpoints?: string[] };
  const liste = (endpoints || []).filter(endpointValide).slice(0, PAR_LOT);
  return Response.json(await envoyerLot(env, liste));
}

async function distribuer(env: EnvPush, endpoints: string[]) {
  const lots: string[][] = [];
  for (let i = 0; i < endpoints.length; i += PAR_LOT) lots.push(endpoints.slice(i, i + PAR_LOT));
  const jeton = lots.length > 1 ? await jetonInterne(env) : "";
  const res = await Promise.all(lots.map(async (lot, i) => {
    if (i === 0 || !env.SOI) return envoyerLot(env, lot);
    const r = await env.SOI.fetch("https://interne/__push/lot", { method: "POST", headers: { "Content-Type": "application/json", "X-Push-Interne": jeton }, body: JSON.stringify({ endpoints: lot }) }).catch(() => null);
    return r && r.ok ? ((await r.json()) as { ok: number; morts: number; rates: number }) : { ok: 0, morts: 0, rates: lot.length };
  }));
  return res.reduce((a, b) => ({ ok: a.ok + b.ok, morts: a.morts + b.morts, rates: a.rates + b.rates }), { ok: 0, morts: 0, rates: 0 });
}

// ---------- Textes (FR/EN, épicènes) ----------
export interface Notification { titre: string; texte: string; tag: string }
type Element = { k: "notif"; type: string; donnees: Record<string, unknown> } | { k: "evt"; type: string; donnees: Record<string, unknown> } | { k: "annonce"; cle: "h30" | "revelation"; fin: string } | { k: "test" };

function heureLisible(local: string, l: string) {
  const [h, m] = local.slice(11, 16).split(":").map(Number);
  const mm = String(m).padStart(2, "0");
  return l === "en" ? `${h % 12 || 12}${m ? ":" + mm : ""} ${h < 12 ? "AM" : "PM"}` : `${h} h${m ? " " + mm : ""}`;
}

const EFFETS_FR: Record<string, string> = {
  solde: "Soldes éclair : tes nouvelles cartes comptent double pendant 5 min !",
  glitch: "La Matrice vient de glitcher.",
  indice_jumeaux: "Indice bonus pour les jumeaux pas encore réunis.",
  image_complete: "L'image cachée sera révélée en entier.",
};
const EFFETS_EN: Record<string, string> = {
  solde: "Flash sale: your new cards count double for 5 min!",
  glitch: "The Matrix just glitched.",
  indice_jumeaux: "Bonus clue for doubles not yet reunited.",
  image_complete: "The hidden picture will be fully revealed.",
};

export function texte(e: Element, l: string): Notification | null {
  const en = l === "en";
  if (e.k === "test") return { titre: "Déjà vu !", texte: en ? "Notifications are on. See you on the dance floor." : "Notifications activées. On se retrouve sur la piste.", tag: "test" };
  if (e.k === "annonce") {
    if (e.cle === "h30") return { titre: en ? "⏳ Reveal in 30 minutes" : "⏳ Révélation dans 30 minutes", texte: en ? "Last chance to push the quest!" : "Dernière chance de faire grimper la quête !", tag: "annonce" };
    return { titre: en ? "✦ The reveal is here" : "✦ La révélation est là", texte: en ? `Discover tonight's constellation. Game ends at ${heureLisible(e.fin, l)}.` : `Découvre la constellation de la soirée. Fin du jeu à ${heureLisible(e.fin, l)}.`, tag: "annonce" };
  }
  const d = e.donnees;
  if (e.k === "evt") {
    if (e.type === "message") return { titre: en ? "📣 Message from the GM" : "📣 Message du MJ", texte: String(d.texte || ""), tag: "message" };
    if (e.type === "palier") return { titre: en ? `Milestone ${d.n} reached!` : `Palier ${d.n} atteint !`, texte: (en ? EFFETS_EN : EFFETS_FR)[String(d.effet)] || "", tag: "palier" };
    return null;
  }
  switch (e.type) {
    case "jumeau": return d.taille === 3
      ? { titre: en ? "🪞 You're one of triplets" : "🪞 Vous êtes triplés", texte: en ? "Two people here look strangely like you. Clues are in the app." : "Deux personnes ici te ressemblent étrangement. Les indices sont dans l'app.", tag: "jumeau" }
      : { titre: en ? "🪞 You have a double" : "🪞 Tu as un double", texte: en ? "Someone here looks strangely like you. Clues are in the app." : "Quelqu'un ici te ressemble étrangement. Les indices sont dans l'app.", tag: "jumeau" };
    case "chat_noir": return { titre: en ? "🐈‍⬛ You're a black cat" : "🐈‍⬛ Tu es un chat noir", texte: en ? "Tell no one. Infect 3 people in 10 min." : "Ne le dis à personne. Contamine 3 personnes en 10 min.", tag: "chat_noir" };
    case "sanction": return { titre: en ? "⚠️ GM sanction" : "⚠️ Sanction du MJ", texte: en ? "Open the app to see what happens to you." : "Ouvre l'app pour voir ce qui t'arrive.", tag: "sanction" };
    case "sanction_annulee": return { titre: en ? "Sanction lifted" : "Sanction levée", texte: en ? "The GM changed their mind." : "Le MJ a changé d'avis.", tag: "sanction" };
    case "mission": return d.offerte
      ? { titre: en ? "🎁 Private sale" : "🎁 Solde privée", texte: en ? "Your next 5 new cards count double. On the house." : "Tes 5 prochaines nouvelles cartes comptent double. Cadeau de la maison.", tag: "mission" }
      : { titre: en ? "🎯 A mission from the GM" : "🎯 Mission du MJ", texte: en ? "Open the app to see it. The clock is ticking." : "Ouvre l'app pour la découvrir. Le chrono tourne.", tag: "mission" };
    case "mission_reussie": return { titre: en ? "Mission accomplished" : "Mission accomplie", texte: en ? "Badge: Employee of the Month." : "Badge : Employé du mois.", tag: "mission" };
    case "mission_echouee": return { titre: en ? "Time's up" : "Temps écoulé", texte: en ? "The GM isn't mad. Not too mad." : "Le MJ ne t'en veut pas. Pas trop.", tag: "mission" };
    case "mission_annulee": return { titre: en ? "Mission cancelled" : "Mission annulée", texte: en ? "The GM called it off." : "Le MJ l'a annulée.", tag: "mission" };
  }
  return null;
}

// ---------- Tick ----------
async function heures(db: D1Database): Promise<Heures> {
  return { ...HEURES_PAR_DEFAUT, ...((await lireConfig(db, "heures")) as Partial<Heures>) };
}

/** Annonces dues maintenant, chacune une seule fois par heure de révélation. */
async function annoncesDues(db: D1Database, t: number) {
  const h = await heures(db);
  const rev = Date.parse(localVersIso(h.revelation)), fin = Date.parse(localVersIso(h.fin));
  const dues: ("h30" | "revelation")[] = [];
  if (t >= rev - 30 * MIN && t < rev) dues.push("h30");
  if (t >= rev && t < fin) dues.push("revelation");
  const nouvelles: Element[] = [];
  for (const c of dues) {
    const r = await db.prepare("INSERT OR IGNORE INTO compteurs (cle, valeur) VALUES (?, ?)").bind(`push:${c}:${h.revelation}`, t).run();
    if (r.meta.changes) nouvelles.push({ k: "annonce", cle: c, fin: h.fin });
  }
  return nouvelles;
}

/**
 * Prépare et envoie les pushs dus. Au plus une fois par ~minute (Cron Trigger et /api/notifs).
 * Les éléments retenus par RG-016-3 restent en attente et partent au tick suivant permis.
 */
export async function tickPush(env: EnvPush, t: number, o: { force?: boolean } = {}) {
  if (!cleVapid(env)) return { envoyes: 0, raison: "sans_cle" };
  if (!o.force) {
    const r = await env.DB.prepare("SELECT valeur FROM compteurs WHERE cle = 'push:tick'").first<{ valeur: number }>();
    if (r && t >= r.valeur && t - r.valeur < 50_000) return { envoyes: 0, raison: "trop_tot" };
  }
  await env.DB.prepare("INSERT INTO compteurs (cle, valeur) VALUES ('push:tick', ?) ON CONFLICT (cle) DO UPDATE SET valeur = excluded.valeur").bind(t).run();

  const abos = (await env.DB.prepare(
    "SELECT a.endpoint, a.personnage_id AS p, a.dernier_envoi, a.vu_notif, a.vu_evt, pe.langue FROM abonnements_push a JOIN personnages pe ON pe.id = a.personnage_id WHERE a.echecs < ?",
  ).bind(ECHECS_MAX).all<{ endpoint: string; p: string; dernier_envoi: string | null; vu_notif: number; vu_evt: number; langue: string }>()).results;
  if (!abos.length) return { envoyes: 0, raison: "aucun_abonne" };

  const annonces = await annoncesDues(env.DB, t);
  const ph = TYPES_PERSO.map(() => "?").join(",");
  const notifs = (await env.DB.prepare(
    `SELECT n.id, n.personnage_id AS p, n.type, n.donnees FROM notifs n JOIN (SELECT personnage_id, MIN(vu_notif) AS v FROM abonnements_push GROUP BY personnage_id) a ON a.personnage_id = n.personnage_id WHERE n.id > a.v AND n.type IN (${ph}) ORDER BY n.id`,
  ).bind(...TYPES_PERSO).all<{ id: number; p: string; type: string; donnees: string }>()).results;
  const minEvt = Math.min(...abos.map((a) => a.vu_evt));
  const evts = (await env.DB.prepare("SELECT id, type, donnees, fin FROM evenements WHERE id > ? AND type IN ('message', 'palier') ORDER BY id")
    .bind(minEvt).all<{ id: number; type: string; donnees: string; fin: string | null }>()).results;
  const maxEvt = evts.length ? evts[evts.length - 1].id : minEvt;

  const maj: D1PreparedStatement[] = [], cibles: string[] = [];
  const plafond = env.SOI ? Infinity : PAR_LOT; // sans liaison SOI (dev, tests) : un lot par tick, le reste attend
  for (const a of abos) {
    const siennes = notifs.filter((n) => n.p === a.p && n.id > a.vu_notif);
    const elements: Element[] = [
      ...siennes.map((n) => ({ k: "notif" as const, type: n.type, donnees: JSON.parse(n.donnees) })),
      ...evts.filter((e) => e.id > a.vu_evt && TYPES_EVT.includes(e.type) && !(e.type === "message" && e.fin && Date.parse(e.fin) <= t))
        .map((e) => ({ k: "evt" as const, type: e.type, donnees: JSON.parse(e.donnees) })),
    ];
    if (!elements.length && !annonces.length) {
      if (maxEvt > a.vu_evt) maj.push(env.DB.prepare("UPDATE abonnements_push SET vu_evt = ? WHERE endpoint = ?").bind(maxEvt, a.endpoint));
      continue;
    }
    const urgent = annonces.length > 0 || siennes.some((n) => PRIORITAIRES.includes(n.type));
    if (!urgent && a.dernier_envoi && t >= Date.parse(a.dernier_envoi) && t - Date.parse(a.dernier_envoi) < INTERVALLE_MIN * MIN) continue;
    if (cibles.length >= plafond) continue;
    // Un seul par tag (le dernier remplace les précédents) ; annonces en tête, puis les plus récents
    const parTag = new Map<string, Notification>();
    for (const e of [...elements, ...annonces]) {
      const n = texte(e, a.langue);
      if (n && n.texte) { parTag.delete(n.tag); parTag.set(n.tag, n); }
    }
    const contenu = [...parTag.values()].reverse().slice(0, 3);
    const vuNotif = siennes.length ? siennes[siennes.length - 1].id : a.vu_notif;
    maj.push(env.DB.prepare("UPDATE abonnements_push SET contenu = ?, dernier_envoi = ?, vu_notif = ?, vu_evt = ? WHERE endpoint = ?")
      .bind(JSON.stringify(contenu), iso(t), vuNotif, Math.max(a.vu_evt, maxEvt), a.endpoint));
    if (contenu.length) cibles.push(a.endpoint);
  }
  if (maj.length) await env.DB.batch(maj);
  const r = cibles.length ? await distribuer(env, cibles) : { ok: 0, morts: 0, rates: 0 };
  return { envoyes: r.ok, morts: r.morts, rates: r.rates, annonces: annonces.length };
}

/** Abonne un appareil ; sur un changement de personnage, on repart des notifications actuelles. */
export async function abonner(env: EnvPush, id: string, endpoint: string, t: number): Promise<boolean> {
  const avant = await env.DB.prepare("SELECT personnage_id AS p FROM abonnements_push WHERE endpoint = ?").bind(endpoint).first<{ p: string }>();
  await env.DB.prepare(
    `INSERT INTO abonnements_push (endpoint, personnage_id, cree_le, vu_notif, vu_evt)
     VALUES (?1, ?2, ?3, (SELECT COALESCE(MAX(id), 0) FROM notifs WHERE personnage_id = ?2), (SELECT COALESCE(MAX(id), 0) FROM evenements))
     ON CONFLICT (endpoint) DO UPDATE SET echecs = 0,
       vu_notif = CASE WHEN personnage_id = excluded.personnage_id THEN vu_notif ELSE excluded.vu_notif END,
       personnage_id = excluded.personnage_id`,
  ).bind(endpoint, id, iso(t)).run();
  // Au plus 5 appareils par personnage : les plus anciens partent
  await env.DB.prepare(
    "DELETE FROM abonnements_push WHERE personnage_id = ?1 AND endpoint NOT IN (SELECT endpoint FROM abonnements_push WHERE personnage_id = ?1 ORDER BY cree_le DESC LIMIT ?2)",
  ).bind(id, ABONNEMENTS_PAR_PERSO).run();
  return avant?.p !== id;
}

/** Push de bienvenue : vérifie toute la chaîne sur l'appareil qui vient d'accepter. */
export async function pushTest(env: EnvPush, endpoints: string[], langue = "fr") {
  if (!cleVapid(env) || !endpoints.length) return { ok: 0, morts: 0, rates: endpoints.length };
  await env.DB.batch(endpoints.map((e) => env.DB.prepare("UPDATE abonnements_push SET contenu = ? WHERE endpoint = ?").bind(JSON.stringify([texte({ k: "test" }, langue)]), e)));
  return distribuer(env, endpoints);
}

/** Ce que le service worker affiche : le contenu préparé pour cet appareil. */
export async function contenuPour(env: EnvPush, endpoint: string): Promise<Notification[]> {
  const r = await env.DB.prepare("SELECT contenu FROM abonnements_push WHERE endpoint = ?").bind(endpoint).first<{ contenu: string | null }>();
  try { return r?.contenu ? JSON.parse(r.contenu) : []; } catch { return []; }
}

export async function etatPush(env: EnvPush) {
  const r = await env.DB.prepare("SELECT COUNT(*) AS n, COUNT(DISTINCT personnage_id) AS p, SUM(echecs >= ?) AS morts FROM abonnements_push").bind(ECHECS_MAX)
    .first<{ n: number; p: number; morts: number | null }>();
  return { cle: !!cleVapid(env), appareils: r?.n ?? 0, joueurs: r?.p ?? 0, en_echec: r?.morts ?? 0 };
}
