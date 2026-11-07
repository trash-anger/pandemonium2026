// Banc d'essai (page /banc, API /__dev/*, horloge simulée) : toujours derrière la connexion Google.
// index.ts pose BANC_SESSION sur la requête quand la personne connectée y a droit :
//  - local et aperçu des PR (BANC=actif) : MJ et lecteur ;
//  - production (p.uyt.re) : fermé à tout le monde, MJ compris (ni agent injecté, ni horloge du téléphone).
export interface EnvMode {
  PUBLIC_ORIGIN: string;
  BANC?: string;
  /** Requête d'une personne connectée autorisée au banc : posé par requête, jamais en configuration. */
  BANC_SESSION?: boolean;
}

/** Environnement de dev (local, ou aperçu avec BANC=actif) : jamais p.uyt.re. */
export const bancEnvironnement = (env: EnvMode) =>
  env.PUBLIC_ORIGIN.startsWith("http://localhost") || (env.BANC === "actif" && env.PUBLIC_ORIGIN !== "https://p.uyt.re");

/** Le banc est-il ouvert pour cette requête ? */
export const devActif = (env: EnvMode) => env.BANC_SESSION === true;

/** Banc ouvert hors environnement de dev : n'arrive plus (garde-fou de dev.ts, restreint à ses étiquettes). */
export const bancProd = (env: EnvMode) => env.BANC_SESSION === true && !bancEnvironnement(env);

/** Qui peut ouvrir le banc : en dev, toute personne connectée au panneau ; en production, personne. */
export const peutOuvrirBanc = (env: EnvMode, role: "mj" | "lecteur" | null | undefined) =>
  !!role && bancEnvironnement(env);
