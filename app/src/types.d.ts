declare module "*.html" {
  const contenu: string;
  export default contenu;
}

// Cœur du paquet qrcode (sans dépendance Node) : QR du banc d'essai
declare module "qrcode/lib/core/qrcode" {
  export function create(texte: string, options?: { errorCorrectionLevel?: "L" | "M" | "Q" | "H" }): unknown;
}
declare module "qrcode/lib/renderer/svg-tag" {
  export function render(qr: unknown, options?: { margin?: number; color?: { dark?: string; light?: string } }): string;
}
