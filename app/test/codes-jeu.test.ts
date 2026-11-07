// Codes du jeu commités (donnees/etiquettes-jeu.csv) : valides, au bon stock, chargés sans doublon.
import { describe, expect, it } from "vitest";
import { chargerCodesJeu, lireCodesJeu } from "../src/codes-jeu";
import { d1Memoire } from "./d1-memoire";

describe("codes du jeu", () => {
  it("le CSV livré contient le stock prévu, sans doublon ni code du banc", () => {
    const c = lireCodesJeu();
    const n = (f: string, r: string) => c.filter((x) => x.format === f && x.role === r).length;
    expect([n("petit", "normale"), n("petit", "personnelle_mj"), n("petit", "speciale_mj")]).toEqual([874, 1, 15]);
    expect(c.length).toBe(890); // un seul format sur papier
    expect(new Set(c.map((x) => x.code)).size).toBe(c.length);
    expect(c.some((x) => x.code.startsWith("0"))).toBe(false);
  });

  it("refuse une ligne invalide", () => {
    expect(() => lireCodesJeu("code,format,role\nAB0D,petit,normale\n")).toThrow(/ligne 2/);
    expect(() => lireCodesJeu("code,format,role\nABCD,moyen,normale\n")).toThrow();
  });

  it("charge une fois, puis n'ajoute plus rien ; garde les étiquettes déjà réclamées", async () => {
    const db = d1Memoire();
    db.sqlite.exec("INSERT INTO etiquettes (code, format, role, lot) VALUES ('ZZZZ', 'petit', 'normale', 3)");
    const codes = lireCodesJeu("code,format,role\nABCD,grand,personnelle_mj\nBCDE,petit,normale\nCDEF,petit,normale\n");
    expect(await chargerCodesJeu(db as never, codes)).toEqual({ ajoutes: 3, deja: 0, lots: [4, 5] });
    db.sqlite.exec("UPDATE etiquettes SET etat = 'reclamee' WHERE code = 'BCDE'");
    expect(await chargerCodesJeu(db as never, codes)).toEqual({ ajoutes: 0, deja: 3, lots: [] });
    expect(db.sqlite.prepare("SELECT etat, lot FROM etiquettes WHERE code = 'BCDE'").get()).toEqual({ etat: "reclamee", lot: 5 });
  });
});
