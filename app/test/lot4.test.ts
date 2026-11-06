// LOT-4 : jumeaux et triplés (FEAT-007), chats noirs et glitch contagieux (FEAT-008).
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { routeApi } from "../src/jeu";
import { ecrireConfig, lireParametres } from "../src/config";
import {
  cibleCourbe, contact, corrompre, creerGroupe, designerChats, devenirChat, dureeCorruption, estTriple, etatContagion,
  fixerHasard, formerGroupes, jumeauDe,
} from "../src/jumeaux";
import { d1Memoire } from "./d1-memoire";
import { ALPHABET } from "../src/codes";

const ORIGINE = "http://localhost:8787";
const H = (h: number, m = 0) => Date.UTC(2026, 10, 8, h, m); // heure UTC ; Montréal = UTC − 5
const T0 = H(2, 30);       // 21 h 30
const MINUIT = H(5);       // minuit à Montréal
const DEUX_H = H(7);       // 2 h : tous les groupes formés
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
const COSTUME = { type: "nuit", couleur: "rouge", attributs: ["cape", "crocs"] };
async function joueur(t = T0, faction = "ordre") {
  const code = etiquette();
  const ti = await api("/api/tirage", { code, ...COSTUME, langue: "fr" }, undefined, t);
  const r = await api("/api/creer", { jeton: ti.jeton, ...COSTUME, pin: "1234", langue: "fr" }, undefined, t);
  env.DB.sqlite.prepare("UPDATE etiquettes SET faction_id = ? WHERE code = ?").run(faction, code);
  return { jeton: r.jeton as string, code, id: r.personnage.id as string };
}
type J = Awaited<ReturnType<typeof joueur>>;
const scan = (qui: J, code: string, t = T0) => api("/api/scan", { code, id_client: crypto.randomUUID(), source: "app" }, qui.jeton, t);
const groupes = () => env.DB.sqlite.prepare("SELECT * FROM groupes ORDER BY id").all() as { id: number; type: string }[];
const groupeDe = (id: string) => (env.DB.sqlite.prepare("SELECT groupe_id AS g FROM personnages WHERE id = ?").get(id) as { g: number | null }).g;
const aBadge = (id: string, b: string) => !!env.DB.sqlite.prepare("SELECT 1 FROM badges WHERE personnage_id = ? AND badge = ?").get(id, b);
const notifs = (id: string) => (env.DB.sqlite.prepare("SELECT type, donnees FROM notifs WHERE personnage_id = ? ORDER BY id").all(id) as { type: string; donnees: string }[])
  .map((x) => ({ type: x.type, ...JSON.parse(x.donnees) }));
async function reglerJumeaux(j: object) {
  const p = await lireParametres(env.DB as never);
  await ecrireConfig(env.DB as never, "parametres", { ...p, jumeaux: { ...p.jumeaux, ...j } });
}

beforeEach(() => {
  env = { DB: d1Memoire(), PUBLIC_ORIGIN: ORIGINE, SESSION_SECRET: "secret-de-test", BANC_SESSION: true };
  fixerHasard(() => 0); // tirages déterministes : transmission et immunité toujours
});
afterEach(() => fixerHasard(() => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32));

describe("attribution dynamique des jumeaux (DEC-071)", () => {
  it("courbe linéaire du départ à 2 h ; les triplés sont étalés", () => {
    expect(cibleCourbe(55, 0, 100, -1)).toBe(0);
    expect(cibleCourbe(55, 0, 100, 0)).toBe(1);
    expect(cibleCourbe(55, 0, 100, 50)).toBe(28);
    expect(cibleCourbe(55, 0, 100, 100)).toBe(55);
    const triples = Array.from({ length: 55 }, (_, k) => estTriple(k, 55, 10)).filter(Boolean).length;
    expect(triples).toBe(10);
  });

  it("rien avant la 60e activation ou minuit ; le nouveau joueur reçoit un partenaire actif depuis 10 min", async () => {
    await reglerJumeaux({ seuil_activations: 4, paires: 2, triples: 1 });
    const anciens = [await joueur(T0 - 30 * MIN), await joueur(T0 - 30 * MIN), await joueur(T0 - 30 * MIN)];
    expect(groupes()).toHaveLength(0);
    const nouveau = await joueur(T0); // 4e activation : départ de la courbe
    expect(groupes()).toHaveLength(1);
    expect(groupes()[0].type).toBe("jumeaux");
    expect(groupeDe(nouveau.id)).toBe(groupes()[0].id);
    expect(anciens.filter((a) => groupeDe(a.id) === groupes()[0].id)).toHaveLength(1);
    expect(notifs(nouveau.id)[0]).toMatchObject({ type: "jumeau", taille: 2, deja_croise: false });
  });

  it("CA-007-5 : à 2 h, la cible est atteinte (paires et triplés) ; le MJ n'a pas de jumeau", async () => {
    await reglerJumeaux({ paires: 2, triples: 1 });
    const mj = await joueur(T0 - 30 * MIN);
    env.DB.sqlite.prepare("UPDATE personnages SET est_mj = 1 WHERE id = ?").run(mj.id);
    for (let i = 0; i < 8; i++) await joueur(T0 - 20 * MIN);
    await formerGroupes(env as never, DEUX_H);
    expect(groupes().map((g) => g.type).sort()).toEqual(["jumeaux", "jumeaux", "triples"]);
    expect(groupeDe(mj.id)).toBeNull();
  });

  it("CA-007-6 : A, qui avait déjà scanné B, est averti à la formation du groupe", async () => {
    const a = await joueur(), b = await joueur();
    await scan(a, b.code);
    await creerGroupe(env as never, [a.id, b.id], T0 + MIN);
    expect(notifs(a.id).find((x) => x.type === "jumeau").deja_croise).toBe(true);
    expect(notifs(b.id).find((x) => x.type === "jumeau").deja_croise).toBe(false);
  });
});

describe("indices progressifs (RG-007-4 à RG-007-6)", () => {
  it("CA-007-7 : aucun indice avant minuit, puis un toutes les 10 min : type, couleur, attributs, pseudo", async () => {
    const a = await joueur(), b = await joueur();
    await creerGroupe(env as never, [a.id, b.id], T0);
    expect((await jumeauDe(env as never, a.id, MINUIT - MIN))!.nb_indices).toBe(0);
    const j1 = (await jumeauDe(env as never, a.id, MINUIT))!;
    expect(j1.doubles[0].indices).toEqual([{ k: "type", v: "nuit" }]);
    const j2 = (await jumeauDe(env as never, a.id, MINUIT + 10 * MIN))!;
    expect(j2.doubles[0].indices.map((x) => x.k)).toEqual(["type", "couleur"]);
    const tous = (await jumeauDe(env as never, a.id, MINUIT + 3 * 3600_000))!;
    expect(tous.doubles[0].indices.at(-1)).toMatchObject({ k: "pseudo" });
    expect(tous.doubles[0].indices.filter((x) => x.k === "attribut" && x.vrai).map((x) => x.v).sort()).toEqual(["cape", "crocs"]);
    expect(tous.prochain).toBeNull();
  });

  it("rattrapage : un groupe formé après minuit reçoit son premier indice tout de suite ; L-4 en donne un de plus", async () => {
    const a = await joueur(), b = await joueur();
    await creerGroupe(env as never, [a.id, b.id], MINUIT + 37 * MIN);
    expect((await jumeauDe(env as never, a.id, MINUIT + 37 * MIN))!.nb_indices).toBe(1);
    env.DB.sqlite.prepare("UPDATE personnages SET indices_bonus = 1 WHERE id = ?").run(a.id);
    expect((await jumeauDe(env as never, a.id, MINUIT + 37 * MIN))!.nb_indices).toBe(2);
  });
});

describe("retrouvailles par scan mutuel (RG-007-7)", () => {
  it("CA-007-1 : A scanne B, B scanne A en 60 s → retrouvailles chez les deux, badge, +50 points chacun", async () => {
    const a = await joueur(), b = await joueur();
    await creerGroupe(env as never, [a.id, b.id], T0);
    const r1 = await scan(a, b.code, T0 + MIN);
    expect(r1.jumeau.attente_jusqu_a).toBe(new Date(T0 + MIN + 90_000).toISOString());
    const r2 = await scan(b, a.code, T0 + 2 * MIN);
    expect(r2.jumeau.retrouvailles).toMatchObject({ complet: true, avec: { type: "nuit" } });
    expect(r2.jumeau.retrouvailles.souvenir.fr.length).toBeGreaterThan(50);
    expect(notifs(a.id).find((x) => x.type === "retrouvailles")).toMatchObject({ complet: true, premier: true });
    expect(aBadge(a.id, "jumeaux_retrouves") && aBadge(b.id, "jumeaux_retrouves")).toBe(true);
    expect((await jumeauDe(env as never, a.id, T0 + 3 * MIN))!.reuni).toBe(true);
    const pts = env.DB.sqlite.prepare("SELECT SUM(points) AS s FROM points_faction WHERE raison = 'retrouvailles'").get() as { s: number };
    expect(pts.s).toBe(100);
  });

  it("CA-007-2 : 3 min plus tard, pas de retrouvailles ; un nouvel essai reste possible", async () => {
    const a = await joueur(), b = await joueur();
    await creerGroupe(env as never, [a.id, b.id], T0);
    await scan(a, b.code, T0);
    expect((await scan(b, a.code, T0 + 3 * MIN)).jumeau.attente_jusqu_a).toBeTruthy();
    expect((await scan(a, b.code, T0 + 3 * MIN + 30_000)).jumeau.retrouvailles.complet).toBe(true);
  });

  it("CA-007-3 : n'importe quelle étiquette du jumeau compte", async () => {
    const a = await joueur(), b = await joueur(), autre = etiquette();
    env.DB.sqlite.prepare("UPDATE etiquettes SET etat = 'reclamee', personnage_id = ? WHERE code = ?").run(b.id, autre);
    await creerGroupe(env as never, [a.id, b.id], T0);
    await scan(a, autre, T0);
    expect((await scan(b, a.code, T0 + 30_000)).jumeau.retrouvailles).toBeTruthy();
  });

  it("RG-007-11 : triplés, badge intermédiaire à la première paire, retrouvailles complètes aux 3 paires", async () => {
    const [a, b, c] = [await joueur(), await joueur(), await joueur()];
    await creerGroupe(env as never, [a.id, b.id, c.id], T0);
    await scan(a, b.code, T0);
    const r = await scan(b, a.code, T0 + 10_000);
    expect(r.jumeau.retrouvailles).toMatchObject({ complet: false, triples: true, badges: ["triples_partiels"] });
    await scan(a, c.code, T0 + MIN); await scan(c, a.code, T0 + MIN + 10_000);
    await scan(b, c.code, T0 + 2 * MIN);
    expect((await scan(c, b.code, T0 + 2 * MIN + 10_000)).jumeau.retrouvailles.complet).toBe(true);
    expect([a, b, c].every((x) => aBadge(x.id, "jumeaux_retrouves"))).toBe(true);
  });
});

describe("chats noirs et contagion (FEAT-008)", () => {
  it("CA-008-1 : scanner un chat noir corrompt (transmission forcée) ; Patient zéro ; +5 pour le chat", async () => {
    const chat = await joueur(T0, "chaos"), a = await joueur();
    await devenirChat(env as never, chat.id, T0);
    expect(notifs(chat.id).map((x) => x.type)).toContain("chat_noir");
    const r = await scan(a, chat.code, T0 + MIN);
    expect(r.contagion.corrompu.par_chat).toBe(true);
    expect(r.contagion.badges).toEqual(["patient_zero"]);
    const pts = env.DB.sqlite.prepare("SELECT SUM(points) AS s FROM points_faction WHERE raison = 'contamination'").get() as { s: number };
    expect(pts.s).toBe(5);
  });

  it("RG-008-4 : un corrompu transmet dans les deux sens ; la cible est prévenue (glitch)", async () => {
    const a = await joueur(), b = await joueur(), c = await joueur();
    await corrompre(env as never, a.id, T0, "foyer", { forcer: true });
    await scan(a, b.code, T0 + MIN); // a contamine b
    expect(notifs(b.id).find((x) => x.type === "corrompu")).toBeTruthy();
    expect((await scan(c, b.code, T0 + 2 * MIN)).contagion.corrompu.par_chat).toBe(false); // c contaminé en scannant b
  });

  it("CA-008-2 : guérison après 10 min, puis immunité, puis de nouveau réceptif", async () => {
    const a = await joueur();
    await corrompre(env as never, a.id, T0, "foyer");
    expect((await etatContagion(env.DB as never, a.id, T0 + 5 * MIN)).corrompu_jusqu_a).toBeTruthy();
    const gueri = await etatContagion(env.DB as never, a.id, T0 + 10 * MIN);
    expect(gueri.corrompu_jusqu_a).toBeNull();
    expect(gueri.immunise_jusqu_a).toBe(new Date(T0 + 30 * MIN).toISOString()); // 80 % des cas : 20 min
    expect((await etatContagion(env.DB as never, a.id, T0 + 31 * MIN)).immunise_jusqu_a).toBeNull();
  });

  it("L-1 protège du glitch ; L-2 annule la corruption ; le MJ n'est jamais contaminé", async () => {
    const chat = await joueur(), a = await joueur(), b = await joueur(), mj = await joueur();
    env.DB.sqlite.prepare("UPDATE personnages SET est_mj = 1 WHERE id = ?").run(mj.id);
    await devenirChat(env as never, chat.id, T0);
    env.DB.sqlite.prepare("INSERT INTO effets (personnage_id, effet, obtenu_le, fin) VALUES (?, 'L-1', ?, ?)").run(a.id, new Date(T0).toISOString(), new Date(T0 + 30 * MIN).toISOString());
    env.DB.sqlite.prepare("INSERT INTO effets (personnage_id, effet, obtenu_le, reste) VALUES (?, 'L-2', ?, 1)").run(b.id, new Date(T0).toISOString());
    expect((await scan(a, chat.code)).contagion).toBeUndefined();
    expect((await scan(b, chat.code)).contagion.protege).toBe("L-2");
    expect(await contact(env as never, T0, { id: mj.id, est_mj: 1 }, { id: chat.id, est_mj: 0 })).toEqual({});
  });

  it("CA-008-5 : au-delà de 50 % de corrompus, la corruption dure moins de 10 min (minimum 3)", () => {
    expect(dureeCorruption(10, 0.5, 0.5, 3)).toBe(10);
    expect(dureeCorruption(10, 0.6, 0.5, 3)).toBe(8);
    expect(dureeCorruption(10, 1, 0.5, 3)).toBe(3);
  });

  it("CA-008-3 : la transmission réglée par le MJ s'applique aux scans suivants", async () => {
    const chat = await joueur(), a = await joueur();
    await devenirChat(env as never, chat.id, T0);
    const p = await lireParametres(env.DB as never);
    await ecrireConfig(env.DB as never, "parametres", { ...p, bareme: { transmission: 0 } });
    expect((await scan(a, chat.code)).contagion).toBeUndefined();
  });

  it("RG-008-1 : un chat noir dès 10 joueurs, puis 1 pour 50", async () => {
    const chats = () => (env.DB.sqlite.prepare("SELECT COUNT(*) AS n FROM personnages WHERE chat_noir_le IS NOT NULL").get() as { n: number }).n;
    for (let i = 0; i < 9; i++) await joueur();
    expect(chats()).toBe(0);
    await joueur(); // la 10e activation désigne le premier chat
    expect(chats()).toBe(1);
    expect(await designerChats(env as never, T0)).toBe(0);
  });
});
