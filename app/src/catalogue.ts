// Listes fermées de la création du personnage (FEAT-003, textes §1).
// Les libellés affichés sont dans public/app.js ; ici, seulement les identifiants
// et ce dont le serveur a besoin (pseudo, tirages).

export const TYPES = ["mort_vivant", "nuit", "magie", "robot", "animal", "sexy", "pop", "inclassable"] as const;
export const COULEURS = ["noir", "blanc", "argent", "rouge", "orange", "dore", "vert", "bleu", "violet", "rose", "brun", "arc_en_ciel"] as const;
export const ATTRIBUTS = ["masque", "maquillage", "perruque", "cornes", "ailes", "chapeau", "lumieres", "sang", "accessoire", "cape", "paillettes", "queue",
  "lunettes", "couronne", "crocs", "armure", "arme", "plumes", "latex", "chaines", "tatouages", "tentacules", "integral", "pancarte",
] as const;
/** Les 12 premiers sont affichés d'office ; les suivants derrière « Charger plus ». */
export const NB_ATTRIBUTS_BASE = 12;
export const FACTIONS = ["ordre", "chaos", "friperie", "influence", "necro"] as const;
export const CLASSES = ["barbare", "barde", "clerc", "druide", "magicien", "paladin", "rodeur", "voleur"] as const;

// Identifiants des badges (FEAT-015) ; libellés et conditions dans public/app.js (textes §1.6)
export const BADGES = [
  "tueur_de_poussin", "achat_compulsif", "surconsommation", "trans_classe", "installe_portail", "boucle_detectee",
  "jour_marmotte", "client_maudit", "jumeaux_retrouves", "fermer_boucle", "patient_zero", "dernier_survivant",
  "amnesie", "serie_complete", "triples_partiels", "garde_robe_mj", "anticapitaliste", "employe_du_mois", "client_difficile", "collegue_de_rayon",
] as const;

export type Langue = "fr" | "en";

// Pseudo : « nom du type » + « coloris catalogue » + démarque (« Vampire Bordeaux −40 % »).
// Noms épicènes ou d'objets, coloris invariables : rien ne dépend du genre du joueur (textes, règle d'écriture).
const NOMS: Record<Langue, Record<(typeof TYPES)[number], string[]>> = {
  fr: {
    mort_vivant: ["Zombie", "Momie", "Squelette", "Fantôme", "Liche"],
    nuit: ["Vampire", "Goule", "Chauve-souris", "Créature", "Succube"],
    magie: ["Mage", "Elfe", "Grimoire", "Potion", "Baguette"],
    robot: ["Cyborg", "Androïde", "Alien", "Hologramme", "Robot"],
    animal: ["Licorne", "Chat", "Dino", "Bestiole", "Pieuvre"],
    sexy: ["Uniforme", "Corset", "Képi", "Talon aiguille", "Latex"],
    pop: ["Blockbuster", "Spoiler", "Caméo", "Reboot", "Cliffhanger"],
    inclassable: ["OVNI", "Concept", "Jeu de mots", "Objet", "Malentendu"],
  },
  en: {
    mort_vivant: ["Zombie", "Mummy", "Skeleton", "Ghost", "Lich"],
    nuit: ["Vampire", "Ghoul", "Bat", "Creature", "Succubus"],
    magie: ["Mage", "Elf", "Grimoire", "Potion", "Wand"],
    robot: ["Cyborg", "Android", "Alien", "Hologram", "Robot"],
    animal: ["Unicorn", "Cat", "Dino", "Critter", "Octopus"],
    sexy: ["Uniform", "Corset", "Kepi", "Stiletto", "Latex"],
    pop: ["Blockbuster", "Spoiler", "Cameo", "Reboot", "Cliffhanger"],
    inclassable: ["UFO", "Concept", "Pun", "Object", "Misunderstanding"],
  },
};

const COLORIS: Record<Langue, Record<(typeof COULEURS)[number], string>> = {
  fr: { noir: "Charbon", blanc: "Écru", argent: "Chrome", rouge: "Bordeaux", orange: "Citrouille", dore: "Champagne", vert: "Kaki", bleu: "Marine", violet: "Prune", rose: "Fuchsia", brun: "Caramel", arc_en_ciel: "Arc-en-ciel" },
  en: { noir: "Charcoal", blanc: "Ivory", argent: "Chrome", rouge: "Burgundy", orange: "Pumpkin", dore: "Champagne", vert: "Khaki", bleu: "Navy", violet: "Plum", rose: "Fuchsia", brun: "Caramel", arc_en_ciel: "Rainbow" },
};

const DEMARQUES = [10, 20, 30, 40, 50, 60, 70, 80, 90];

export function hasard(n: number): number {
  const b = new Uint32Array(1);
  crypto.getRandomValues(b);
  return b[0] % n;
}
export const auHasard = <T>(l: readonly T[]): T => l[hasard(l.length)];

export function genererPseudo(type: string, couleur: string, l: Langue): string {
  const noms = NOMS[l][type as (typeof TYPES)[number]] ?? NOMS[l].inclassable;
  const coloris = COLORIS[l][couleur as (typeof COULEURS)[number]] ?? "";
  const d = auHasard(DEMARQUES);
  return `${auHasard(noms)} ${coloris} −${d}${l === "fr" ? " %" : "%"}`;
}

/** Tirage pondéré (RG-011-2) : plus une faction a de membres, moins elle a de chances. */
export function tirerFaction(effectifs: Record<string, number>, permises: readonly string[] = FACTIONS): string {
  const poids = permises.map((f) => 1 / (1 + (effectifs[f] ?? 0)));
  const total = poids.reduce((a, b) => a + b, 0);
  let x = (hasard(1_000_000) / 1_000_000) * total;
  for (let i = 0; i < permises.length; i++) {
    x -= poids[i];
    if (x < 0) return permises[i];
  }
  return permises[permises.length - 1];
}
