// LOT-6 : comparaison après un scan (FEAT-010, RG-010-1 à 3).
import { beforeEach, describe, expect, it } from "vitest";
import { routeApi } from "../src/jeu";
import { d1Memoire } from "./d1-memoire";
import { ALPHABET } from "../src/codes";
import { arreterEclair, eclairActive, lancerEclair } from "../src/eclair";

const ORIGINE = "http://localhost:8787";
// Heures de Montréal (UTC−5) : 21 h = 02:00 UTC ; révélation 5 h = 10:00 UTC
const H = (h: number, m = 0) => Date.UTC(2026, 10, 8, h, m);
const T0 = H(2, 30);
const MIN = 60_000;

let env: { DB: ReturnType<typeof d1Memoire>; PUBLIC_ORIGIN: string; SESSION_SECRET: string; BANC_SESSION: boolean };
let n = 0;

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

async function joueur(costume = { type: "nuit", couleur: "rouge", attributs: ["cape", "sang"] }, t = T0) {
  const code = etiquette();
  const ti = await api("/api/tirage", { code, ...costume, langue: "fr" }, undefined, t);
  const r = await api("/api/creer", { jeton: ti.jeton, ...costume, photos: false, pin: "1234", langue: "fr" }, undefined, t);
  expect(r.status).toBe(200);
  return { jeton: r.jeton as string, code, id: r.personnage.id as string };
}
type J = Awaited<ReturnType<typeof joueur>>;
const scan = (qui: J, code: string, t = T0, id_client: string = crypto.randomUUID()) => api("/api/scan", { code, id_client, source: "app" }, qui.jeton, t);
const jauge = (qui: J) => (env.DB.sqlite.prepare("SELECT souvenirs AS s FROM personnages WHERE id = ?").get(qui.id) as { s: number }).s;

beforeEach(() => {
  env = { DB: d1Memoire(), PUBLIC_ORIGIN: ORIGINE, SESSION_SECRET: "secret-de-test", BANC_SESSION: true };
});

describe("comparaison (FEAT-010)", () => {
  it("CA-010-1 : stats des deux joueurs et nombre exact de connaissances communes", async () => {
    const [a, b, c, d, e] = [await joueur(), await joueur(), await joueur(), await joueur(), await joueur()];
    for (const x of [c, d]) await scan(a, x.code);
    for (const x of [c, d, e]) await scan(b, x.code);
    await scan(b, c.code, T0 + 10 * MIN); // un déjà vu compté pour B
    const r = await scan(a, b.code, T0 + 20 * MIN);
    expect(r.type).toBe("nouvelle_carte");
    expect(r.comparaison.communs).toBe(2);
    expect(r.comparaison.avatars.map((p: { id: string }) => p.id).sort()).toEqual([c.id, d.id].sort());
    expect(r.comparaison.moi).toEqual({ cartes: 3, deja_vus: 0, badges: expect.any(Number) });
    expect(r.comparaison.autre).toMatchObject({ cartes: 3, deja_vus: 1 });
  });

  it("RG-010-3 : seulement des données publiques ; ni le scanneur ni le scanné dans les communs", async () => {
    const [a, b, c] = [await joueur(), await joueur(), await joueur()];
    await scan(a, c.code); await scan(b, c.code); await scan(b, a.code);
    const r = await scan(a, b.code, T0 + 10 * MIN);
    expect(r.comparaison.communs).toBe(1);
    expect(Object.keys(r.comparaison.avatars[0]).sort()).toEqual(["couleur", "id", "pseudo", "type"]);
  });

  it("aussi sur un déjà vu, et les avatars s'arrêtent à 8", async () => {
    const a = await joueur(), b = await joueur();
    const autres = [];
    for (let i = 0; i < 10; i++) autres.push(await joueur());
    for (const x of autres) { await scan(a, x.code); await scan(b, x.code); }
    await scan(a, b.code);
    const r = await scan(a, b.code, T0 + 30 * MIN);
    expect(r.type).toBe("deja_vu");
    expect(r.comparaison.communs).toBe(10);
    expect(r.comparaison.avatars).toHaveLength(8);
  });
});

describe("missions éclair (FEAT-013)", () => {
  const points = (j: J) => (env.DB.sqlite.prepare("SELECT COALESCE(SUM(points), 0) AS p FROM points_faction WHERE personnage_id = ? AND raison = 'mission_eclair'").get(j.id) as { p: number }).p;
  const notifsEclair = (j: J) => (env.DB.sqlite.prepare("SELECT COUNT(*) AS n FROM notifs WHERE personnage_id = ? AND type = 'eclair_reussie'").get(j.id) as { n: number }).n;

  it("CA-013-1 : E-1 remplie avant l'échéance, récompense versée une seule fois", async () => {
    const a = await joueur(), autres = [await joueur(), await joueur(), await joueur(), await joueur()];
    await scan(a, autres[0].code, T0 - MIN); // avant la mission : ne compte pas
    expect(await lancerEclair(env as never, "E-1", "test", T0)).toBeNull();
    await scan(a, autres[1].code, T0 + MIN); await scan(a, autres[2].code, T0 + MIN);
    expect(points(a)).toBe(0);
    await scan(a, autres[3].code, T0 + 2 * MIN);
    expect(points(a)).toBe(15);
    await scan(a, autres[0].code, T0 + 3 * MIN);
    expect(points(a)).toBe(15);
    expect(notifsEclair(a)).toBe(1);
  });

  it("CA-013-2 : après l'échéance (ou l'arrêt par le MJ), plus aucun progrès", async () => {
    const a = await joueur(), autres = [await joueur(), await joueur(), await joueur()];
    await lancerEclair(env as never, "E-1", "test", T0);
    for (const x of autres) await scan(a, x.code, T0 + 6 * MIN); // E-1 dure 5 min
    expect(points(a)).toBe(0);
    const b = await joueur();
    await lancerEclair(env as never, "E-1", "test", T0 + 10 * MIN);
    expect(await arreterEclair(env.DB as never, T0 + 11 * MIN)).toBe(true);
    for (const x of autres) await scan(b, x.code, T0 + 12 * MIN);
    expect(points(b)).toBe(0);
  });

  it("RG-013-4 : une seule mission à la fois ; E-2 vise un type porté par au moins deux joueurs", async () => {
    const a = await joueur(), b = await joueur({ type: "robot", couleur: "bleu", attributs: ["lumieres"] });
    await joueur({ type: "robot", couleur: "vert", attributs: ["lumieres"] });
    expect(await lancerEclair(env as never, "E-2", "test", T0)).toBeNull();
    expect(await lancerEclair(env as never, "E-1", "test", T0 + MIN)).toMatch(/déjà/);
    const e = await eclairActive(env.DB as never, T0 + MIN);
    expect(e?.donnees.type).toBe("robot");
    await scan(a, b.code, T0 + 2 * MIN);
    expect(points(a)).toBe(15);
  });

  it("E-4 : rescanner sa toute première rencontre ; E-3 : deux attributs portés ensemble", async () => {
    const a = await joueur(), b = await joueur({ type: "robot", couleur: "bleu", attributs: ["lumieres", "cape"] }), c = await joueur();
    await scan(a, b.code, T0 - 30 * MIN); await scan(a, c.code, T0 - 20 * MIN);
    await lancerEclair(env as never, "E-4", "test", T0);
    await scan(a, c.code, T0 + MIN);
    expect(points(a)).toBe(0); // pas sa première rencontre
    await scan(a, b.code, T0 + 2 * MIN);
    expect(points(a)).toBe(20);
    await arreterEclair(env.DB as never, T0 + 3 * MIN);
    env.DB.sqlite.exec("UPDATE personnages SET attributs = '[]' WHERE id <> '" + b.id + "'");
    await lancerEclair(env as never, "E-3", "test", T0 + 4 * MIN);
    expect((await eclairActive(env.DB as never, T0 + 4 * MIN))?.donnees.attributs?.sort()).toEqual(["cape", "lumieres"]);
    await scan(c, b.code, T0 + 5 * MIN);
    expect(points(c)).toBe(20);
  });
});
