// Valeurs par défaut des réglages du MJ (ADM-2, ADM-3).
// Elles viennent des specs publiques ; tout est modifiable dans l'admin.
// Les heures sont en heure de Montréal (America/Toronto).

export const FUSEAU = "America/Toronto";

export const HEURES_PAR_DEFAUT = {
  debut: "2026-11-07T21:00",      // ouverture du jeu
  minuit: "2026-11-08T00:00",     // fin des modifications, indices des jumeaux
  classe: "2026-11-08T01:00",     // fin du changement de classe (DEC-078)
  jumeaux: "2026-11-08T02:00",    // tous les jumeaux attribués (DEC-055)
  revelation: "2026-11-08T05:00", // révélation (DEC-018)
  fin: "2026-11-08T06:00",
};

export const PARAMETRES_PAR_DEFAUT = {
  prereglage: "rapide", // barème §0 : lent, normal, rapide, tres_rapide
  bareme: {} as Partial<Bareme>, // saisies manuelles, prioritaires sur le préréglage (ADM-15)
  jumeaux: { paires: 45, triples: 10, seuil_activations: 60, fenetre_scan_mutuel_s: 90, indice_toutes_min: 10 },
  chats_noirs: { joueurs_par_chat: 50, minimum_joueurs: 10 },
  contagion: { transmission: 0.6, corruption_min: 10, immunite: 0.8, immunite_min: [20, 40, 60], immunite_parts: [0.8, 0.1, 0.1], seuil_degressif: 0.5, corruption_min_plancher: 3 },
  legendaires: { melange_min: 20, dernier_exemplaire: ["21:00", "00:00", "03:00"] },
  pieges: { blocage_min: [1, 5] },
  surconsommation: { max_factions: 3 },
  // Barème §3 (DEC-031) : jauge de départ, rescans faits par heure glissante avant de perdre des souvenirs, seuil du flou
  memoire: { depart: 10, seuil_flou: 5 }, // rescans par heure : voir le barème
  // RG-005-3 : un rescan d'une même paire ne compte qu'une fois par fenêtre (minutes)
  rescan: { fenetre_min: 5 },
};

export type Heures = typeof HEURES_PAR_DEFAUT;

// Préréglages du barème (barème §0, ADM-15). « Rapide » est celui de départ.
export const PREREGLAGES = {
  lent:        { cartes_par_joueur: 8, paliers: [150, 600, 1200, 2000, 3000],    rescan_quete: 0.5,  rescans_par_heure: 15, boucle_infinie: 15, fantome: 10, transmission: 0.7 },
  normal:      { cartes_par_joueur: 15, paliers: [250, 1000, 2000, 3500, 5000],   rescan_quete: 0.25, rescans_par_heure: 10, boucle_infinie: 20, fantome: 15, transmission: 0.6 },
  rapide:      { cartes_par_joueur: 25, paliers: [500, 2000, 4000, 6500, 9000],   rescan_quete: 0.25, rescans_par_heure: 10, boucle_infinie: 30, fantome: 25, transmission: 0.6 },
  tres_rapide: { cartes_par_joueur: 40, paliers: [800, 3000, 6000, 10000, 14000], rescan_quete: 0.1,  rescans_par_heure: 8,  boucle_infinie: 40, fantome: 35, transmission: 0.5 },
};
export type NomPrereglage = keyof typeof PREREGLAGES;
export type Bareme = (typeof PREREGLAGES)["normal"];

/** Barème en vigueur : le préréglage actif, complété par les saisies manuelles du MJ. */
export function baremeDe(p: { prereglage?: string; bareme?: Partial<Bareme> }): Bareme & { prereglage: NomPrereglage } {
  const nom = (p.prereglage && p.prereglage in PREREGLAGES ? p.prereglage : "rapide") as NomPrereglage;
  return { ...PREREGLAGES[nom], ...(p.bareme ?? {}), prereglage: nom };
}

export const CLES_CONFIG = {
  heures: HEURES_PAR_DEFAUT,
  parametres: PARAMETRES_PAR_DEFAUT,
} as const;

export type CleConfig = keyof typeof CLES_CONFIG;

export async function lireConfig(db: D1Database, cle: CleConfig): Promise<unknown> {
  const ligne = await db.prepare("SELECT valeur FROM config WHERE cle = ?").bind(cle).first<{ valeur: string }>();
  return ligne ? JSON.parse(ligne.valeur) : CLES_CONFIG[cle];
}

export async function ecrireConfig(db: D1Database, cle: CleConfig, valeur: unknown): Promise<void> {
  await db
    .prepare(
      "INSERT INTO config (cle, valeur) VALUES (?, ?) ON CONFLICT (cle) DO UPDATE SET valeur = excluded.valeur, modifie_le = datetime('now')",
    )
    .bind(cle, JSON.stringify(valeur))
    .run();
}

/** Paramètres enregistrés, complétés par les valeurs par défaut des sections ajoutées depuis (ex. memoire au LOT-2). */
export async function lireParametres(db: D1Database): Promise<typeof PARAMETRES_PAR_DEFAUT> {
  const p = ((await lireConfig(db, "parametres")) ?? {}) as Partial<typeof PARAMETRES_PAR_DEFAUT>;
  const r: Record<string, unknown> = { ...PARAMETRES_PAR_DEFAUT };
  for (const [k, v] of Object.entries(p)) {
    const d = (PARAMETRES_PAR_DEFAUT as Record<string, unknown>)[k];
    r[k] = d && typeof d === "object" && !Array.isArray(d) && v && typeof v === "object" ? { ...d, ...v } : v;
  }
  return r as typeof PARAMETRES_PAR_DEFAUT;
}
