// Accès au panneau du MJ par Google OAuth (REQ-011, DEC-047).
// Session : cookie signé HMAC-SHA256, valable 12 h.

export interface EnvAuth {
  PUBLIC_ORIGIN: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  SESSION_SECRET?: string;
  ADMIN_EMAILS?: string;
  /** Adresses en lecture seule (consultation du panneau, aucune modification ni export) */
  LECTEURS_EMAILS?: string;
  /** Développement local seulement : ignoré si PUBLIC_ORIGIN n'est pas http://localhost… */
  DEV_ADMIN_EMAIL?: string;
  /** Développement local : « lecteur » pour tester la lecture seule */
  DEV_ADMIN_ROLE?: string;
}

const COOKIE_SESSION = "dv_mj";
const COOKIE_ETAT = "dv_etat";
const DUREE_SESSION_S = 12 * 3600;

const enc = new TextEncoder();
const b64url = (b: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const deb64url = (s: string) => atob(s.replace(/-/g, "+").replace(/_/g, "/"));

async function cle(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signer(secret: string, donnees: object): Promise<string> {
  const corps = b64url(enc.encode(JSON.stringify(donnees)));
  const sig = await crypto.subtle.sign("HMAC", await cle(secret), enc.encode(corps));
  return `${corps}.${b64url(sig)}`;
}

export async function verifier<T>(secret: string, jeton: string): Promise<T | null> {
  const [corps, sig] = jeton.split(".");
  if (!corps || !sig) return null;
  let octetsSig: Uint8Array;
  try {
    octetsSig = Uint8Array.from(deb64url(sig), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
  const ok = await crypto.subtle.verify("HMAC", await cle(secret), octetsSig, enc.encode(corps));
  if (!ok) return null;
  try {
    // Décodage UTF-8 : le contenu peut contenir des accents (pseudos)
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(deb64url(corps), (c) => c.charCodeAt(0)))) as T;
  } catch {
    return null;
  }
}

export function lireCookie(req: Request, nom: string): string | null {
  const m = (req.headers.get("Cookie") || "").match(new RegExp(`(?:^|;\\s*)${nom}=([^;]+)`));
  return m ? m[1] : null;
}

function cookie(nom: string, valeur: string, maxAge: number, env: EnvAuth) {
  const secure = env.PUBLIC_ORIGIN.startsWith("https://") ? "; Secure" : "";
  return `${nom}=${valeur}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function enDev(env: EnvAuth) {
  return env.PUBLIC_ORIGIN.startsWith("http://localhost") && !!env.DEV_ADMIN_EMAIL;
}

export type RoleAdmin = "mj" | "lecteur";
export interface Utilisateur { email: string; role: RoleAdmin }

const liste = (v?: string) => (v || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

/** Rôle d'une adresse : « mj » (tous les droits), « lecteur » (consultation) ou null. */
export function roleDe(env: EnvAuth, email: string): RoleAdmin | null {
  if (liste(env.ADMIN_EMAILS).includes(email)) return "mj";
  if (liste(env.LECTEURS_EMAILS).includes(email)) return "lecteur";
  return null;
}

/** Renvoie l'utilisateur connecté au panneau et son rôle, ou null. Le rôle est relu à chaque requête. */
export async function utilisateurConnecte(req: Request, env: EnvAuth): Promise<Utilisateur | null> {
  if (enDev(env)) return { email: env.DEV_ADMIN_EMAIL!, role: env.DEV_ADMIN_ROLE === "lecteur" ? "lecteur" : "mj" };
  if (!env.SESSION_SECRET) return null;
  const jeton = lireCookie(req, COOKIE_SESSION);
  if (!jeton) return null;
  const s = await verifier<{ email: string; exp: number }>(env.SESSION_SECRET, jeton);
  if (!s || s.exp < Date.now() / 1000) return null;
  const role = roleDe(env, s.email);
  return role ? { email: s.email, role } : null;
}

export function debutConnexion(env: EnvAuth): Response {
  if (enDev(env)) return Response.redirect(`${env.PUBLIC_ORIGIN}/admin`, 302);
  if (!env.GOOGLE_CLIENT_ID) return new Response("OAuth non configuré", { status: 500 });
  const etat = b64url(crypto.getRandomValues(new Uint8Array(16)));
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${env.PUBLIC_ORIGIN}/auth/retour`,
    response_type: "code",
    scope: "openid email",
    state: etat,
    prompt: "select_account",
  }).toString();
  return new Response(null, {
    status: 302,
    headers: { Location: url.toString(), "Set-Cookie": cookie(COOKIE_ETAT, etat, 600, env) },
  });
}

export async function retourConnexion(req: Request, env: EnvAuth): Promise<Response> {
  const url = new URL(req.url);
  const etat = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!etat || !code || etat !== lireCookie(req, COOKIE_ETAT)) return new Response("État OAuth invalide", { status: 400 });
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.SESSION_SECRET) {
    return new Response("OAuth non configuré", { status: 500 });
  }
  const jetons = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${env.PUBLIC_ORIGIN}/auth/retour`,
      grant_type: "authorization_code",
    }),
  });
  if (!jetons.ok) return new Response("Échec de l'échange OAuth", { status: 502 });
  const { access_token } = (await jetons.json()) as { access_token: string };
  const info = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!info.ok) return new Response("Échec de lecture du profil", { status: 502 });
  const { email, email_verified } = (await info.json()) as { email?: string; email_verified?: boolean };
  const courriel = (email || "").toLowerCase();
  if (!email_verified || !roleDe(env, courriel)) {
    return new Response("Accès réservé au maître du jeu.", { status: 403 });
  }
  const session = await signer(env.SESSION_SECRET, { email: courriel, exp: Math.floor(Date.now() / 1000) + DUREE_SESSION_S });
  const h = new Headers({ Location: "/admin" });
  h.append("Set-Cookie", cookie(COOKIE_SESSION, session, DUREE_SESSION_S, env));
  h.append("Set-Cookie", cookie(COOKIE_ETAT, "", 0, env));
  return new Response(null, { status: 302, headers: h });
}

export function deconnexion(env: EnvAuth): Response {
  return new Response(null, { status: 302, headers: { Location: "/", "Set-Cookie": cookie(COOKIE_SESSION, "", 0, env) } });
}
