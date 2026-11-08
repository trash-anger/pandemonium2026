// Après la fête : tout mène à la page de fin ; l'admin reste ; analytics sans cookie.
import { beforeEach, describe, expect, it } from "vitest";
import worker from "../src/index";
import { d1Memoire } from "./d1-memoire";
import { signer } from "../src/auth";
import { appareilDe, sourceDe } from "../src/fin";
import { tableauAnalytics } from "../src/analytics";
import { pageAnalytics } from "../src/pages";

const T = Date.now();
let env: Record<string, unknown> & { DB: ReturnType<typeof d1Memoire> };
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";

const appel = (url: string, init: RequestInit = {}) => worker.fetch(new Request(url, init), env as never);
const visite = (corps: object, ua = IPHONE, hote = "https://p.uyt.re", ip = "1.2.3.4", cookie?: string) =>
  appel(`${hote}/fin/v`, { method: "POST", body: JSON.stringify(corps), headers: { "User-Agent": ua, "CF-Connecting-IP": ip, "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) } })
    .then((r) => r.json() as Promise<{ id: string | null }>);
const ligne = (id: string) => env.DB.sqlite.prepare("SELECT * FROM visites WHERE id = ?").get(id) as Record<string, unknown>;

beforeEach(() => {
  env = { DB: d1Memoire(), PUBLIC_ORIGIN: "https://p.uyt.re", SESSION_SECRET: "s", ADMIN_EMAILS: "mj@exemple.org" };
  env.DB.sqlite.prepare("INSERT INTO etiquettes (code, format, role, lot) VALUES ('53DZ', 'grand', 'personnelle_mj', 1)").run();
});

describe("page de fin", () => {
  it("toutes les adresses mènent à la page, sur les deux domaines", async () => {
    for (const u of ["https://p.uyt.re/", "https://p.uyt.re/53DZ", "https://p.uyt.re/collection", "https://p.uyt.re/n/importe/quoi", "https://pandemonium2026.uyt.re/", "https://pandemonium2026.uyt.re/?phase=apres"]) {
      const r = await appel(u);
      expect(r.status, u).toBe(200);
      const h = await r.text();
      expect(h).toContain("242");
      expect(h).toContain('property="og:title" content="Déjà vu ! · 242 nouvelles amitiés !!!"');
    }
    expect((await appel("https://p.uyt.re/og.png")).headers.get("Content-Type")).toBe("image/png");
    expect((await appel("https://pandemonium2026.uyt.re/og.png")).status).toBe(200);
  });

  it("l'API du jeu est fermée ; l'admin reste, et l'ancien teaser y renvoie vers p.uyt.re", async () => {
    expect((await appel("https://p.uyt.re/api/moi")).status).toBe(410);
    expect((await appel("https://p.uyt.re/admin")).status).toBe(200); // page de connexion
    const r = await appel("https://pandemonium2026.uyt.re/admin/analytics");
    expect(r.status).toBe(302);
    expect(r.headers.get("Location")).toBe("https://p.uyt.re/admin/analytics");
  });

  it("photos : seulement celles de la révélation", async () => {
    const r = await appel("https://p.uyt.re/fin/photos.json");
    expect(await r.json()).toEqual({ photos: [] });
  });
});

describe("analytics", () => {
  it("une visite par une étiquette scannée : provenance, appareil, durée, clics", async () => {
    const { id } = await visite({ chemin: "/53dz", recherche: "", referent: "", langue: "fr-CA", app: true, ecran: "390x844" });
    expect(ligne(id!)).toMatchObject({ code: "53DZ", source: "etiquette", appareil: "Mobile", os: "iOS", navigateur: "Safari", app: 1, langue: "fr-ca", bot: 0 });
    await appel("https://p.uyt.re/fin/f", { method: "POST", body: JSON.stringify({ id, duree: 42_000, defilement: 100 }) });
    await appel("https://p.uyt.re/fin/f", { method: "POST", body: JSON.stringify({ id, duree: 12_000, defilement: 10 }) }); // ne recule pas
    expect(ligne(id!)).toMatchObject({ duree_ms: 42_000, defilement: 100 });
    for (const type of ["partage", "copie", "pandemonium", "pirate"]) await appel("https://p.uyt.re/fin/e", { method: "POST", body: JSON.stringify({ id, type }) });
    expect(env.DB.sqlite.prepare("SELECT COUNT(*) AS n FROM clics_fin").get()).toEqual({ n: 3 });
  });

  it("sources : réseaux, recherche, campagne, ancien teaser ; robots marqués ; aucune IP stockée", async () => {
    const a = await visite({ chemin: "/", referent: "https://l.facebook.com/x" });
    const b = await visite({ chemin: "/", referent: "https://www.google.ca/" });
    const c = await visite({ chemin: "/", recherche: "?utm_source=insta&utm_campaign=bilan" });
    const d = await visite({ chemin: "/" }, MAC, "https://pandemonium2026.uyt.re");
    const e = await visite({ chemin: "/" }, "facebookexternalhit/1.1");
    expect([a, b, c, d].map((x) => ligne(x.id!).source)).toEqual(["reseaux", "recherche", "campagne", "teaser"]);
    expect(ligne(d.id!)).toMatchObject({ appareil: "Ordinateur", os: "macOS", navigateur: "Chrome" });
    expect(ligne(e.id!).bot).toBe(1);
    expect(JSON.stringify(env.DB.sqlite.prepare("SELECT * FROM visites").all())).not.toContain("1.2.3.4");
  });

  it("le MJ connecté ne se compte pas", async () => {
    const jeton = await signer("s", { email: "mj@exemple.org", exp: Math.floor(Date.now() / 1000) + 3600 });
    expect((await visite({ chemin: "/" }, IPHONE, "https://p.uyt.re", "1.2.3.4", `dv_mj=${jeton}`)).id).toBeNull();
  });

  it("tableau : totaux, visiteurs uniques par jour, robots écartés, page rendue", async () => {
    await visite({ chemin: "/" }, IPHONE, "https://p.uyt.re", "1.1.1.1");
    await visite({ chemin: "/" }, IPHONE, "https://p.uyt.re", "1.1.1.1"); // même personne, même jour
    await visite({ chemin: "/53DZ" }, MAC, "https://p.uyt.re", "2.2.2.2");
    await visite({ chemin: "/" }, "Googlebot/2.1");
    const t = await tableauAnalytics(env.DB as never, "24h", T + 1000);
    expect({ vues: t.vues, visiteurs: t.visiteurs, robots: t.robots }).toEqual({ vues: 3, visiteurs: 2, robots: 1 });
    expect(t.courbe.points.reduce((s, p) => s + p.vues, 0)).toBe(3);
    expect(t.etiquettes).toEqual([{ cle: "53DZ", n: 1 }]);
    const h = await pageAnalytics(t).text();
    expect(h).toContain("Étiquette QR scannée");
    expect(h).toContain('aria-current="page"><span>📈</span>Stats');
  });
});
