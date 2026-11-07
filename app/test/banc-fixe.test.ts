// Codes fixes du banc (0001, 0002…) : planche imprimée une fois, rejouable en local et sur l'aperçu.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CODES_FIXES } from "../src/banc-fixe";
import { normaliserCode } from "../src/codes";
import { routeDev } from "../src/dev";
import { attribution } from "../src/mj";
import { localVersIso } from "../src/temps";
import { d1Memoire } from "./d1-memoire";

vi.mock("../banc/banc.html", () => ({ default: "" })); // page du banc : texte importé par wrangler, inutile ici

let env: { DB: ReturnType<typeof d1Memoire>; PUBLIC_ORIGIN: string; BANC_SESSION: boolean; BANC?: string };
const installer = async () => {
  const r = await routeDev(new Request("http://localhost/__dev/codes-fixes", { method: "POST", body: "{}" }), env as never, new URL("http://localhost/__dev/codes-fixes"));
  return { status: r!.status, corps: (await r!.json()) as Record<string, unknown> };
};
const ligne = (code: string) => env.DB.sqlite.prepare("SELECT role, etat, personnage_id, faction_id, banc FROM etiquettes WHERE code = ?").get(code) as Record<string, unknown> | undefined;

beforeEach(() => { env = { DB: d1Memoire(), PUBLIC_ORIGIN: "http://localhost:8787", BANC_SESSION: true }; });

describe("Codes fixes du banc", () => {
  it("les codes 0xxx sont acceptés ; les vrais codes ne contiennent jamais de 0", () => {
    expect(normaliserCode("0001")).toBe("0001");
    expect(normaliserCode(" 00 42 ")).toBe("0042");
    expect(normaliserCode("1001")).toBeNull();
    expect(normaliserCode("0O01")).toBeNull();
    expect(new Set(CODES_FIXES.map((c) => c.code)).size).toBe(CODES_FIXES.length);
  });

  it("installe les étiquettes et les 5 personnages, rejouable sans doublon", async () => {
    expect(await installer()).toEqual({ status: 200, corps: { etiquettes: 33, personnages_crees: 5 } });
    expect(ligne("0001")).toMatchObject({ role: "normale", etat: "reclamee", personnage_id: "fixe-1", faction_id: "ordre", banc: 1 });
    expect(ligne("0005")).toMatchObject({ role: "personnelle_mj", etat: "reclamee", personnage_id: "fixe-mj" });
    expect(env.DB.sqlite.prepare("SELECT est_mj FROM personnages WHERE id = 'fixe-mj'").get()).toEqual({ est_mj: 1 });
    expect(ligne("0013")).toMatchObject({ role: "speciale_mj", etat: "vierge" });
    expect(ligne("0031")).toMatchObject({ role: "normale", etat: "vierge" });
    expect(ligne("0051")).toMatchObject({ etat: "desactivee" });
    expect(ligne("0099")).toBeUndefined();

    // Une vierge réclamée pendant un essai le reste ; le personnage fixe effacé revient
    env.DB.sqlite.exec("UPDATE etiquettes SET etat = 'reclamee', personnage_id = 'fixe-2' WHERE code = '0031'");
    env.DB.sqlite.exec("UPDATE etiquettes SET etat = 'vierge', personnage_id = NULL WHERE code = '0003'; DELETE FROM personnages WHERE id = 'fixe-3'");
    expect((await installer()).corps).toEqual({ etiquettes: 33, personnages_crees: 1 });
    expect(ligne("0031")).toMatchObject({ etat: "reclamee", personnage_id: "fixe-2" });
    expect(ligne("0003")).toMatchObject({ etat: "reclamee", personnage_id: "fixe-3" });
    expect((env.DB.sqlite.prepare("SELECT COUNT(*) AS n FROM etiquettes").get() as { n: number }).n).toBe(33);
  });

  it("0011 à 0025 portent toujours leur légendaire ou leur piège ; les autres étiquettes du banc gardent le mélange", async () => {
    await installer();
    env.DB.sqlite.exec("INSERT INTO etiquettes (code, format, role, lot, banc) VALUES ('ABCD', 'grand', 'speciale_mj', 9, 1)");
    for (const t of [Date.UTC(2026, 10, 8, 3), Date.UTC(2026, 10, 8, 7)]) {
      const a = await attribution(env as never, t);
      expect(a.effets.get("0011")).toBe("L-1");
      expect(a.effets.get("0020")).toBe("L-10");
      expect(a.effets.get("0023")).toBe("T-3");
      expect(a.effets.get("ABCD")).toMatch(/^[LT]-\d+$/);
    }
  });

  it("refusé en production", async () => {
    env.PUBLIC_ORIGIN = "https://p.uyt.re";
    expect((await installer()).status).toBe(403);
    expect(ligne("0001")).toBeUndefined();
  });

  it("soirée en heure réelle : il est maintenant 23 h 58, minuit dans 2 min, mêmes écarts entre les heures", async () => {
    const r = await routeDev(new Request("http://localhost/__dev/soiree", { method: "POST", body: JSON.stringify({ a: "23:58" }) }), env as never, new URL("http://localhost/__dev/soiree"));
    const { heures: h } = (await r!.json()) as { heures: Record<string, string> };
    const ms = (k: string) => Date.parse(localVersIso(h[k]));
    expect(Math.abs(ms("minuit") - Date.now() - 2 * 60_000)).toBeLessThan(61_000);
    expect(ms("minuit") - ms("debut")).toBe(3 * 3600_000);
    expect(ms("fin") - ms("revelation")).toBe(3600_000);
  });
});
