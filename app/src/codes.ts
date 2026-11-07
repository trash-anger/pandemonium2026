// Codes courts des étiquettes (RG-001-3, RG-001-4, DEC-086).
// 4 caractères, sans les caractères ambigus 0/O et 1/I/L : 31 symboles, 923 521 codes.
// Exception : les codes fixes du banc (0001, 0002…, src/banc-fixe.ts) commencent par 0, jamais tiré ici.
import { FORME_CODE_BANC } from "./banc-fixe";

export const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const LONGUEUR = 4;

/** URL encodée dans le QR, en majuscules pour le mode alphanumérique (CT-007). */
export function urlQr(code: string): string {
  return `HTTPS://P.UYT.RE/${code}`;
}

/** Ramène une saisie libre à un code valide, ou null. Tolère minuscules et espaces. */
export function normaliserCode(saisie: string): string | null {
  const c = saisie.replace(/[\s-]/g, "").toUpperCase();
  if (c.length !== LONGUEUR) return null;
  if (FORME_CODE_BANC.test(c)) return c;
  for (const ch of c) if (!ALPHABET.includes(ch)) return null;
  return c;
}

/** Tire un code au hasard (tirage par rejet : pas de biais modulo). */
export function tirerCode(aleatoire: (n: number) => Uint8Array = octets): string {
  const limite = 256 - (256 % ALPHABET.length); // 248
  let code = "";
  while (code.length < LONGUEUR) {
    for (const o of aleatoire(8)) {
      if (o < limite && code.length < LONGUEUR) code += ALPHABET[o % ALPHABET.length];
    }
  }
  return code;
}

/** Génère `n` codes distincts entre eux et absents de `existants`. */
export function genererCodes(n: number, existants: Set<string>, aleatoire?: (n: number) => Uint8Array): string[] {
  if (n > 50_000) throw new Error("Trop de codes demandés d'un coup");
  const pris = new Set(existants);
  const sortie: string[] = [];
  while (sortie.length < n) {
    const c = tirerCode(aleatoire);
    if (!pris.has(c)) {
      pris.add(c);
      sortie.push(c);
    }
  }
  return sortie;
}

function octets(n: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(n));
}
