// LOT-3 (étape C) : costume du MJ (FEAT-022), pause (ADM-17), sanctions (ADM-18), missions personnelles (ADM-19).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { routeApi } from "../src/jeu";
import { annulerSanction, attribution, confierMission, ouvrirPause, sanctionner, EFFETS_SPECIAUX } from "../src/mj";
import { d1Memoire } from "./d1-memoire";
import { ALPHABET } from "../src/codes";

const ORIGINE = "http://localhost:8787";
const H = (h: number, m = 0) => Date.UTC(2026, 10, 8, h, m);
const T0 = H(2, 30); // 21 h 30 à Montréal
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
const COSTUME = { type: "nuit", couleur: "rouge", attributs: ["cape", "masque"] };
async function joueur(faction = "ordre", t = T0) {
  const code = etiquette();
  const ti = await api("/api/tirage", { code, ...COSTUME, langue: "fr" }, undefined, t);
  const r = await api("/api/creer", { jeton: ti.jeton, ...COSTUME, pin: "1234", langue: "fr" }, undefined, t);
  env.DB.sqlite.prepare("UPDATE etiquettes SET faction_id = ? WHERE code = ?").run(faction, code);
  return { jeton: r.jeton as string, code, id: r.personnage.id as string };
}
type J = Awaited<ReturnType<typeof joueur>>;
const scan = (qui: J, code: string, t = T0) => api("/api/scan", { code, id_client: crypto.randomUUID(), source: "app" }, qui.jeton, t);
/** Étiquette qui porte l'effet à l'instant t. */
async function porteur(effet: string, t = T0) {
  return [...(await attribution(env as never, t)).effets.entries()].find(([, e]) => e === effet)![0];
}
const perso = (id: string) => env.DB.sqlite.prepare("SELECT * FROM personnages WHERE id = ?").get(id) as Record<string, any>;
const points = (f: string) => (env.DB.sqlite.prepare("SELECT valeur FROM compteurs WHERE cle = ?").get("faction:" + f) as { valeur: number } | undefined)?.valeur ?? 0;

beforeEach(() => {
  env = { DB: d1Memoire(), PUBLIC_ORIGIN: ORIGINE, SESSION_SECRET: "secret-de-test", BANC_SESSION: true };
  for (let i = 0; i < 15; i++) etiquette("speciale_mj");
});

describe("mélange des légendaires et des pièges (RG-022-9)", () => {
  it("CA-022-3 : chaque effet est porté par exactement une étiquette, et l'association change toutes les 20 min", async () => {
    const a = await attribution(env as never, T0), b = await attribution(env as never, T0 + 20 * MIN);
    expect([...a.effets.values()].sort()).toEqual([...EFFETS_SPECIAUX].sort());
    expect([...b.effets.values()].sort()).toEqual([...EFFETS_SPECIAUX].sort());
    expect(b.periode).toBe(a.periode + 1);
    expect([...a.effets.entries()]).not.toEqual([...b.effets.entries()]);
    expect((await attribution(env as never, T0 + MIN)).effets).toEqual(a.effets); // stable dans la période
  });
});

describe("légendaires (FEAT-022)", () => {
  it("CA-022-2 : une légendaire ne s'obtient qu'une fois, même portée par une autre étiquette après un mélange", async () => {
    const a = await joueur();
    const r = await scan(a, await porteur("L-3"));
    expect(r).toMatchObject({ type: "legendaire", effet: "L-3", points: 15 });
    expect(r.fin).toBeTruthy();
    expect(points("ordre")).toBe(15);
    const t2 = T0 + 25 * MIN;
    expect(await scan(a, await porteur("L-3", t2), t2)).toMatchObject({ type: "legendaire", effet: "L-3", deja: true });
    expect(points("ordre")).toBe(15);
  });

  it("CA-022-4 : le Dernier exemplaire va au premier ; les suivants trouvent une rupture jusqu'à la remise en rayon de minuit", async () => {
    const a = await joueur(), b = await joueur();
    expect(await scan(a, await porteur("L-7"))).toMatchObject({ type: "legendaire", effet: "L-7" });
    const r = await scan(b, await porteur("L-7"));
    expect(r).toMatchObject({ rupture: true });
    expect(r.prochaine).toBe(new Date(H(5)).toISOString()); // minuit à Montréal
    const minuit = H(5, 1);
    expect(await scan(b, await porteur("L-7", minuit), minuit)).toMatchObject({ type: "legendaire", effet: "L-7" });
    expect((await scan(a, await porteur("L-7", minuit), minuit)).deja).toBe(true);
  });

  it("L-5 : badge Anticapitaliste et 3 nouvelles cartes à ×2 pour la quête", async () => {
    const a = await joueur(), [b, c, d, e] = [await joueur("chaos"), await joueur("chaos"), await joueur("chaos"), await joueur("chaos")];
    expect((await scan(a, await porteur("L-5"))).badges).toContain("anticapitaliste");
    const totaux = [];
    for (const x of [b, c, d, e]) totaux.push((await scan(a, x.code)).quete_total);
    expect(totaux).toEqual([2, 4, 6, 7]);
  });

  it("L-6 : pendant 10 min, chaque rescan compte, sans le délai de 5 min", async () => {
    const a = await joueur(), b = await joueur("chaos");
    await scan(a, await porteur("L-6"));
    await scan(a, b.code);
    expect(await scan(a, b.code, T0 + MIN)).toMatchObject({ type: "deja_vu", compte: true, n: 2 });
    expect((await scan(a, b.code, T0 + 11 * MIN)).compte).toBe(true); // délai normal écoulé de toute façon
    expect((await scan(a, b.code, T0 + 12 * MIN)).compte).toBe(false); // L-6 terminé
  });

  it("L-8 donne 3 souvenirs ; L-9 un long souvenir avec le MJ ; L-10 met la carte en vitrine", async () => {
    const a = await joueur();
    await scan(a, await porteur("L-8"));
    expect(perso(a.id).souvenirs).toBe(13);
    const r = await scan(a, await porteur("L-9"));
    expect(r.souvenir.fr.split("\n\n")).toHaveLength(6);
    await scan(a, await porteur("L-10"));
    const d = await api("/api/direct");
    expect(d.evenements.find((e: any) => e.type === "vitrine").donnees.pseudo).toBe(perso(a.id).pseudo);
  });

  it("la collection liste les légendes ; les 10 donnent la Garde-robe du MJ", async () => {
    const a = await joueur();
    let derniere: Record<string, any> = {};
    for (const [i, e] of ["L-1", "L-2", "L-3", "L-4", "L-5", "L-6", "L-7", "L-8", "L-9", "L-10"].entries()) derniere = await scan(a, await porteur(e), T0 + i * 1000);
    expect(derniere.badges).toContain("garde_robe_mj");
    const c = await api("/api/collection", undefined, a.jeton);
    expect(c.legendes).toHaveLength(10);
    expect(c.legendes.find((x: any) => x.effet === "L-9").souvenir.fr).toBeTruthy();
  });
});

describe("pièges (FEAT-022)", () => {
  it("CA-022-1 : un piège bloque les nouveaux scans 1 à 5 min, puis ne piège plus une seconde fois", async () => {
    const a = await joueur(), b = await joueur("chaos");
    const r = await scan(a, await porteur("T-2"));
    expect(r).toMatchObject({ type: "piege", effet: "T-2" });
    expect(r.minutes).toBeGreaterThanOrEqual(1);
    expect(r.minutes).toBeLessThanOrEqual(5);
    expect(await scan(a, b.code, T0 + 30_000)).toMatchObject({ type: "bloque", cause: "T-2" });
    const apres = T0 + 6 * MIN;
    expect((await scan(a, b.code, apres)).type).toBe("nouvelle_carte");
    expect(await scan(a, await porteur("T-2", apres), apres)).toMatchObject({ type: "piege", deja: true });
  });

  it("L-2 « Retour sans reçu » protège du prochain piège", async () => {
    const a = await joueur();
    await scan(a, await porteur("L-2"));
    expect(await scan(a, await porteur("T-4"))).toMatchObject({ type: "piege", protege: true });
    expect(perso(a.id).bloque_jusqu_a).toBeNull();
    expect((await scan(a, await porteur("T-5"))).jusqu_a).toBeTruthy();
  });

  it("le MJ voit l'effet sans le subir", async () => {
    const mj = await joueur();
    env.DB.sqlite.prepare("UPDATE personnages SET est_mj = 1 WHERE id = ?").run(mj.id);
    expect(await scan(mj, await porteur("T-1"))).toMatchObject({ type: "piege", effet: "T-1", mj: true });
    expect(perso(mj.id).bloque_jusqu_a).toBeNull();
  });
});

describe("pause « Fermé pour inventaire » (ADM-17)", () => {
  afterEach(() => vi.useRealTimers());

  it("RG-020-5 : toutes les étiquettes du MJ bloquent 2 min, à chaque scan", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(T0);
    const a = await joueur(), b = await joueur(), mj = etiquette("personnelle_mj");
    await ouvrirPause(env as never, 10, "test");
    const r = await scan(a, await porteur("L-1"));
    expect(r).toMatchObject({ type: "piege", effet: "pause" });
    expect(Date.parse(r.jusqu_a) - T0).toBe(2 * MIN);
    expect(Date.parse(r.reouverture) - T0).toBe(10 * MIN);
    expect((await scan(b, mj)).effet).toBe("pause");
    expect(await scan(a, b.code, T0 + MIN)).toMatchObject({ type: "bloque", cause: "pause" });
    // Après la pause, la légendaire s'obtient normalement
    const apres = T0 + 11 * MIN;
    vi.setSystemTime(apres);
    expect((await scan(a, await porteur("L-1", apres), apres)).type).toBe("legendaire");
  });

  it("la pause vaut en heure réelle, même pour un téléphone du banc à une autre heure simulée", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(H(0)); // heure réelle : 19 h ; le joueur, lui, vit à 21 h 30 (T0)
    const a = await joueur(), b = await joueur();
    await api("/api/moi", undefined, b.jeton, H(9)); // un autre téléphone du banc est déjà à 4 h du matin
    await ouvrirPause(env as never, 5, "test");
    const r = await scan(a, await porteur("L-4"));
    expect(r).toMatchObject({ type: "piege", effet: "pause" });
    expect(Date.parse(r.reouverture) - T0).toBe(5 * MIN);
    vi.setSystemTime(H(0, 6));
    expect((await scan(a, await porteur("L-4", T0 + 3 * MIN), T0 + 3 * MIN)).type).toBe("legendaire");
  });
});

describe("sanctions graduées (ADM-18)", () => {
  it("niveau 2 bloque 5 min ; l'annulation débloque", async () => {
    const a = await joueur(), b = await joueur();
    await api("/api/moi", undefined, a.jeton); // dernière activité à T0
    await sanctionner(env as never, a.id, 2, "test");
    expect(await scan(a, b.code, T0 + MIN)).toMatchObject({ type: "bloque", cause: "sanction" });
    const id = (env.DB.sqlite.prepare("SELECT id FROM sanctions").get() as { id: number }).id;
    await annulerSanction(env as never, id);
    expect((await scan(a, b.code, T0 + 2 * MIN)).type).toBe("nouvelle_carte");
    const notifs = await api("/api/notifs", undefined, a.jeton, T0 + 2 * MIN);
    expect(notifs.notifs.map((x: any) => x.type)).toEqual(["sanction", "sanction_annulee"]);
  });

  it("niveau 4 retire 100 points et la mémoire ; l'annulation les rend", async () => {
    const a = await joueur(), b = await joueur("chaos");
    await scan(a, b.code);
    expect(points("ordre")).toBe(15); // +10, +5 inter-faction
    await sanctionner(env as never, a.id, 4, "test");
    expect([points("ordre"), perso(a.id).souvenirs]).toEqual([-85, 0]);
    await annulerSanction(env as never, (env.DB.sqlite.prepare("SELECT id FROM sanctions").get() as { id: number }).id);
    expect([points("ordre"), perso(a.id).souvenirs]).toEqual([15, 10]);
  });

  it("niveau 5 : le personnage ne scanne plus, ses étiquettes ne répondent plus, il sort des classements", async () => {
    const a = await joueur(), b = await joueur();
    await scan(b, a.code);
    await sanctionner(env as never, a.id, 5, "test");
    expect((await scan(a, b.code)).type).toBe("suspendu");
    expect((await scan(b, a.code)).type).toBe("retiree");
    const c = await api("/api/classements", undefined, b.jeton);
    expect(JSON.stringify(c)).not.toContain(a.id);
  });
});

describe("missions personnelles (ADM-19)", () => {
  // Les missions partent de l'heure réelle : on la fige à T0, sinon la date du jour (après la fête) les fait démarrer après les scans
  beforeEach(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(T0); });
  afterEach(() => vi.useRealTimers());
  it("M-1 : 3 nouvelles personnes en 10 min → +20 points et badge Employé du mois ; une seule mission à la fois", async () => {
    const a = await joueur(), [b, c, d] = [await joueur("chaos"), await joueur("chaos"), await joueur("chaos")];
    await api("/api/moi", undefined, a.jeton);
    expect(await confierMission(env as never, a.id, "M-1", "test")).toBeNull();
    expect(await confierMission(env as never, a.id, "M-2", "test")).toMatch(/déjà une mission/);
    expect((await api("/api/moi", undefined, a.jeton)).mission_mj.code).toBe("M-1");
    for (const x of [b, c, d]) await scan(a, x.code, T0 + MIN);
    const m = env.DB.sqlite.prepare("SELECT etat FROM missions").get() as { etat: string };
    expect(m.etat).toBe("reussie");
    expect(points("ordre")).toBe(3 * 15 + 20);
    expect((env.DB.sqlite.prepare("SELECT 1 AS x FROM badges WHERE personnage_id = ? AND badge = 'employe_du_mois'").get(a.id))).toBeTruthy();
  });

  it("une mission non remplie à temps échoue, sans pénalité", async () => {
    const a = await joueur();
    await api("/api/moi", undefined, a.jeton);
    await confierMission(env as never, a.id, "M-2", "test");
    const r = await api("/api/notifs?apres=0", undefined, a.jeton, T0 + 21 * MIN);
    expect(r.mission_mj).toBeNull();
    expect(r.notifs.map((x: any) => x.type)).toEqual(["mission", "mission_echouee"]);
  });

  it("M-5 : deux personnes qui n'avaient jamais scanné le MJ le font pendant la mission", async () => {
    const a = await joueur(), b = await joueur(), c = await joueur(), mj = etiquette("personnelle_mj");
    env.DB.sqlite.prepare("UPDATE etiquettes SET etat = 'reclamee', personnage_id = ? WHERE code = ?").run(a.id, mj); // carte du MJ, pour l'exemple
    await api("/api/moi", undefined, a.jeton);
    await confierMission(env as never, a.id, "M-5", "test");
    await scan(b, mj, T0 + MIN);
    await scan(c, mj, T0 + 2 * MIN);
    expect((env.DB.sqlite.prepare("SELECT etat FROM missions").get() as { etat: string }).etat).toBe("reussie");
  });

  it("M-6 « Solde privée » : 5 nouvelles cartes à ×2, tout de suite", async () => {
    const a = await joueur(), b = await joueur("chaos");
    await api("/api/moi", undefined, a.jeton);
    await confierMission(env as never, a.id, "M-6", "test");
    expect((await scan(a, b.code)).quete_total).toBe(2);
  });
});
