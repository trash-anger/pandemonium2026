// LOT-2 : déjà vu et paliers, faux souvenirs, jauge de mémoire, réactions, idempotence hors ligne, temps d'écran.
import { beforeEach, describe, expect, it } from "vitest";
import { routeApi } from "../src/jeu";
import { fauxSouvenir, type PersoSouvenir } from "../src/souvenirs";
import { d1Memoire } from "./d1-memoire";
import { ALPHABET } from "../src/codes";
import { ATTRIBUTS, COULEURS, TYPES } from "../src/catalogue";

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

describe("faux souvenirs (FEAT-006)", () => {
  it("CA-006-1 : le même souvenir des deux côtés, en français et en anglais, et dans la collection", async () => {
    const a = await joueur(), b = await joueur({ type: "robot", couleur: "bleu", attributs: ["lumieres"] });
    const ab = await scan(a, b.code), ba = await scan(b, a.code);
    expect(ab.type).toBe("nouvelle_carte");
    expect(ab.souvenir.fr).toBe(ba.souvenir.fr);
    expect(ab.souvenir.en).toBe(ba.souvenir.en);
    expect(ab.souvenir.flou).toBe(false);
    const col = await api("/api/collection", undefined, a.jeton);
    expect(col.cartes[0].souvenir.fr).toBe(ab.souvenir.fr);
  });

  const perso = (i: number): PersoSouvenir => ({
    id: crypto.randomUUID(), pseudo: `Joueur ${i}`, type: TYPES[i % TYPES.length], couleur: COULEURS[(i * 7) % COULEURS.length],
    attributs: ATTRIBUTS.filter((_, k) => (i * 13 + k * 5) % 7 === 0),
  });

  it("CA-006-2 : moins de 1 % de textes identiques sur 1 000 paires", () => {
    const vus = new Map<string, number>();
    for (let i = 0; i < 1000; i++) {
      const s = fauxSouvenir(perso(i), perso(i + 5000), "fr");
      vus.set(s, (vus.get(s) ?? 0) + 1);
    }
    const doublons = [...vus.values()].reduce((a, v) => a + v - 1, 0);
    expect(doublons / 1000).toBeLessThan(0.01);
  });

  it("CA-006-3 : aucun gabarit ne garde de variable, même sans attribut", () => {
    for (let i = 0; i < 400; i++) {
      const a = perso(i), b = { ...perso(i + 1), attributs: i % 3 ? perso(i + 1).attributs : [] };
      for (const l of ["fr", "en"] as const) {
        const s = fauxSouvenir(a, b, l);
        expect(s).not.toMatch(/[{}]|undefined|null|\s{2}/);
        expect(s).toMatch(/[.!?»"]$/);
      }
    }
  });
});

describe("déjà vu (FEAT-005)", () => {
  it("CA-005-1 et CA-005-2 : un rescan compte une fois par fenêtre de 5 min, sans ajouter de carte", async () => {
    const a = await joueur(), b = await joueur();
    await scan(a, b.code);
    const r1 = await scan(a, b.code, T0 + 6 * MIN);
    expect(r1).toMatchObject({ type: "deja_vu", n: 2, compte: true });
    const r2 = await scan(a, b.code, T0 + 8 * MIN);
    expect(r2).toMatchObject({ type: "deja_vu", n: 2, compte: false });
    expect((await api("/api/collection", undefined, a.jeton)).cartes).toHaveLength(1);
  });

  it("CA-005-3 : le palier ×3 s'affiche une seule fois", async () => {
    const a = await joueur(), b = await joueur();
    await scan(a, b.code);
    const paliers = [];
    for (let i = 1; i <= 4; i++) paliers.push((await scan(a, b.code, T0 + i * 6 * MIN)).palier);
    expect(paliers).toEqual([null, 3, null, null]);
  });

  it("×13 : le ticket de caisse liste 13 heures de scan", async () => {
    const a = await joueur(), b = await joueur();
    await scan(a, b.code);
    let r: Record<string, any> = {};
    for (let i = 1; i <= 12; i++) r = await scan(a, b.code, T0 + i * 6 * MIN);
    expect(r).toMatchObject({ n: 13, palier: 13 });
    expect(r.heures).toHaveLength(13);
    expect(r.badges).toContain("client_maudit");
  });

  it("CA-005-4 : l'invitation du premier rescan ne vient qu'une fois", async () => {
    const a = await joueur(), b = await joueur(), c = await joueur();
    await scan(a, b.code); await scan(a, c.code);
    expect((await scan(a, b.code, T0 + MIN)).premier_rescan).toBe(true);
    expect((await scan(a, c.code, T0 + 2 * MIN)).premier_rescan).toBe(false);
  });

  it("RG-005-7 : Fermer la boucle en fin de soirée, sur sa toute première personne", async () => {
    const a = await joueur(), b = await joueur(), c = await joueur();
    await scan(a, b.code); await scan(a, c.code, T0 + MIN);
    expect((await scan(a, b.code, H(5))).badges).not.toContain("fermer_boucle"); // minuit : trop tôt
    expect((await scan(a, c.code, H(9, 30))).badges).not.toContain("fermer_boucle"); // pas la première
    expect((await scan(a, b.code, H(9, 30))).badges).toContain("fermer_boucle"); // 4 h 30
  });
});

describe("jauge de souvenirs (barème §3)", () => {
  it("+1 au scanné par rescan compté, rien pour un rescan hors fenêtre", async () => {
    const a = await joueur(), b = await joueur();
    await scan(a, b.code);
    expect(jauge(b)).toBe(10);
    await scan(a, b.code, T0 + 6 * MIN);
    await scan(a, b.code, T0 + 7 * MIN);
    expect(jauge(b)).toBe(11);
  });

  it("Boucle infinie : −1 au-delà de 10 rescans comptés dans l'heure, puis Amnésie à 0 et souvenirs flous", async () => {
    const a = await joueur();
    const autres: J[] = [];
    for (let i = 0; i < 11; i++) { const x = await joueur(); autres.push(x); await scan(a, x.code); }
    for (let i = 0; i < 10; i++) expect((await scan(a, autres[i].code, T0 + (6 + i) * MIN)).perte).toBe(false);
    const r = await scan(a, autres[10].code, T0 + 16 * MIN);
    expect(r).toMatchObject({ perte: true, souvenirs: 9 });
    env.DB.sqlite.prepare("UPDATE personnages SET souvenirs = 1 WHERE id = ?").run(a.id);
    const z = await scan(a, autres[0].code, T0 + 22 * MIN);
    expect(z.souvenirs).toBe(0);
    expect(z.badges).toContain("amnesie");
    expect(z.souvenir.flou).toBe(true);
    expect(z.souvenir.fr).toContain("▒");
  });
});

describe("réactions (FEAT-014)", () => {
  it("CA-014-1 : un toucher enregistre, un second retire ; le porteur ne voit que les totaux", async () => {
    const a = await joueur(), b = await joueur(), c = await joueur();
    await scan(a, b.code); await scan(c, b.code);
    expect((await api("/api/reaction", { cible: b.id, emoji: "🎃" }, a.jeton)).mes_reactions).toEqual(["🎃"]);
    await api("/api/reaction", { cible: b.id, emoji: "🎃" }, a.jeton); // idempotent
    await api("/api/reaction", { cible: b.id, emoji: "🎃" }, c.jeton);
    await api("/api/reaction", { cible: b.id, emoji: "👻" }, c.jeton);
    const moi = await api("/api/moi", undefined, b.jeton);
    expect(moi.reactions).toEqual({ "🎃": 2, "👻": 1 });
    expect(JSON.stringify(moi)).not.toContain(a.id);
    await api("/api/reaction", { cible: b.id, emoji: "🎃", actif: false }, a.jeton);
    expect((await api("/api/moi", undefined, b.jeton)).reactions).toEqual({ "🎃": 1, "👻": 1 });
  });

  it("CA-014-2 : liste fermée d'emoji, et seulement sur une carte de sa collection", async () => {
    const a = await joueur(), b = await joueur(), c = await joueur();
    await scan(a, b.code);
    expect((await api("/api/reaction", { cible: b.id, emoji: "bonjour" }, a.jeton)).status).toBe(400);
    expect((await api("/api/reaction", { cible: c.id, emoji: "🎃" }, a.jeton)).status).toBe(403);
  });
});

describe("hors ligne (FEAT-021)", () => {
  it("CA-021-2 et CA-002-4 : 3 scans en file, renvoyés deux fois, donnent exactement 3 scans", async () => {
    const a = await joueur();
    const cibles = [await joueur(), await joueur(), await joueur()];
    const file = cibles.map((c) => ({ code: c.code, id_client: crypto.randomUUID() }));
    for (const s of file) await scan(a, s.code, T0, s.id_client);
    for (const s of file) expect((await scan(a, s.code, T0 + MIN, s.id_client)).rejoue).toBe(true); // réponse perdue, renvoi
    const nb = env.DB.sqlite.prepare("SELECT COUNT(*) AS n FROM scans WHERE scanneur_id = ? AND resultat = 'nouvelle_carte'").get(a.id) as { n: number };
    expect(nb.n).toBe(3);
    expect((await api("/api/collection", undefined, a.jeton)).cartes).toHaveLength(3);
  });
});

describe("temps d'écran (RG-015-4)", () => {
  it("cumule les envois sans jamais dépasser le temps écoulé depuis la création", async () => {
    const a = await joueur();
    expect((await api("/api/ecran", { secondes: 120 }, a.jeton, T0 + 10 * MIN)).temps_ecran_s).toBe(120);
    expect((await api("/api/ecran", { secondes: 60 }, a.jeton, T0 + 10 * MIN)).temps_ecran_s).toBe(180);
    expect((await api("/api/ecran", { secondes: 5000 }, a.jeton, T0 + 10 * MIN)).temps_ecran_s).toBe(600);
    expect((await api("/api/ecran", { secondes: -40 }, a.jeton, T0 + 10 * MIN)).temps_ecran_s).toBe(600);
  });
});
