// Codes fixes du banc : étiquettes numérotées 0001, 0002… à imprimer une fois pour toutes (planche PDF,
// scripts/planche-banc.mjs). Ils commencent tous par 0, chiffre absent des vrais codes (ALPHABET) : aucune
// collision possible. Ils n'existent qu'en local et sur l'aperçu, jamais en production (/__dev/codes-fixes).
// Module sans dépendance : le script de la planche l'importe directement avec Node.

export type GroupeFixe = "joueur" | "mj" | "legendaire" | "piege" | "vierge" | "retiree" | "inconnue";

export interface CodeFixe {
  code: string;
  groupe: GroupeFixe;
  /** Absente pour un code volontairement inconnu de la base. */
  role?: "normale" | "personnelle_mj" | "speciale_mj";
  etat?: "vierge" | "reclamee" | "desactivee";
  /** Légendaire ou piège porté en permanence (pas de mélange toutes les 20 min). */
  effet?: string;
  /** Personnage fixe qui possède l'étiquette. */
  personnage?: PersoFixe;
}

export interface PersoFixe {
  id: string;
  nom: string;
  type: string;
  couleur: string;
  faction: string;
  classe: string;
  mj: boolean;
}

export const PIN_FIXE = "1234";

const perso = (n: number, type: string, couleur: string, faction: string, classe: string): PersoFixe =>
  ({ id: `fixe-${n}`, nom: `Joueur ${n}`, type, couleur, faction, classe, mj: false });

export const PERSOS_FIXES: PersoFixe[] = [
  perso(1, "nuit", "rouge", "ordre", "barde"),
  perso(2, "robot", "argent", "chaos", "magicien"),
  perso(3, "animal", "vert", "friperie", "rodeur"),
  perso(4, "pop", "rose", "influence", "voleur"),
  { id: "fixe-mj", nom: "MJ", type: "inclassable", couleur: "noir", faction: "necro", classe: "clerc", mj: true },
];

const num = (n: number) => String(n).padStart(4, "0");

export const CODES_FIXES: CodeFixe[] = [
  // 0001 à 0004 : les 4 joueurs fixes ; 0005 : le MJ
  ...PERSOS_FIXES.map((p, i): CodeFixe => ({
    code: num(i + 1), groupe: p.mj ? "mj" : "joueur", role: p.mj ? "personnelle_mj" : "normale", etat: "reclamee", personnage: p,
  })),
  // 0011 à 0020 : L-1 à L-10 ; 0021 à 0025 : T-1 à T-5
  ...Array.from({ length: 10 }, (_, i): CodeFixe => ({ code: num(11 + i), groupe: "legendaire", role: "speciale_mj", etat: "vierge", effet: `L-${i + 1}` })),
  ...Array.from({ length: 5 }, (_, i): CodeFixe => ({ code: num(21 + i), groupe: "piege", role: "speciale_mj", etat: "vierge", effet: `T-${i + 1}` })),
  // 0031 à 0042 : vierges, pour créer des personnages ou ajouter une étiquette
  ...Array.from({ length: 12 }, (_, i): CodeFixe => ({ code: num(31 + i), groupe: "vierge", role: "normale", etat: "vierge" })),
  { code: "0051", groupe: "retiree", role: "normale", etat: "desactivee" },
  { code: "0099", groupe: "inconnue" },
];

/** Effet permanent des codes fixes spéciaux (remplace le mélange pour ces seules étiquettes). */
export const EFFETS_FIXES: ReadonlyMap<string, string> = new Map(CODES_FIXES.filter((c) => c.effet).map((c) => [c.code, c.effet!]));

/** Forme des codes du banc : 0 suivi de 3 chiffres. */
export const FORME_CODE_BANC = /^0\d{3}$/;
