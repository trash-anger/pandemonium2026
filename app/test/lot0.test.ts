import { describe, expect, it } from "vitest";
import { ALPHABET, genererCodes, normaliserCode, tirerCode, urlQr } from "../src/codes";
import { csvNiimbot } from "../src/csv";
import { localVersIso } from "../src/temps";
import { signer, verifier } from "../src/auth";

describe("codes (RG-001-3, RG-001-4)", () => {
  it("utilise 31 symboles sans 0, O, 1, I, L", () => {
    expect(ALPHABET).toHaveLength(31);
    for (const c of "0O1IL") expect(ALPHABET).not.toContain(c);
  });

  it("tire des codes de 4 caractères valides", () => {
    for (let i = 0; i < 1000; i++) {
      const c = tirerCode();
      expect(c).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/);
    }
  });

  it("CA-001-1 : génère N codes distincts, absents des existants", () => {
    const existants = new Set(genererCodes(500, new Set()));
    const nouveaux = genererCodes(900, existants);
    expect(new Set(nouveaux).size).toBe(900);
    for (const c of nouveaux) expect(existants.has(c)).toBe(false);
  });

  it("CA-001-3 : la saisie manuelle retrouve le même code", () => {
    expect(normaliserCode("7kc3")).toBe("7KC3");
    expect(normaliserCode(" 7K C3 ")).toBe("7KC3");
    expect(normaliserCode("7KC")).toBeNull();
    expect(normaliserCode("7KO3")).toBeNull(); // O exclu
    expect(normaliserCode("ADMIN")).toBeNull();
  });

  it("encode une URL courte en majuscules (CT-007)", () => {
    expect(urlQr("7KC3")).toBe("HTTPS://P.UYT.RE/7KC3");
  });
});

describe("export Niimbot", () => {
  it("produit un CSV code,url", () => {
    expect(csvNiimbot(["7KC3", "M4XR"])).toBe("code,url\r\n7KC3,HTTPS://P.UYT.RE/7KC3\r\nM4XR,HTTPS://P.UYT.RE/M4XR\r\n");
  });
});

describe("heures de Montréal", () => {
  it("convertit 21 h le 7 novembre 2026 (heure normale, UTC−5)", () => {
    expect(localVersIso("2026-11-07T21:00")).toBe("2026-11-08T02:00:00.000Z");
  });
  it("refuse un format invalide", () => {
    expect(() => localVersIso("21:00")).toThrow();
  });
});

describe("session du MJ", () => {
  it("vérifie un jeton signé et refuse un jeton altéré", async () => {
    const j = await signer("secret", { email: "mj@example.com", exp: 1 });
    expect(await verifier("secret", j)).toEqual({ email: "mj@example.com", exp: 1 });
    expect(await verifier("autre", j)).toBeNull();
    expect(await verifier("secret", j.replace(/^./, "x"))).toBeNull();
  });
});

import { roleDe } from "../src/auth";
describe("rôles du panneau", () => {
  const env = { PUBLIC_ORIGIN: "https://p.uyt.re", ADMIN_EMAILS: "mj@x.com", LECTEURS_EMAILS: "aide@x.com, autre@x.com" };
  it("distingue MJ, lecteur et inconnu", () => {
    expect(roleDe(env, "mj@x.com")).toBe("mj");
    expect(roleDe(env, "autre@x.com")).toBe("lecteur");
    expect(roleDe(env, "inconnu@x.com")).toBeNull();
  });
});

describe("jetons signés", () => {
  it("préservent les caractères non ASCII (pseudos)", async () => {
    const j = await signer("s", { pseudo: "Écru −40 %" });
    expect(await verifier("s", j)).toEqual({ pseudo: "Écru −40 %" });
  });
});

import { devActif } from "../src/mode";
describe("banc d'essai", () => {
  it("n'est jamais actif en production, même avec BANC=actif", () => {
    expect(devActif({ PUBLIC_ORIGIN: "https://p.uyt.re", BANC: "actif" } as never)).toBe(false);
    expect(devActif({ PUBLIC_ORIGIN: "https://p.uyt.re" } as never)).toBe(false);
    expect(devActif({ PUBLIC_ORIGIN: "https://deja-vu-apercu.uyt-re.workers.dev", BANC: "actif" } as never)).toBe(true);
    expect(devActif({ PUBLIC_ORIGIN: "http://localhost:8787" } as never)).toBe(true);
  });
});
