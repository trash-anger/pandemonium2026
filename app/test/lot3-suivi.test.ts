// LOT-3 E : frise d'activité (ADM-14) et suggestions de réglage au MJ (ADM-16, barème §6).
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { lireParametres } from "../src/config";
import { contenuPour, tickPush } from "../src/push";
import { frise, signaux, tickSuggestions, traiterSuggestion } from "../src/suivi";
import { d1Memoire } from "./d1-memoire";

const H = (h: number, m = 0) => Date.UTC(2026, 10, 8, h, m); // heure UTC ; Montréal = UTC − 5
const DEBUT = H(2); // 21 h
const MIN = 60_000;
const iso = (t: number) => new Date(t).toISOString();

let env: { DB: ReturnType<typeof d1Memoire>; PUBLIC_ORIGIN: string; VAPID_JWK?: string };
let ids: string[] = [];
const sql = (q: string, ...a: unknown[]) => env.DB.sqlite.prepare(q).run(...a);

function joueurs(n: number, t = DEBUT, mj = false) {
  const r: string[] = [];
  for (let i = 0; i < n; i++) {
    const id = (mj ? "mj" : "p") + i;
    sql("INSERT INTO personnages (id, pseudo, type, couleur, classe, pin_sel, pin_empreinte, cree_le, est_mj) VALUES (?, ?, 'nuit', 'rouge', 'barde', '', '', ?, ?)", id, "Pseudo " + id, iso(t), mj ? 1 : 0);
    r.push(id);
  }
  return r;
}
/** n nouvelles cartes (collection) réparties entre les joueurs, toutes avant t. */
function cartes(n: number, t: number) {
  let k = 0;
  for (const a of ids) for (const b of ids) {
    if (a === b) continue;
    if (k++ >= n) return;
    sql("INSERT INTO collection (possesseur_id, personnage_id, premier_scan_le, dernier_scan_le, code) VALUES (?, ?, ?, ?, 'X')", a, b, iso(t - MIN), iso(t - MIN));
  }
}
const scan = (resultat: string, t: number) => sql("INSERT INTO scans (scanneur_id, code, cible_id, source, resultat, horodatage_serveur) VALUES ('p0', 'X', 'p1', 'app', ?, ?)", resultat, iso(t));
const corrompre = (id: string, a: number, z: number) => sql("INSERT INTO corruptions (personnage_id, debut, fin, cause) VALUES (?, ?, ?, 'chat')", id, iso(a), iso(z));

beforeEach(() => { env = { DB: d1Memoire(), PUBLIC_ORIGIN: "http://localhost:8787" }; ids = []; });

describe("Frise d'activité (ADM-14)", () => {
  it("compte par tranche de 5 min les scans, les nouveaux joueurs et la part de corrompus, avec les repères", async () => {
    ids = joueurs(4, DEBUT + 2 * MIN);
    scan("nouvelle_carte", DEBUT + 6 * MIN); scan("nouvelle_carte", DEBUT + 7 * MIN); scan("deja_vu", DEBUT + 8 * MIN);
    corrompre("p0", DEBUT + 5 * MIN, DEBUT + 30 * MIN);
    sql("INSERT INTO sanctions (personnage_id, niveau, le) VALUES ('p1', 2, ?)", iso(DEBUT + 7 * MIN));
    sql("INSERT INTO evenements (type, donnees, debut) VALUES ('palier', '{\"n\":1}', ?)", iso(DEBUT + 9 * MIN));
    const f = await frise(env as never, DEBUT + 12 * MIN);
    expect(f.nb).toBe(108); // 21 h → 6 h
    expect(f.tranches).toHaveLength(3);
    expect(f.tranches.map((c) => [c.nouvelles, c.rescans, c.joueurs])).toEqual([[0, 0, 4], [2, 1, 0], [0, 0, 0]]);
    expect(f.tranches[1].corrompus).toBe(1);
    expect(f.tranches[1].actifs).toBe(4);
    expect(f.reperes.map((r) => r.type)).toEqual(expect.arrayContaining(["heure", "melange", "sanction", "palier"]));
    expect(f.reperes.find((r) => r.type === "sanction")!.libelle).toBe("Sanction 2 : Pseudo p1");
  });
});

describe("Signaux (barème §6)", () => {
  const T = DEBUT + 2 * 60 * MIN; // 23 h : un quart de la soirée avant la révélation

  it("connexions plus de 2 fois au-dessus de la courbe : préréglage plus rapide ; sous la moitié : plus lent", async () => {
    ids = joueurs(30);
    cartes(400, T); // attendu : 30 × 25 × 0,25 = 187,5
    let s = await signaux(env as never, T);
    expect(s[0]).toMatchObject({ cle: "plus_rapide", action: { prereglage: "tres_rapide" } });
    expect(s[0].texte).toBe("Les connexions vont 2,1 fois plus vite que prévu. Passer au préréglage Très rapide ?");

    env.DB.sqlite.exec("DELETE FROM collection");
    cartes(50, T);
    s = await signaux(env as never, T);
    expect(s[0]).toMatchObject({ cle: "plus_lent", action: { prereglage: "normal" } });
  });

  it("rien avant 30 min de jeu ni après la révélation", async () => {
    ids = joueurs(30);
    cartes(400, T);
    expect(await signaux(env as never, DEBUT + 20 * MIN)).toEqual([]);
    expect(await signaux(env as never, H(10, 1))).toEqual([]);
  });

  it("palier atteint plus de 45 min avant l'heure prévue", async () => {
    ids = joueurs(30);
    cartes(200, T); // dans la courbe
    // Rapide : P-1 à 500 = 500 / (30 × 25) des 8 h, prévu vers 2 h 20 ; atteint à 23 h, donc très en avance
    sql("INSERT INTO evenements (type, donnees, debut) VALUES ('palier', '{\"n\":1,\"seuil\":500}', ?)", iso(T - 5 * MIN));
    const s = await signaux(env as never, T);
    expect(s.map((x) => x.cle)).toEqual(["palier"]);
    expect(s[0].texte).toBe("Palier 1 atteint 205 min avant l'heure prévue. Passer au préréglage Très rapide ?");
    expect(s[0].texte).toMatch(/^Palier 1 atteint \d+ min avant l'heure prévue\. Passer au préréglage Très rapide \?$/);
  });

  it("plus de 50 % de corrompus pendant 20 min : baisser la transmission de 10 points", async () => {
    ids = joueurs(20);
    cartes(125, T);
    for (const id of ids.slice(0, 11)) corrompre(id, T - 25 * MIN, T + 10 * MIN);
    const s = await signaux(env as never, T);
    expect(s.map((x) => x.cle)).toEqual(["transmission"]);
    expect(s[0]).toMatchObject({ texte: "55 % de corrompus depuis 20 min. Baisser la transmission à 50 % ?", action: { transmission: 0.5 } });
  });

  it("moins de 10 % une heure après le premier chat : relancer un foyer ; trop de rescans : les réduire", async () => {
    ids = joueurs(20);
    cartes(125, T);
    sql("UPDATE personnages SET chat_noir_le = ? WHERE id = 'p3'", iso(T - 70 * MIN));
    for (let i = 0; i < 25; i++) scan("deja_vu", T - i * MIN);
    for (let i = 0; i < 5; i++) scan("nouvelle_carte", T - i * MIN);
    const s = await signaux(env as never, T);
    expect(s.map((x) => x.cle)).toEqual(["foyer", "rescans"]);
    expect(s[1].action).toEqual({ rescan_quete: 0.1 });
  });
});

describe("Suggestions au MJ (ADM-16)", () => {
  const T = DEBUT + 2 * 60 * MIN;
  let JWK = "";
  beforeAll(async () => {
    const k = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
    JWK = JSON.stringify(await crypto.subtle.exportKey("jwk", k.privateKey));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("une suggestion au plus toutes les 15 min, jamais le même signal avant 45 min ; le MJ l'applique en un toucher", async () => {
    ids = joueurs(30);
    joueurs(1, DEBUT, true);
    cartes(400, T);
    const s1 = await tickSuggestions(env as never, T);
    expect(s1).toMatchObject({ cle: "plus_rapide" });
    expect(env.DB.sqlite.prepare("SELECT type, donnees FROM notifs WHERE personnage_id = 'mj0'").get()).toMatchObject({ type: "suggestion" });
    expect(await tickSuggestions(env as never, T + 10 * MIN)).toBeNull(); // moins de 15 min
    expect(await tickSuggestions(env as never, T + 20 * MIN)).toBeNull(); // même signal, moins de 45 min

    const r = await traiterSuggestion(env as never, s1!.id!, true, "mj@exemple.com", async () => T);
    expect(r.message).toMatch(/Très rapide/);
    expect((await lireParametres(env.DB as never)).prereglage).toBe("tres_rapide");
    expect((await traiterSuggestion(env as never, s1!.id!, true, "mj@exemple.com", async () => T)).erreur).toMatch(/déjà/);
    // Avec Très rapide (40 cartes par joueur), le rythme redevient normal : plus rien à suggérer
    expect(await tickSuggestions(env as never, T + 60 * MIN)).toBeNull();
  });

  it("une suggestion ignorée n'applique rien ; une nouvelle remplace celle qui attendait", async () => {
    ids = joueurs(30);
    cartes(400, T);
    const s1 = await tickSuggestions(env as never, T);
    expect((await traiterSuggestion(env as never, s1!.id!, false, "mj", async () => T)).message).toBe("Suggestion ignorée.");
    expect((await lireParametres(env.DB as never)).prereglage).toBe("rapide");
    for (const id of ids.slice(0, 16)) corrompre(id, T - 10 * MIN, T + 60 * MIN);
    expect(await tickSuggestions(env as never, T + 20 * MIN, { force: true })).toMatchObject({ cle: "transmission" });
    for (let i = 0; i < 25; i++) scan("deja_vu", T + 40 * MIN - i * MIN);
    expect(await tickSuggestions(env as never, T + 40 * MIN, { force: true })).toMatchObject({ cle: "rescans" });
    expect(env.DB.sqlite.prepare("SELECT etat FROM suggestions ORDER BY id").all().map((x: any) => x.etat)).toEqual(["ignoree", "perimee", "proposee"]);
  });

  it("la suggestion part en push au MJ et ouvre l'admin", async () => {
    env.VAPID_JWK = JWK;
    vi.stubGlobal("fetch", async () => new Response(null, { status: 201 }));
    ids = joueurs(30);
    joueurs(1, DEBUT, true);
    cartes(400, T);
    sql("INSERT INTO abonnements_push (endpoint, personnage_id, cree_le) VALUES ('https://fcm.googleapis.com/fcm/send/mj', 'mj0', ?)", iso(T));
    await tickSuggestions(env as never, T);
    expect((await tickPush(env as never, T)).envoyes).toBe(1);
    expect(await contenuPour(env as never, "https://fcm.googleapis.com/fcm/send/mj")).toEqual([
      { titre: "🎛️ Suggestion de réglage", texte: "Les connexions vont 2,1 fois plus vite que prévu. Passer au préréglage Très rapide ?", tag: "suggestion", url: "/admin#suggestions" },
    ]);
  });
});
