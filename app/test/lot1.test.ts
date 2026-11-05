// LOT-1 : création, collection, rescans, badges, droits, surconsommation, classements.
// Les routes /api/* tournent contre une base D1 en mémoire (migrations réelles).
import { beforeEach, describe, expect, it } from "vitest";
import { routeApi } from "../src/jeu";
import { d1Memoire } from "./d1-memoire";
import { ALPHABET } from "../src/codes";

const ORIGINE = "http://localhost:8787";
// Heures de Montréal (UTC−5) : 21 h = 02:00 UTC, minuit = 05:00, 1 h = 06:00
const H = (h: number, m = 0) => Date.UTC(2026, 10, 8, h, m);
const T0 = H(2, 30); // 21 h 30

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
  // Codes valides et distincts : n écrit en base 31 avec l'alphabet des étiquettes
  let x = ++n, code = "";
  for (let i = 0; i < 4; i++) { code = ALPHABET[x % 31] + code; x = Math.floor(x / 31); }
  env.DB.sqlite.prepare("INSERT INTO etiquettes (code, format, role, lot) VALUES (?, 'petit', ?, 1)").run(code, role);
  return code;
}

const COSTUME = { type: "nuit", couleur: "rouge", attributs: ["cape", "sang"] };

/** Parcours complet des 4 écrans : renvoie le jeton d'appareil et le code de l'étiquette. */
async function joueur(t = T0) {
  const code = etiquette();
  const ti = await api("/api/tirage", { code, ...COSTUME, langue: "fr" }, undefined, t);
  const r = await api("/api/creer", { jeton: ti.jeton, ...COSTUME, photos: false, pin: "1234", langue: "fr", id_client: crypto.randomUUID() }, undefined, t);
  expect(r.status).toBe(200);
  return { jeton: r.jeton as string, code, id: r.personnage.id as string };
}
const scan = (qui: { jeton: string }, code: string, t = T0) => api("/api/scan", { code, id_client: crypto.randomUUID(), source: "app" }, qui.jeton, t);
const badges = async (qui: { jeton: string }) => ((await api("/api/moi", undefined, qui.jeton)).badges as { badge: string }[]).map((b) => b.badge);

beforeEach(() => {
  env = { DB: d1Memoire(), PUBLIC_ORIGIN: ORIGINE, SESSION_SECRET: "secret-de-test", BANC_SESSION: true }; // horloge simulée
});

describe("création du personnage (FEAT-003)", () => {
  it("CA-003-1 : les 4 écrans créent un personnage et réclament l'étiquette", async () => {
    const j = await joueur();
    const e = env.DB.sqlite.prepare("SELECT etat, personnage_id, faction_id FROM etiquettes WHERE code = ?").get(j.code) as Record<string, string>;
    expect(e.etat).toBe("reclamee");
    expect(e.personnage_id).toBe(j.id);
    expect(e.faction_id).toBeTruthy();
  });

  it("CA-003-4 : le pseudo tiré n'est jamais vide", async () => {
    for (let i = 0; i < 30; i++) {
      const ti = await api("/api/tirage", { code: etiquette(), ...COSTUME, langue: i % 2 ? "en" : "fr" });
      expect(ti.pseudo.trim().length).toBeGreaterThan(3);
    }
  });

  it("refuse une création avant 21 h", async () => {
    const code = etiquette();
    const ti = await api("/api/tirage", { code, ...COSTUME, langue: "fr" }, undefined, H(1, 30));
    const r = await api("/api/creer", { jeton: ti.jeton, ...COSTUME, pin: "1234", langue: "fr" }, undefined, H(1, 30));
    expect(r.status).toBe(409);
  });

  it("CA-003-3 : deux réclamations simultanées, une seule réussit", async () => {
    const code = etiquette();
    const [a, b] = await Promise.all([1, 2].map(() => api("/api/tirage", { code, ...COSTUME, langue: "fr" })));
    const r = await Promise.all([a, b].map((ti) => api("/api/creer", { jeton: ti.jeton, ...COSTUME, pin: "1234", langue: "fr" })));
    expect(r.map((x) => x.status).sort()).toEqual([200, 409]);
    expect((env.DB.sqlite.prepare("SELECT COUNT(*) AS n FROM personnages").get() as { n: number }).n).toBe(1);
  });

  it("CA-003-2 : répondre « Non » sur une étiquette vierge donne Tueur de poussin, l'étiquette reste vierge", async () => {
    const j = await joueur();
    const code = etiquette();
    expect((await scan(j, code)).type).toBe("a_toi");
    const r = await api("/api/etiquette", { code, a_moi: false }, j.jeton);
    expect(r.badge).toBe("tueur_de_poussin");
    expect((env.DB.sqlite.prepare("SELECT etat FROM etiquettes WHERE code = ?").get(code) as { etat: string }).etat).toBe("vierge");
  });
});

describe("collection (FEAT-004)", () => {
  it("CA-004-1 : A scanne B, la collection de A gagne B ; celle de B ne change pas", async () => {
    const a = await joueur(), b = await joueur();
    const r = await scan(a, b.code);
    expect(r.type).toBe("nouvelle_carte");
    expect(r.nb_cartes).toBe(1);
    expect((await api("/api/collection", undefined, a.jeton)).cartes).toHaveLength(1);
    expect((await api("/api/collection", undefined, b.jeton)).cartes).toHaveLength(0);
  });

  it("CA-004-2 : scanner sa propre étiquette ne change rien", async () => {
    const a = await joueur();
    expect((await scan(a, a.code)).type).toBe("soi_meme");
    expect((await api("/api/collection", undefined, a.jeton)).cartes).toHaveLength(0);
  });

  it("un scan rejoué (même id_client) donne la même réponse sans compter deux fois", async () => {
    const a = await joueur(), b = await joueur();
    const corps = { code: b.code, id_client: "rejoue-1", source: "app" };
    const r1 = await api("/api/scan", corps, a.jeton), r2 = await api("/api/scan", corps, a.jeton);
    expect(r2.type).toBe(r1.type);
    expect((await api("/api/collection", undefined, a.jeton)).cartes[0].nb_scans).toBe(1);
  });

  it("un appareil sans personnage est spectateur", async () => {
    const b = await joueur();
    expect((await api("/api/scan", { code: b.code, id_client: "x" })).type).toBe("spectateur");
  });
});

describe("rescans et badges (RG-005-2, RG-005-3)", () => {
  it("un rescan compte une fois par 5 min ; ×3 donne Boucle détectée", async () => {
    const a = await joueur(), b = await joueur();
    await scan(a, b.code, T0);
    const r1 = await scan(a, b.code, T0 + 60_000);
    expect(r1.compte).toBe(false);
    expect(r1.n).toBe(1);
    expect((await scan(a, b.code, T0 + 6 * 60_000)).n).toBe(2);
    const r3 = await scan(a, b.code, T0 + 12 * 60_000);
    expect(r3.n).toBe(3);
    expect(r3.badges).toEqual(["boucle_detectee"]);
  });

  it("Collègue de rayon : seulement pour une personne de sa faction", async () => {
    const a = await joueur();
    const fa = (env.DB.sqlite.prepare("SELECT faction_id AS f FROM etiquettes WHERE code = ?").get(a.code) as { f: string }).f;
    const b = await joueur(), c = await joueur();
    const autre = fa === "ordre" ? "chaos" : "ordre";
    env.DB.sqlite.prepare("UPDATE etiquettes SET faction_id = ? WHERE code = ?").run(autre, b.code);
    env.DB.sqlite.prepare("UPDATE etiquettes SET faction_id = ? WHERE code = ?").run(fa, c.code);
    expect((await scan(a, b.code)).badges).toEqual([]);
    expect((await scan(a, c.code)).badges).toEqual(["collegue_de_rayon"]);
  });

  it("Téléporteur installé : attribué une seule fois", async () => {
    const a = await joueur();
    expect((await api("/api/installe", {}, a.jeton)).badge).toBe("installe_portail");
    expect((await api("/api/installe", {}, a.jeton)).badge).toBeNull();
  });
});

describe("droits de modification (RG-003-11, RG-003-12)", () => {
  it("classe modifiable avant 1 h (Trans-classe), figée après", async () => {
    const a = await joueur();
    const moi = await api("/api/moi", undefined, a.jeton);
    const autre = moi.personnage.classe === "barde" ? "clerc" : "barde";
    expect((await api("/api/modifier", { classe: autre }, a.jeton, H(5, 30))).status).toBe(200);
    expect(await badges(a)).toContain("trans_classe");
    expect((await api("/api/modifier", { classe: moi.personnage.classe }, a.jeton, H(6, 10))).status).toBe(409);
  });

  it("pseudo modifiable avant minuit seulement", async () => {
    const a = await joueur();
    expect((await api("/api/modifier", { pseudo: "Goule Test" }, a.jeton, H(4, 0))).status).toBe(200);
    expect((await api("/api/modifier", { pseudo: "Trop tard" }, a.jeton, H(5, 10))).status).toBe(409);
  });

  it("costume figé dès le premier scan par un autre joueur", async () => {
    const a = await joueur(), b = await joueur();
    await scan(b, a.code);
    expect((await api("/api/modifier", { couleur: "bleu" }, a.jeton)).status).toBe(409);
  });
});

describe("surconsommation (RG-003-10)", () => {
  it("la 4e étiquette : badge, blocage du scanner, factions limitées à 3", async () => {
    const a = await joueur();
    for (let i = 0; i < 3; i++) {
      const code = etiquette();
      const r = await api("/api/etiquette", { code, a_moi: true }, a.jeton);
      expect(r.status).toBe(200);
      if (i === 2) expect(r.surconsommation).toBe(true);
    }
    const b = await badges(a);
    expect(b).toEqual(expect.arrayContaining(["achat_compulsif", "surconsommation"]));
    const factions = env.DB.sqlite.prepare("SELECT COUNT(DISTINCT faction_id) AS n FROM etiquettes WHERE personnage_id = ?").get(a.id) as { n: number };
    expect(factions.n).toBe(3);
    const autre = await joueur();
    expect((await scan(a, autre.code)).type).toBe("bloque");
  });
});

describe("classements et médailles (FEAT-015)", () => {
  it("le MJ n'est pas classé ; top 3 = médaille bonus", async () => {
    const a = await joueur(), b = await joueur(), c = await joueur();
    await scan(a, b.code); await scan(a, c.code); await scan(b, c.code);
    const r = await api("/api/classements", undefined, a.jeton);
    const coll = r.classements.find((x: { id: string }) => x.id === "collectionneurs");
    expect(coll.top[0]).toMatchObject({ rang: 1, n: 2, moi: true });
    const moi = await api("/api/moi", undefined, a.jeton);
    expect(moi.medailles).toEqual(expect.arrayContaining([expect.objectContaining({ classement: "collectionneurs", faction: null, rang: 1 })]));
    // Pseudo unique : deux joueurs au même costume peuvent tirer le même pseudo
    env.DB.sqlite.prepare("UPDATE personnages SET est_mj = 1, pseudo = 'MJ unique' WHERE id = ?").run(a.id);
    const sans = await api("/api/classements", undefined, b.jeton);
    for (const c of sans.classements) expect(c.top.some((x: { pseudo: string }) => x.pseudo === "MJ unique")).toBe(false);
  });
});

describe("sécurité", () => {
  it("refuse une écriture venant d'une autre origine", async () => {
    const req = new Request(ORIGINE + "/api/scan", { method: "POST", headers: { Origin: "https://ailleurs.example", "Content-Type": "application/json" }, body: "{}" });
    expect((await routeApi(req, env as never, new URL(req.url))).status).toBe(403);
  });

  it("un tirage falsifié est refusé", async () => {
    const r = await api("/api/creer", { jeton: "faux.jeton", ...COSTUME, pin: "1234", langue: "fr" });
    expect(r.status).toBeGreaterThanOrEqual(400);
  });
});
