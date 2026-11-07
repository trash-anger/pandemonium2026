// Codes des étiquettes du jeu, tirés une fois pour toutes (scripts/codes-jeu.mjs) et commités dans
// donnees/etiquettes-jeu.csv : ils partent avec chaque déploiement (module texte, règle wrangler).
// Le bouton « Charger les codes du jeu » de l'admin les insère en base ; rejouable, jamais de doublon.
import csv from "../donnees/etiquettes-jeu.csv";
import { normaliserCode } from "./codes";

export interface CodeJeu { code: string; format: "petit" | "grand"; role: "normale" | "personnelle_mj" | "speciale_mj" }

const FORMATS = new Set(["petit", "grand"]), ROLES = new Set(["normale", "personnelle_mj", "speciale_mj"]);

export function lireCodesJeu(texte: string = csv): CodeJeu[] {
  return texte.trim().split(/\r?\n/).slice(1).map((l, i) => {
    const [brut, format, role] = l.split(",").map((x) => x.trim());
    const code = normaliserCode(brut || "");
    if (!code || code !== brut || !FORMATS.has(format) || !ROLES.has(role)) throw new Error(`etiquettes-jeu.csv, ligne ${i + 2} invalide`);
    return { code, format, role } as CodeJeu;
  });
}

/** Insère les codes absents de la base : un nouveau lot par couple format/rôle. Ne touche jamais aux existants. */
export async function chargerCodesJeu(db: D1Database, codes: CodeJeu[] = lireCodesJeu()): Promise<{ ajoutes: number; deja: number; lots: number[] }> {
  const existants = new Set((await db.prepare("SELECT code FROM etiquettes").all<{ code: string }>()).results.map((r) => r.code));
  const nouveaux = codes.filter((c) => !existants.has(c.code));
  let lot = (await db.prepare("SELECT MAX(lot) AS m FROM etiquettes").first<{ m: number | null }>())?.m ?? 0;
  const lots: number[] = [];
  const stmt = db.prepare("INSERT INTO etiquettes (code, format, role, lot) VALUES (?, ?, ?, ?)");
  for (const cle of [...new Set(nouveaux.map((c) => `${c.format}/${c.role}`))]) {
    const groupe = nouveaux.filter((c) => `${c.format}/${c.role}` === cle);
    lots.push(++lot);
    for (let i = 0; i < groupe.length; i += 100) await db.batch(groupe.slice(i, i + 100).map((c) => stmt.bind(c.code, c.format, c.role, lot)));
  }
  return { ajoutes: nouveaux.length, deja: codes.length - nouveaux.length, lots };
}
