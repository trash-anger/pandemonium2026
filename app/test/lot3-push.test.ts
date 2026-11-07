// LOT-3 D : notifications Web Push (FEAT-016, CT-008).
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { routeApi } from "../src/jeu";
import { clePublique, endpointValide, tickPush } from "../src/push";
import { d1Memoire } from "./d1-memoire";
import { ALPHABET } from "../src/codes";

const ORIGINE = "http://localhost:8787";
const H = (h: number, m = 0) => Date.UTC(2026, 10, 8, h, m); // heure UTC ; Montréal = UTC − 5
const T0 = H(2, 30); // 21 h 30
const MIN = 60_000;
let JWK = "";
beforeAll(async () => {
  const k = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  JWK = JSON.stringify(await crypto.subtle.exportKey("jwk", k.privateKey));
});

let env: { DB: ReturnType<typeof d1Memoire>; PUBLIC_ORIGIN: string; SESSION_SECRET: string; BANC_SESSION: boolean; VAPID_JWK?: string; SOI?: unknown };
let n = 0;
let envois: { url: string; headers: Headers }[] = [];
let statut = 201;

async function api(chemin: string, corps?: object, jeton?: string, t = T0): Promise<Record<string, any>> {
  const req = new Request(ORIGINE + chemin, {
    method: corps ? "POST" : "GET",
    headers: { "Content-Type": "application/json", "X-Dev-Maintenant": String(t), ...(jeton ? { "X-Appareil": jeton } : {}) },
    body: corps ? JSON.stringify(corps) : undefined,
  });
  const r = await routeApi(req, env as never, new URL(req.url));
  return { status: r.status, ...((await r.json()) as Record<string, any>) };
}
function etiquette() {
  let x = ++n, code = "";
  for (let i = 0; i < 4; i++) { code = ALPHABET[x % 31] + code; x = Math.floor(x / 31); }
  env.DB.sqlite.prepare("INSERT INTO etiquettes (code, format, role, lot) VALUES (?, 'petit', 'normale', 1)").run(code);
  return code;
}
async function joueur(langue = "fr") {
  const c = { type: "nuit", couleur: "rouge", attributs: ["cape", "crocs"] };
  const ti = await api("/api/tirage", { code: etiquette(), ...c, langue });
  const r = await api("/api/creer", { jeton: ti.jeton, ...c, pin: "1234", langue });
  return { jeton: r.jeton as string, id: r.personnage.id as string };
}
const fcm = (i: number | string) => `https://fcm.googleapis.com/fcm/send/abonnement-${i}`;
const notif = (id: string, type: string, donnees: object = {}, t = T0) =>
  env.DB.sqlite.prepare("INSERT INTO notifs (personnage_id, type, donnees, le) VALUES (?, ?, ?, ?)").run(id, type, JSON.stringify(donnees), new Date(t).toISOString());
const contenu = async (endpoint: string) => (await api("/api/push/contenu", { endpoint })).notifications as { titre: string; texte: string; tag: string }[];
const abonnes = () => (env.DB.sqlite.prepare("SELECT COUNT(*) AS n FROM abonnements_push").get() as { n: number }).n;

beforeEach(() => {
  env = { DB: d1Memoire(), PUBLIC_ORIGIN: ORIGINE, SESSION_SECRET: "secret-de-test", BANC_SESSION: true, VAPID_JWK: JWK };
  envois = []; statut = 201;
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    envois.push({ url, headers: new Headers(init.headers) });
    return new Response(null, { status: statut });
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("VAPID et abonnements", () => {
  it("n'accepte que les services de push connus (pas de SSRF)", () => {
    expect(endpointValide(fcm(1))).toBe(true);
    expect(endpointValide("https://web.push.apple.com/QGx")).toBe(true);
    expect(endpointValide("https://updates.push.services.mozilla.com/wpush/v2/x")).toBe(true);
    expect(endpointValide("http://fcm.googleapis.com/x")).toBe(false);
    expect(endpointValide("https://fcm.googleapis.com.exemple.com/x")).toBe(false);
    expect(endpointValide("https://169.254.169.254/latest")).toBe(false);
    expect(endpointValide(42)).toBe(false);
  });

  it("publie la clé publique et signe un JWT ES256 vérifiable, sans adresse courriel", async () => {
    const cle = (await api("/api/push/cle")).cle as string;
    expect(cle).toBe(clePublique(env as never));
    const brut = Uint8Array.from(Buffer.from(cle, "base64url"));
    expect(brut.length).toBe(65);
    expect(brut[0]).toBe(4);

    const j = await joueur();
    expect((await api("/api/push/abonner", { endpoint: fcm(1) }, j.jeton)).status).toBe(200);
    const auth = envois[0].headers.get("Authorization")!;
    const [, jwt, k] = /^vapid t=([^,]+), k=(.+)$/.exec(auth)!;
    expect(k).toBe(cle);
    const [h, c, s] = jwt.split(".");
    const pub = await crypto.subtle.importKey("raw", brut, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    expect(await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, pub, Buffer.from(s, "base64url"), new TextEncoder().encode(`${h}.${c}`))).toBe(true);
    const claims = JSON.parse(Buffer.from(c, "base64url").toString());
    expect(claims.aud).toBe("https://fcm.googleapis.com");
    expect(claims.sub).toBe(ORIGINE);
    expect(claims.exp * 1000 - Date.now()).toBeGreaterThan(11 * 60 * MIN);
    expect(envois[0].headers.get("TTL")).toBe("3600");
  });

  it("s'abonner exige un personnage ; le premier abonnement reçoit un push de bienvenue, pas les suivants", async () => {
    expect((await api("/api/push/abonner", { endpoint: fcm(1) })).status).toBe(401);
    expect((await api("/api/push/abonner", { endpoint: "https://exemple.com/x" }, (await joueur()).jeton)).status).toBe(400);
    const j = await joueur();
    const r = await api("/api/push/abonner", { endpoint: fcm(1) }, j.jeton);
    expect(r.test.ok).toBe(1);
    expect((await contenu(fcm(1)))[0].texte).toMatch(/Notifications activées/);
    await api("/api/push/abonner", { endpoint: fcm(1) }, j.jeton);
    expect(envois).toHaveLength(1);
  });

  it("renouvelle et désabonne avec l'adresse comme clé ; 410 supprime l'abonnement", async () => {
    const j = await joueur();
    await api("/api/push/abonner", { endpoint: fcm(1) }, j.jeton);
    await api("/api/push/renouveler", { ancien: fcm(1), endpoint: fcm(2) });
    expect(env.DB.sqlite.prepare("SELECT endpoint FROM abonnements_push").get()).toEqual({ endpoint: fcm(2) });
    await api("/api/push/desabonner", { endpoint: fcm(2) });
    expect(abonnes()).toBe(0);

    await api("/api/push/abonner", { endpoint: fcm(3) }, j.jeton);
    statut = 410;
    notif(j.id, "jumeau", { taille: 2 });
    await tickPush(env as never, T0 + MIN, { force: true });
    expect(abonnes()).toBe(0);
  });

  it("sans clé VAPID, rien ne part", async () => {
    env.VAPID_JWK = undefined;
    expect((await api("/api/push/cle")).cle).toBeNull();
    expect((await tickPush(env as never, T0)).raison).toBe("sans_cle");
  });
});

describe("Tick des notifications", () => {
  it("pousse les notifications personnelles, au plus une toutes les 10 min sauf jumeau et chat noir (RG-016-3)", async () => {
    const j = await joueur();
    await api("/api/push/abonner", { endpoint: fcm(1) }, j.jeton);
    envois = [];
    notif(j.id, "mission", { code: "M-1" });
    notif(j.id, "corrompu", {}); // pas poussé : se vit face à face
    let r = await tickPush(env as never, T0 + MIN);
    expect(r.envoyes).toBe(1);
    expect((await contenu(fcm(1))).map((x) => x.titre)).toEqual(["🎯 Mission du MJ"]);

    notif(j.id, "mission_echouee", {});
    r = await tickPush(env as never, T0 + 3 * MIN);
    expect(r.envoyes).toBe(0); // retenue : moins de 10 min
    notif(j.id, "chat_noir", {});
    r = await tickPush(env as never, T0 + 4 * MIN);
    expect(r.envoyes).toBe(1); // urgente : part tout de suite, avec celle qui attendait
    expect((await contenu(fcm(1))).map((x) => x.tag).sort()).toEqual(["chat_noir", "mission"]);

    r = await tickPush(env as never, T0 + 5 * MIN);
    expect(r.envoyes).toBe(0); // rien de nouveau
  });

  it("messages du MJ et paliers à tous les abonnés, dans leur langue ; un message expiré ne part pas", async () => {
    const a = await joueur("fr"), b = await joueur("en");
    await api("/api/push/abonner", { endpoint: fcm("a") }, a.jeton);
    await api("/api/push/abonner", { endpoint: fcm("b") }, b.jeton);
    const evt = (type: string, donnees: object, fin: number | null) =>
      env.DB.sqlite.prepare("INSERT INTO evenements (type, donnees, debut, fin) VALUES (?, ?, ?, ?)").run(type, JSON.stringify(donnees), new Date(T0).toISOString(), fin ? new Date(fin).toISOString() : null);
    evt("message", { texte: "Vieux message" }, T0 + MIN);
    evt("message", { texte: "Rendez-vous au bar" }, T0 + 15 * MIN);
    evt("palier", { n: 1, effet: "solde" }, null);
    expect((await tickPush(env as never, T0 + 2 * MIN)).envoyes).toBe(2);
    const fr = await contenu(fcm("a")), en = await contenu(fcm("b"));
    expect(fr.map((x) => x.texte)).toEqual([expect.stringMatching(/Soldes éclair/), "Rendez-vous au bar"]);
    expect(en[0].titre).toBe("Milestone 1 reached!");
    expect(en.map((x) => x.texte)).not.toContain("Vieux message");
  });

  it("annonce H−30 puis révélation, une seule fois chacune, malgré la limite des 10 min", async () => {
    const j = await joueur();
    await api("/api/push/abonner", { endpoint: fcm(1) }, j.jeton);
    envois = [];
    expect((await tickPush(env as never, H(9, 29))).envoyes).toBe(0);
    expect((await tickPush(env as never, H(9, 31))).envoyes).toBe(1);
    expect((await contenu(fcm(1)))[0].titre).toBe("⏳ Révélation dans 30 minutes");
    expect((await tickPush(env as never, H(9, 33))).envoyes).toBe(0);
    expect((await tickPush(env as never, H(10, 0, ))).envoyes).toBe(1);
    expect((await contenu(fcm(1)))[0].texte).toBe("Découvre la constellation de la soirée. Fin du jeu à 6 h.");
    expect((await tickPush(env as never, H(10, 2))).envoyes).toBe(0);
  });

  it("sans liaison SOI, 40 envois par tick ; avec SOI, les lots suivants passent par le Worker lui-même", async () => {
    for (let i = 0; i < 45; i++) {
      const j = await joueur();
      await api("/api/push/abonner", { endpoint: fcm(i) }, j.jeton);
      notif(j.id, "jumeau", { taille: 2 });
    }
    envois = [];
    expect((await tickPush(env as never, T0 + MIN)).envoyes).toBe(40);
    expect((await tickPush(env as never, T0 + 2 * MIN)).envoyes).toBe(5);

    const lots: string[][] = [];
    env.SOI = { fetch: async (_u: string, init: RequestInit) => {
      expect(new Headers(init.headers).get("X-Push-Interne")).toBeTruthy();
      const { endpoints } = JSON.parse(String(init.body));
      lots.push(endpoints);
      return Response.json({ ok: endpoints.length, morts: 0, rates: 0 });
    } };
    env.DB.sqlite.prepare("INSERT INTO evenements (type, donnees, debut) VALUES ('palier', '{\"n\":2,\"effet\":\"glitch\"}', ?)").run(new Date(T0).toISOString());
    const r = await tickPush(env as never, T0 + 20 * MIN);
    expect(r.envoyes).toBe(45);
    expect(lots.map((l) => l.length)).toEqual([5]);
  });
});
