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
  prereglage: "rapide", // barème §0
  jumeaux: { paires: 45, triples: 10, seuil_activations: 60, fenetre_scan_mutuel_s: 90, indice_toutes_min: 10 },
  chats_noirs: { joueurs_par_chat: 50 },
  contagion: { transmission: 0.6, corruption_min: 10, immunite: 0.8, immunite_min: [20, 40, 60] },
  legendaires: { melange_min: 20, dernier_exemplaire: ["21:00", "00:00", "03:00"] },
  pieges: { blocage_min: [1, 5] },
  surconsommation: { max_factions: 3 },
};

export type Heures = typeof HEURES_PAR_DEFAUT;

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
