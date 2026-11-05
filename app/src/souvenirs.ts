// Faux souvenirs (FEAT-006) : gabarits combinés, sans IA (RG-006-2), textes §3.
// Le souvenir d'une paire est toujours le même (RG-006-1), dans les deux sens (RG-006-4) :
// tous les tirages viennent d'un hash des deux identifiants triés (RG-006-5).
import { CHUTES, GABARITS, LIEUX } from "./souvenirs-textes";
import type { Langue } from "./catalogue";

export interface PersoSouvenir { id: string; pseudo: string; type: string; couleur: string; attributs: string[] }

// Formes utilisées dans les gabarits (textes §1.1 à §1.3)
const FORMES_TYPE: Record<Langue, Record<string, string>> = {
  fr: { mort_vivant: "mort-vivant", nuit: "créature de la nuit", magie: "mage", robot: "robot", animal: "bestiole", sexy: "uniforme sexy", pop: "héros de film", inclassable: "OVNI vestimentaire" },
  en: { mort_vivant: "an undead", nuit: "a night creature", magie: "a mage", robot: "a robot", animal: "a critter", sexy: "a sexy uniform", pop: "a movie hero", inclassable: "a fashion UFO" },
};
const FORMES_COULEUR: Record<Langue, Record<string, string>> = {
  fr: { noir: "noir", blanc: "blanc", argent: "argent", rouge: "rouge", orange: "orange", dore: "doré", vert: "vert", bleu: "bleu", violet: "violet", rose: "rose", brun: "brun", arc_en_ciel: "arc-en-ciel" },
  en: { noir: "black", blanc: "white", argent: "silver", rouge: "red", orange: "orange", dore: "gold", vert: "green", bleu: "blue", violet: "purple", rose: "pink", brun: "brown", arc_en_ciel: "rainbow" },
};
const FORMES_ATTR: Record<Langue, Record<string, string>> = {
  fr: {
    masque: "un masque", maquillage: "du maquillage", perruque: "une perruque", cornes: "des cornes", ailes: "des ailes", chapeau: "un chapeau",
    lumieres: "des LED", sang: "du faux sang", accessoire: "un accessoire louche", cape: "une cape", paillettes: "des paillettes", queue: "une queue",
    lunettes: "des lunettes", couronne: "une couronne", crocs: "des crocs", armure: "une armure", arme: "une arme en plastique", plumes: "des plumes",
    latex: "du latex", chaines: "des chaînes", tatouages: "des tatouages", tentacules: "des tentacules", integral: "une combinaison intégrale", pancarte: "une pancarte",
  },
  en: {
    masque: "a mask", maquillage: "face paint", perruque: "a wig", cornes: "horns", ailes: "wings", chapeau: "a hat",
    lumieres: "LEDs", sang: "fake blood", accessoire: "a suspicious accessory", cape: "a cape", paillettes: "glitter", queue: "a tail",
    lunettes: "glasses", couronne: "a crown", crocs: "fangs", armure: "armour", arme: "a plastic weapon", plumes: "feathers",
    latex: "latex", chaines: "chains", tatouages: "tattoos", tentacules: "tentacles", integral: "a full-body suit", pancarte: "a sign",
  },
};
const SANS_ATTRIBUT: Record<Langue, string> = { fr: "un costume qui n'avait pas encore été inventé", en: "an outfit that hadn't been invented yet" };

/** FNV-1a 32 bits puis mélange final : rapide, stable et identique sur tous les appareils. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Mélange final (murmur3) : sans lui, les tirages d'une même paire sont corrélés entre eux
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Graine de la paire, indépendante de l'ordre. */
export const grainePaire = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const tirer = (graine: string, sel: string, n: number) => hash(`${graine}#${sel}`) % n;

export function fauxSouvenir(x: PersoSouvenir, y: PersoSouvenir, l: Langue): string {
  const [A, B] = x.id < y.id ? [x, y] : [y, x];
  const g = grainePaire(A.id, B.id);
  const attr = (p: PersoSouvenir, sel: string, eviter?: string) => {
    const choix = p.attributs.filter((a) => FORMES_ATTR[l][a] && a !== eviter);
    if (!choix.length) return p.attributs.find((a) => FORMES_ATTR[l][a]) ?? null;
    return choix[tirer(g, sel, choix.length)];
  };
  const attrA = attr(A, "attrA");
  const attrB = attr(B, "attrB", attrA ?? undefined); // pas « un masque contre un masque » si on peut l'éviter
  const forme = (a: string | null) => (a ? FORMES_ATTR[l][a] : SANS_ATTRIBUT[l]);
  const v: Record<string, string> = {
    A: A.pseudo, B: B.pseudo,
    attr_A: forme(attrA), attr_B: forme(attrB),
    type_A: FORMES_TYPE[l][A.type] ?? FORMES_TYPE[l].inclassable, type_B: FORMES_TYPE[l][B.type] ?? FORMES_TYPE[l].inclassable,
    couleur_A: FORMES_COULEUR[l][A.couleur] ?? "", couleur_B: FORMES_COULEUR[l][B.couleur] ?? "",
    annee: String(1987 + tirer(g, "annee", 2019 - 1987 + 1)),
    lieu: LIEUX[l][tirer(g, "lieu", LIEUX[l].length)],
    chute: CHUTES[l][tirer(g, "chute", CHUTES[l].length)],
  };
  const gabarit = GABARITS[l][tirer(g, "gabarit", GABARITS[l].length)];
  return gabarit.replace(/\{(\w+)\}/g, (m, k: string) => v[k] ?? m);
}

/**
 * Jauge de souvenirs (barème §3, DEC-031) : sous le seuil, la moitié des faux souvenirs du joueur
 * deviennent flous ; à 0, tous. La moitié concernée dépend de la paire, pour rester stable.
 */
export function estFlou(jauge: number, seuil: number, graine: string): boolean {
  if (jauge <= 0) return true;
  return jauge < seuil && hash(`${graine}#flou`) % 2 === 0;
}

/** Texte partiellement effacé (`▒▒▒`) : un mot sur deux environ, toujours les mêmes. */
export function brouiller(texte: string, graine: string): string {
  let i = 0;
  return texte.replace(/[\p{L}\d'’-]{3,}/gu, (mot) => (hash(`${graine}#${i++}`) % 5 < 3 ? "▒".repeat(Math.min(mot.length, 6)) : mot));
}
