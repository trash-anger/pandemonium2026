// MJ dans l'app : étiquette clé (ouvre l'admin), accès avant l'ouverture ; admin : fiche joueur et vues séparées.
import { beforeEach, describe, expect, it } from "vitest";
import { routeApi } from "../src/jeu";
import { d1Memoire } from "./d1-memoire";
import { ALPHABET } from "../src/codes";
import { signer } from "../src/auth";
import { ficheJoueur } from "../src/fiche";
import { pageAdmin } from "../src/pages";

const ORIGINE = "http://localhost:8787";
const H = (h: number, m = 0) => Date.UTC(2026, 10, 8, h, m); // 21 h Montréal = 02:00 UTC
const T0 = H(2, 30), AVANT = H(1, 0); // 21 h 30, et 20 h (avant l'ouverture)
let env: { DB: ReturnType<typeof d1Memoire>; PUBLIC_ORIGIN: string; SESSION_SECRET: string; ADMIN_EMAILS: string; BANC_SESSION: boolean };
let n = 0;

async function api(chemin: string, corps?: object, jeton?: string, t = T0, cookie?: string): Promise<Record<string, any>> {
  const req = new Request(ORIGINE + chemin, {
    method: corps ? "POST" : "GET",
    headers: { "Content-Type": "application/json", "X-Dev-Maintenant": String(t), ...(jeton ? { "X-Appareil": jeton } : {}), ...(cookie ? { Cookie: cookie } : {}) },
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
async function joueur(role = "normale", t = T0) {
  const code = etiquette(role), costume = { type: "nuit", couleur: "rouge", attributs: ["cape", "sang"] };
  const ti = await api("/api/tirage", { code, ...costume, langue: "fr" }, undefined, t);
  const r = await api("/api/creer", { jeton: ti.jeton, ...costume, photos: true, pin: "1234", langue: "fr" }, undefined, t);
  expect(r.status).toBe(200);
  return { jeton: r.jeton as string, code, id: r.personnage.id as string };
}
const scan = (jeton: string | undefined, code: string, t = T0, cookie?: string) => api("/api/scan", { code, id_client: crypto.randomUUID(), source: "app" }, jeton, t, cookie);
const session = async () => `dv_mj=${await signer("secret-de-test", { email: "mj@exemple.org", exp: Math.floor(Date.now() / 1000) + 3600 })}`;

beforeEach(() => {
  env = { DB: d1Memoire(), PUBLIC_ORIGIN: ORIGINE, SESSION_SECRET: "secret-de-test", ADMIN_EMAILS: "mj@exemple.org", BANC_SESSION: true };
});

describe("le MJ avant l'ouverture", () => {
  it("crée son personnage avec son étiquette personnelle avant l'heure ; les joueurs attendent", async () => {
    const code = etiquette("personnelle_mj");
    expect((await scan(undefined, code, AVANT)).type).toBe("creation");
    const ti = await api("/api/tirage", { code, type: "nuit", couleur: "rouge", attributs: ["cape"], langue: "fr" }, undefined, AVANT);
    const r = await api("/api/creer", { jeton: ti.jeton, type: "nuit", couleur: "rouge", attributs: ["cape"], photos: true, pin: "1234", langue: "fr" }, undefined, AVANT);
    expect(r.status).toBe(200);
    expect(r.personnage.est_mj).toBe(true);
    expect((await scan(r.jeton, code, AVANT)).type).toBe("soi_meme");
    // Une étiquette normale reste fermée, pour tout le monde
    const autre = etiquette();
    expect((await scan(undefined, autre, AVANT)).type).toBe("bientot");
    expect((await scan(r.jeton, autre, AVANT)).type).toBe("bientot");
    const ti2 = await api("/api/tirage", { code: autre, type: "nuit", couleur: "rouge", attributs: ["cape"], langue: "fr" }, undefined, AVANT);
    expect((await api("/api/creer", { jeton: ti2.jeton, type: "nuit", couleur: "rouge", attributs: ["cape"], photos: true, pin: "1234", langue: "fr" }, undefined, AVANT)).erreur).toBe("hors_horaires");
  });

  it("un joueur qui scanne l'étiquette du MJ avant l'heure attend aussi", async () => {
    const mj = await joueur("personnelle_mj");
    const a = await joueur();
    expect((await scan(a.jeton, mj.code, AVANT)).type).toBe("bientot");
  });
});

describe("étiquette clé du MJ", () => {
  it("scannée sur un téléphone connecté à l'admin, l'étiquette personnelle du MJ ouvre l'admin", async () => {
    const mj = await joueur("personnelle_mj"), a = await joueur();
    expect((await scan(a.jeton, mj.code, T0, await session())).type).toBe("admin");
    expect((await scan(undefined, mj.code, AVANT, await session())).type).toBe("admin"); // même avant l'ouverture
    expect((await scan(a.jeton, mj.code)).type).not.toBe("admin"); // sans session : la carte du MJ
    expect((await scan(a.jeton, mj.code, T0, "dv_mj=faux")).type).not.toBe("admin");
    const autre = etiquette("speciale_mj");
    expect((await scan(a.jeton, autre, T0, await session())).type).not.toBe("admin");
  });

  it("vierge, elle sert d'abord à créer le personnage du MJ", async () => {
    const code = etiquette("personnelle_mj");
    expect((await scan(undefined, code, T0, await session())).type).toBe("creation");
  });
});

describe("admin : fiche joueur et vues", () => {
  it("la fiche rassemble identité, collection, étiquettes, photos et duels", async () => {
    const a = await joueur(), b = await joueur();
    await scan(a.jeton, b.code);
    const f = (await ficheJoueur(env.DB as never, a.id))!;
    expect(f).toMatchObject({ id: a.id, photos_ok: true, est_mj: false, suspendu: false });
    expect(f.stats.cartes).toBe(1);
    expect(f.etiquettes[0].code).toBe(a.code);
    expect(f.derniers[0]).toMatchObject({ resultat: "nouvelle_carte" });
    expect((await ficheJoueur(env.DB as never, b.id))!.stats.scanne_par).toBe(1);
    expect(await ficheJoueur(env.DB as never, "inconnu")).toBeNull();
  });

  it("chaque vue n'affiche que sa partie, avec la barre d'onglets", async () => {
    const a = await joueur();
    const base = { email: "mj@exemple.org", role: "mj" as const, comptes: [], lots: [], heures: {}, parametres: {}, joueurs: { personnages: 1, scans: 0, cartes: 0 } };
    const joueurs = await pageAdmin({ ...base, vue: "joueurs", recherche: a.code, ficheJ: await ficheJoueur(env.DB as never, a.id) }).text();
    expect(joueurs).toContain('id="fiche-joueur"');
    expect(joueurs).toContain("Ouvrir le scanner");
    expect(joueurs).toContain('aria-current="page"><span>🔍</span>Joueurs');
    expect(joueurs).not.toContain("Zone dangereuse");
    const prep = await pageAdmin({ ...base, vue: "preparation" }).text();
    expect(prep).toContain("Zone dangereuse");
    expect(prep).not.toContain("Ouvrir le scanner");
    const direct = await pageAdmin({ ...base, vue: "direct" }).text();
    expect(direct).toContain("personnages");
    expect(direct).not.toContain("Lots et export");
  });
});
