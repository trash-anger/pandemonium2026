import { urlQr } from "./codes";

/**
 * Export pour l'import en lot de l'app NIIMBOT (DEC-028).
 * Colonne `url` : à lier au QR. Colonne `code` : à lier au texte sous le QR.
 */
export function csvNiimbot(codes: string[]): string {
  const lignes = ["code,url", ...codes.map((c) => `${c},${urlQr(c)}`)];
  return lignes.join("\r\n") + "\r\n";
}
