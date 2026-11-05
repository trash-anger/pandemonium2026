// Mode banc d'essai : en local, ou sur l'aperçu des PR (BANC=actif). Jamais sur p.uyt.re.
export interface EnvMode {
  PUBLIC_ORIGIN: string;
  BANC?: string;
}

export const devActif = (env: EnvMode) =>
  env.PUBLIC_ORIGIN.startsWith("http://localhost") || (env.BANC === "actif" && env.PUBLIC_ORIGIN !== "https://p.uyt.re");
