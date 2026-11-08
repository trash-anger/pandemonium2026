// LOT-5 : mur « Déjà vu ! » (FEAT-017) : photos des scans faits dans l'app, consentement, modération.
import { beforeEach, describe, expect, it } from "vitest";
import { routeApi } from "../src/jeu";
import { d1Memoire } from "./d1-memoire";
import { ALPHABET } from "../src/codes";
import { masquerPhoto, murAdmin, MUR_PAGE } from "../src/mur";
import { pageGalerie } from "../src/pages";
import { avecPhotos, photosRevelation } from "../src/mur";

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

async function joueur(costume = { type: "nuit", couleur: "rouge", attributs: ["cape", "sang"] }, t = T0, photos = true) {
  const code = etiquette();
  const ti = await api("/api/tirage", { code, ...costume, langue: "fr" }, undefined, t);
  const r = await api("/api/creer", { jeton: ti.jeton, ...costume, photos, pin: "1234", langue: "fr" }, undefined, t);
  expect(r.status).toBe(200);
  return { jeton: r.jeton as string, code, id: r.personnage.id as string };
}
type J = Awaited<ReturnType<typeof joueur>>;
const scan = (qui: J, code: string, source = "app", id_client: string = crypto.randomUUID(), t = T0) =>
  api("/api/scan", { code, id_client, source }, qui.jeton, t).then((r): Record<string, any> => ({ ...r, id_client }));
const IMAGE = "data:image/jpeg;base64," + "A".repeat(4000);

beforeEach(() => {
  env = { DB: d1Memoire(), PUBLIC_ORIGIN: ORIGINE, SESSION_SECRET: "secret-de-test", BANC_SESSION: true };
});

describe("mur « Déjà vu ! » (FEAT-017)", () => {
  it("CA-017-1 : la photo d'un scan fait dans l'app apparaît sur le mur", async () => {
    const a = await joueur(), b = await joueur();
    const s = await scan(a, b.code);
    expect(s.type).toBe("nouvelle_carte");
    const r = await api("/api/photo", { id_client: s.id_client, image: IMAGE }, a.jeton);
    expect(r.status).toBe(200);
    const m = await api("/api/mur", undefined, b.jeton);
    expect(m.total).toBe(1);
    expect(m.photos[0]).toMatchObject({ id: r.id, image: IMAGE, moi: false });
    expect((await api("/api/mur", undefined, a.jeton)).photos[0].moi).toBe(true);
    const c = await joueur();
    expect((await api("/api/mur", undefined, c.jeton)).total).toBe(0); // ni prise par c, ni de son étiquette
  });

  it("consentement unique : sans accord, aucune photo gardée ; accord retiré, ses photos quittent le mur", async () => {
    const sans = await joueur(undefined, T0, false), a = await joueur(), b = await joueur();
    const s0 = await scan(sans, b.code);
    expect((await api("/api/photo", { id_client: s0.id_client, image: IMAGE }, sans.jeton)).erreur).toBe("sans_accord");
    const s1 = await scan(a, b.code);
    await api("/api/photo", { id_client: s1.id_client, image: IMAGE }, a.jeton);
    expect((await api("/api/mur", undefined, b.jeton)).total).toBe(1);
    await api("/api/modifier", { photos: false }, a.jeton);
    expect((await api("/api/mur", undefined, b.jeton)).total).toBe(0);
    expect((await api("/api/mur", undefined, a.jeton)).total).toBe(0);
  });

  it("une seule photo par scan, même renvoyée", async () => {
    const a = await joueur(), b = await joueur();
    const s = await scan(a, b.code);
    const r1 = await api("/api/photo", { id_client: s.id_client, image: IMAGE }, a.jeton);
    const r2 = await api("/api/photo", { id_client: s.id_client, image: IMAGE }, a.jeton);
    expect(r2.id).toBe(r1.id);
    expect((await api("/api/mur", undefined, a.jeton)).total).toBe(1);
  });

  it("RG-017-1 : pas de photo pour un scan par QR externe, ni pour le scan d'un autre", async () => {
    const a = await joueur(), b = await joueur(), c = await joueur();
    const ext = await scan(a, b.code, "qr_externe");
    expect((await api("/api/photo", { id_client: ext.id_client, image: IMAGE }, a.jeton)).status).toBe(404);
    const s = await scan(a, c.code);
    expect((await api("/api/photo", { id_client: s.id_client, image: IMAGE }, b.jeton)).status).toBe(404);
  });

  it("REQ-008 : refuse une image trop lourde ou qui n'est pas un JPEG", async () => {
    const a = await joueur(), b = await joueur();
    const s = await scan(a, b.code);
    for (const image of ["data:image/jpeg;base64," + "A".repeat(50_000), "data:image/png;base64,AAAA", "data:image/jpeg;base64,<script>"]) {
      expect((await api("/api/photo", { id_client: s.id_client, image }, a.jeton)).erreur).toBe("image");
    }
  });

  it("RG-017-5 : le mur est réservé aux joueurs", async () => {
    expect((await api("/api/mur")).status).toBe(401);
    expect((await api("/api/photo", { id_client: "x", image: IMAGE })).status).toBe(401);
  });

  it("RG-017-6 : une photo masquée par le MJ disparaît du mur ; pagination", async () => {
    const a = await joueur();
    const ids: number[] = [];
    for (let i = 0; i < MUR_PAGE + 2; i++) {
      const b = await joueur();
      const s = await scan(a, b.code);
      ids.push((await api("/api/photo", { id_client: s.id_client, image: IMAGE }, a.jeton)).id);
    }
    const p1 = await api("/api/mur", undefined, a.jeton);
    expect(p1.photos.length).toBe(MUR_PAGE);
    expect(p1.suite).toBe(true);
    const p2 = await api(`/api/mur?avant=${p1.photos.at(-1).id}`, undefined, a.jeton);
    expect(p2.photos.map((p: { id: number }) => p.id)).toEqual([ids[1], ids[0]]);
    expect(await masquerPhoto(env.DB as never, ids[0], true)).toBe(true);
    const m = await api("/api/mur", undefined, a.jeton);
    expect(m.total).toBe(MUR_PAGE + 1);
    expect((await murAdmin(env.DB as never)).masquees).toBe(1);
  });
});

describe("galerie du MJ et photos de la révélation", () => {
  it("la galerie embarque les photos, l'état écarté et l'appui long (pas en lecture seule)", async () => {
    const a = await joueur(), b = await joueur();
    const s = await scan(a, b.code);
    const { id } = await api("/api/photo", { id_client: s.id_client, image: IMAGE }, a.jeton);
    await masquerPhoto(env.DB as never, id, true);
    const html = await pageGalerie(await murAdmin(env.DB as never), false).text();
    expect(html).toContain(IMAGE);
    expect(html).toContain('"masquee":1');
    expect(html).toContain("LECTURE = false");
    expect(await pageGalerie(await murAdmin(env.DB as never), true).text()).toContain("LECTURE = true");
  });

  it("RG-009-9 : seulement les photos autorisées par leur auteur et non écartées", async () => {
    const a = await joueur(), b = await joueur(), c = await joueur();
    const img = (n: number) => "data:image/jpeg;base64," + String(n).repeat(8);
    const s1 = await scan(a, b.code), s2 = await scan(a, c.code), s3 = await scan(b, c.code);
    const p1 = await api("/api/photo", { id_client: s1.id_client, image: img(1) }, a.jeton);
    await api("/api/photo", { id_client: s2.id_client, image: img(2) }, a.jeton);
    await api("/api/photo", { id_client: s3.id_client, image: img(3) }, b.jeton);
    env.DB.sqlite.prepare("UPDATE personnages SET photos_ok = 0 WHERE id = ?").run(b.id); // b retire son accord
    expect((await photosRevelation(env.DB as never)).sort()).toEqual([img(1), img(2)]);
    await masquerPhoto(env.DB as never, p1.id, true);
    expect(await photosRevelation(env.DB as never)).toEqual([img(2)]);
    expect(JSON.parse(avecPhotos('{"noeuds":[]}', [img(2)]))).toEqual({ noeuds: [], photos: [img(2)] });
  });
});
