// Duel D&D (FEAT-010 §10.3) : consentement des deux joueurs, expiration, jets, enjeu, limite par heure.
import { beforeEach, describe, expect, it } from "vitest";
import { routeApi } from "../src/jeu";
import { d1Memoire } from "./d1-memoire";
import { ALPHABET } from "../src/codes";
import { modificateurs, vainqueur } from "../src/duel";

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
const scan = (qui: J, cible: J, t = T0) => api("/api/scan", { code: cible.code, id_client: crypto.randomUUID(), source: "app" }, qui.jeton, t);
const defier = (a: J, b: J, t = T0) => api("/api/duel/defier", { cible: b.id }, a.jeton, t);
const repondre = (b: J, id: number, accepte: boolean, t = T0) => api("/api/duel/repondre", { id, accepte }, b.jeton, t);
const duel = (qui: J, id: number, t = T0) => api(`/api/duel?id=${id}`, undefined, qui.jeton, t);
const points = (qui: J) => (env.DB.sqlite.prepare("SELECT COALESCE(SUM(points), 0) AS p FROM points_faction WHERE personnage_id = ?").get(qui.id) as { p: number }).p;

beforeEach(() => {
  env = { DB: d1Memoire(), PUBLIC_ORIGIN: ORIGINE, SESSION_SECRET: "secret-de-test", BANC_SESSION: true };
});

describe("duel D&D (FEAT-010 §10.3)", () => {
  it("il faut avoir scanné la personne ; B reçoit le défi", async () => {
    const a = await joueur(), b = await joueur();
    expect((await defier(a, b)).erreur).toBe("pas_scanne");
    await scan(a, b);
    const d = await defier(a, b);
    expect(d.status).toBe(200);
    const n = await api("/api/notifs", undefined, b.jeton);
    expect(n.notifs.find((x: { type: string }) => x.type === "duel").donnees).toMatchObject({ id: d.id });
    expect((await duel(b, d.id)).moi).toBe("b");
  });

  it("CA-010-3 : sans réponse dans les 60 s, aucun jet et aucun enjeu", async () => {
    const a = await joueur(), b = await joueur();
    await scan(a, b);
    const avant = points(a) + points(b);
    const d = await defier(a, b);
    const tard = T0 + 61_000;
    expect((await duel(a, d.id, tard)).etat).toBe("expire");
    expect((await repondre(b, d.id, true, tard)).erreur).toBe("expire");
    expect((await duel(a, d.id, tard)).resultat).toBeNull();
    expect(points(a) + points(b)).toBe(avant);
  });

  it("CA-010-4 : seul le défié peut accepter ; jets tirés une seule fois ; le gagnant gagne 10 points", async () => {
    const a = await joueur(), b = await joueur();
    await scan(a, b);
    const avant = { a: points(a), b: points(b) };
    const d = await defier(a, b);
    expect((await repondre(a, d.id, true)).status).toBe(404);
    expect((await repondre(b, d.id, true, T0 + 5000)).ok).toBe(true);
    expect((await repondre(b, d.id, true, T0 + 6000)).erreur).toBe("deja_repondu");
    const r = (await duel(a, d.id, T0 + 7000)).resultat;
    for (const j of [r.a, r.b]) {
      expect(j.de).toBeGreaterThanOrEqual(1); expect(j.de).toBeLessThanOrEqual(20);
      expect(j.total).toBe(j.de + j.classe + j.costume);
    }
    const v = vainqueur(r.a, r.b);
    expect(r.gagnant).toBe(v === "a" ? a.id : v === "b" ? b.id : null);
    expect(points(a) - avant.a + points(b) - avant.b).toBe(r.gagnant ? 10 : 0);
    if (r.gagnant) expect(r.gagnant === a.id ? points(a) - avant.a : points(b) - avant.b).toBe(10);
  });

  it("refus : A est prévenu et attend 5 min ; RG-010-10 : un duel par heure entre deux personnes, dans les deux sens", async () => {
    const a = await joueur(), b = await joueur();
    await scan(a, b); await scan(b, a);
    const d1 = await defier(a, b);
    expect((await defier(a, b)).erreur).toBe("deja_en_cours");
    await repondre(b, d1.id, false, T0 + 1000);
    expect((await duel(a, d1.id, T0 + 2000)).etat).toBe("refuse");
    expect((await api("/api/notifs", undefined, a.jeton)).notifs.some((x: { type: string }) => x.type === "duel_refuse")).toBe(true);
    expect((await defier(a, b, T0 + 60_000)).erreur).toBe("refus_recent");
    const d2 = await defier(a, b, T0 + 6 * MIN);
    await repondre(b, d2.id, true, T0 + 6 * MIN + 1000);
    expect((await defier(b, a, T0 + 30 * MIN)).erreur).toBe("trop_tot");
    expect((await defier(b, a, T0 + 67 * MIN)).status).toBe(200);
  });

  it("une personne déjà défiée est occupée ; pas de duel avec soi-même", async () => {
    const a = await joueur(), b = await joueur(), c = await joueur();
    await scan(a, c); await scan(b, c);
    await defier(a, c);
    expect((await defier(b, c)).erreur).toBe("occupe");
    expect((await api("/api/duel/defier", { cible: a.id }, a.jeton)).erreur).toBe("cible");
  });

  it("RG-010-7 : bonus de classe dans sa spécialité, costume plafonné à +3, 20 naturel", () => {
    expect(modificateurs({ classe: "barde", attributs: ["paillettes", "couronne", "plumes"] }, "charisme")).toEqual({ classe: 3, costume: 3 });
    expect(modificateurs({ classe: "barde", attributs: ["paillettes"] }, "force")).toEqual({ classe: 0, costume: 0 });
    expect(vainqueur({ de: 20, classe: 0, costume: 0, total: 20 }, { de: 18, classe: 3, costume: 3, total: 24 })).toBe("a");
    expect(vainqueur({ de: 20, classe: 0, costume: 0, total: 20 }, { de: 20, classe: 1, costume: 0, total: 21 })).toBe("b");
    expect(vainqueur({ de: 10, classe: 0, costume: 0, total: 10 }, { de: 10, classe: 0, costume: 0, total: 10 })).toBeNull();
  });
});
