// LOT-3 (étape A) : quête collective, paliers, soldes éclair, points de faction, état du direct.
import { beforeEach, describe, expect, it } from "vitest";
import { routeApi } from "../src/jeu";
import { isoVersLocal } from "../src/direct";
import { construireInstantane, imageParDefaut, SANS_BORNE, validerImage } from "../src/revelation";
import { d1Memoire } from "./d1-memoire";
import { ALPHABET } from "../src/codes";

const ORIGINE = "http://localhost:8787";
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
function etiquette(role = "normale") {
  let x = ++n, code = "";
  for (let i = 0; i < 4; i++) { code = ALPHABET[x % 31] + code; x = Math.floor(x / 31); }
  env.DB.sqlite.prepare("INSERT INTO etiquettes (code, format, role, lot) VALUES (?, 'petit', ?, 1)").run(code, role);
  return code;
}
const COSTUME = { type: "nuit", couleur: "rouge", attributs: ["cape"] };
async function joueur(faction?: string, role = "normale") {
  const code = etiquette(role);
  const ti = await api("/api/tirage", { code, ...COSTUME, langue: "fr" });
  const r = await api("/api/creer", { jeton: ti.jeton, ...COSTUME, pin: "1234", langue: "fr" });
  if (faction) env.DB.sqlite.prepare("UPDATE etiquettes SET faction_id = ? WHERE code = ?").run(faction, code);
  return { jeton: r.jeton as string, code, id: r.personnage.id as string };
}
type J = Awaited<ReturnType<typeof joueur>>;
const scan = (qui: J, code: string, t = T0) => api("/api/scan", { code, id_client: crypto.randomUUID(), source: "app" }, qui.jeton, t);
const direct = (t = T0) => api("/api/direct", undefined, undefined, t);
const points = (f: string) => (env.DB.sqlite.prepare("SELECT valeur FROM compteurs WHERE cle = ?").get("faction:" + f) as { valeur: number } | undefined)?.valeur ?? 0;
const parametres = (p: object) => env.DB.sqlite.prepare("INSERT OR REPLACE INTO config (cle, valeur) VALUES ('parametres', ?)").run(JSON.stringify(p));

beforeEach(() => {
  env = { DB: d1Memoire(), PUBLIC_ORIGIN: ORIGINE, SESSION_SECRET: "secret-de-test", BANC_SESSION: true };
});

describe("quête collective (FEAT-009, barème §1)", () => {
  it("une nouvelle carte vaut 1, un rescan compté 0,25 (préréglage Rapide), un rescan trop tôt 0", async () => {
    const a = await joueur("ordre"), b = await joueur("chaos");
    expect((await scan(a, b.code)).quete_total).toBe(1);
    expect((await scan(a, b.code, T0 + MIN)).quete_total).toBeNull();
    expect((await scan(a, b.code, T0 + 6 * MIN)).quete_total).toBe(1.25);
    expect((await direct()).quete).toMatchObject({ total: 1.25, franchis: 0, prochain: 500, prereglage: "rapide" });
  });

  it("CA-011-3 : ×1,25 avec deux factions, ×0,5 en surconsommation", async () => {
    const a = await joueur("ordre"), b = await joueur("chaos"), c = await joueur("friperie");
    env.DB.sqlite.prepare("INSERT INTO etiquettes (code, format, role, lot, etat, personnage_id, faction_id) VALUES ('ZZZZ', 'petit', 'normale', 1, 'reclamee', ?, 'necro')").run(a.id);
    expect((await scan(a, b.code)).quete_total).toBe(1.25);
    env.DB.sqlite.prepare("UPDATE personnages SET surconsommation = 1 WHERE id = ?").run(a.id);
    expect((await scan(a, c.code)).quete_total).toBe(1.25 + 0.625);
  });

  it("le MJ ne fait pas avancer la quête quand il scanne", async () => {
    const mj = await joueur("ordre", "personnelle_mj"), b = await joueur("chaos");
    expect((await scan(mj, b.code)).quete_total).toBeNull();
    expect((await direct()).quete.total).toBe(0);
  });

  it("CA-009-2 : un palier n'est franchi qu'une fois ; P-1 ouvre une solde éclair qui double les nouvelles cartes", async () => {
    parametres({ bareme: { paliers: [2, 4, 100, 200, 300] } });
    const a = await joueur("ordre"), b = await joueur("chaos"), c = await joueur("chaos"), d = await joueur("chaos"), e = await joueur("chaos");
    await scan(a, b.code);
    await scan(a, c.code); // total 2 : P-1
    let dir = await direct();
    expect(dir.quete.franchis).toBe(1);
    expect(dir.solde).toBeTruthy();
    expect((await scan(a, d.code, T0 + MIN)).quete_total).toBe(4); // +2 pendant la solde : P-2
    dir = await direct(T0 + MIN);
    expect(dir.evenements.filter((x: any) => x.type === "palier").map((x: any) => x.donnees.n)).toEqual([1, 2]);
    expect(dir.evenements.some((x: any) => x.type === "glitch")).toBe(true);
    expect((await scan(a, e.code, T0 + 10 * MIN)).quete_total).toBe(5); // solde terminée
    expect((await direct(T0 + 10 * MIN)).solde).toBeNull();
  });

  it("le préréglage choisi fixe les seuils et la valeur des rescans", async () => {
    parametres({ prereglage: "tres_rapide" });
    const a = await joueur("ordre"), b = await joueur("chaos");
    await scan(a, b.code);
    expect((await scan(a, b.code, T0 + 6 * MIN)).quete_total).toBeCloseTo(1.1);
    expect((await direct()).quete.prochain).toBe(800);
  });
});

describe("points de faction (barème §2)", () => {
  it("+10 au scanneur, +5 au scanné, +5 de bonus inter-faction, +2 par rescan compté", async () => {
    const a = await joueur("ordre"), b = await joueur("chaos"), c = await joueur("ordre");
    await scan(a, b.code); // ordre +10 +5 (inter-faction), chaos +5
    expect([points("ordre"), points("chaos")]).toEqual([15, 5]);
    await scan(a, c.code); // même faction : pas de bonus ; ordre +10 (a) +5 (c)
    expect(points("ordre")).toBe(30);
    await scan(a, b.code, T0 + 6 * MIN); // rescan : +2
    expect(points("ordre")).toBe(32);
    const f = (await direct()).factions;
    expect(f.ordre).toMatchObject({ points: 32, membres: 2, moyenne: 16 });
  });
});

describe("heures du MJ", () => {
  it("convertit l'heure courante en heure de Montréal", () => {
    expect(isoVersLocal(Date.UTC(2026, 10, 8, 9, 7))).toBe("2026-11-08T04:07");
  });
});

describe("révélation de 5 h (FEAT-009, LOT-3 étape B)", () => {
  const REV = H(10); // 5 h à Montréal
  const revelation = (t = REV + MIN) => api("/api/revelation", undefined, undefined, t);

  it("CA-009-3 : refusée avant l'heure, puis servie à tous", async () => {
    const r = await revelation(REV - MIN);
    expect(r).toMatchObject({ status: 403, erreur: "pas_encore" });
    expect((await revelation()).status).toBe(200);
  });

  it("RG-009-5 : une connexion par paire, quel que soit le sens ; instantané figé à l'heure de la révélation", async () => {
    const a = await joueur("ordre"), b = await joueur("chaos"), c = await joueur("chaos");
    await scan(a, b.code);
    await scan(b, a.code); // même paire
    await scan(a, c.code);
    const d = await revelation();
    expect(d.noeuds).toHaveLength(3);
    expect(d.liens).toHaveLength(2);
    expect(d.revelation).toBe(new Date(REV).toISOString());
    expect(d.franchis).toBe(0);
    expect(d.part).toBe(0.1);
    expect(d.image.p.length).toBeGreaterThan(100);
    // Un scan après l'heure ne change plus l'instantané
    await scan(b, c.code, REV + 2 * MIN);
    const e = await revelation(REV + 3 * MIN);
    expect(e.liens).toHaveLength(2);
    expect(e.noeuds.map((x: any) => x.id)).toEqual(d.noeuds.map((x: any) => x.id));
  });

  it("RG-011-6 : un joueur multi-factions est rattaché à celle où il a marqué le moins", async () => {
    const a = await joueur("ordre"), b = await joueur("chaos"), c = await joueur("ordre");
    env.DB.sqlite.prepare("INSERT INTO etiquettes (code, format, role, lot, etat, personnage_id, faction_id) VALUES ('ZZZZ', 'petit', 'normale', 1, 'reclamee', ?, 'necro')").run(a.id);
    await scan(a, b.code); // ordre et necro gagnent autant
    env.DB.sqlite.prepare("INSERT INTO points_faction (personnage_id, faction, points, raison, le) VALUES (?, 'ordre', 3, 'test', ?)").run(a.id, new Date(T0).toISOString());
    const d = await revelation();
    const na = d.noeuds.find((x: any) => x.id === a.id);
    expect(na).toMatchObject({ faction: "necro", multi: 1 });
    expect(d.noeuds.find((x: any) => x.id === c.id).faction).toBe("ordre");
  });

  it("les paliers franchis avant l'heure fixent la netteté du dessin", async () => {
    parametres({ bareme: { paliers: [1, 2, 100, 200, 300] } });
    const a = await joueur("ordre"), b = await joueur("chaos"), c = await joueur("chaos");
    await scan(a, b.code);
    await scan(a, c.code);
    const d = await revelation();
    expect(d.franchis).toBe(2);
    expect(d.part).toBe(0.5);
  });

  it("l'aperçu du MJ montre tout l'état présent, même daté plus tard (heure simulée du banc)", async () => {
    const a = await joueur("ordre"), b = await joueur("chaos");
    await scan(a, b.code); // pendant le jeu, mais après l'heure passée ci-dessous
    const tot = await construireInstantane(env as never, new Date(T0 - 60 * MIN).toISOString());
    expect(tot.noeuds).toHaveLength(0);
    const ap = await construireInstantane(env as never, new Date(T0 - 60 * MIN).toISOString(), SANS_BORNE);
    expect([ap.noeuds.length, ap.liens.length]).toEqual([2, 1]);
  });

  it("image cachée : repli « DÉJÀ VU ! » et validation des points envoyés par l'admin", () => {
    const img = imageParDefaut();
    expect(img.h).toBe(57); // deux lignes : « DÉJÀ » et « VU ! »
    expect(img.l).toBeLessThan(img.h * 2);
    expect(img.p.every(([x, y]) => x >= 0 && x < img.l && y >= 0 && y < img.h)).toBe(true);
    expect(validerImage({ nom: "x", l: 10, h: 10, p: Array.from({ length: 30 }, (_, i) => [i % 10, Math.floor(i / 10)]) })).toBeTruthy();
    expect(validerImage({ nom: "x", l: 10, h: 10, p: Array.from({ length: 30 }, () => [10, 0]) })).toBeNull();
    expect(validerImage({ nom: "x", l: 1000, h: 10, p: [] })).toBeNull();
  });
});
