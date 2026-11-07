#!/usr/bin/env node
// Planches PDF des étiquettes du jeu sur papier Lettre, à massicoter : QR + « DÉJÀ VU ! » (Arial Black, comme le teaser).
// Les étiquettes se touchent ; seuls de fins traits gris, prolongés jusqu'au bord de la feuille, marquent les coupes.
// Un petit point indique où percer. Les étiquettes du MJ portent un losange discret à droite du titre
// (deux pour la personnelle, un pour les 15 spéciales). Source : donnees/etiquettes-jeu.csv (npm run codes-jeu).
// Usage : npm run etiquettes   → sorties/etiquettes.pdf (dossier ignoré par git)
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import QRCode from "qrcode";

const PAGE = { l: 215.9, h: 279.4 }; // Lettre, en mm
// l × h de l'étiquette, colonnes × rangées par page ; en mm depuis le haut : point de perçage, titre (taille), QR (côté)
const F = { l: 29, h: 38, col: 7, rang: 7, point: 2.3, titreY: 4.4, titre: 4.1, qrY: 13.8, qr: 21.5 };
const MARGE = (F.l - F.qr) / 2; // titre et losanges calés sur les bords du QR

const lignes = readFileSync(new URL("../donnees/etiquettes-jeu.csv", import.meta.url), "utf8").trim().split(/\r?\n/).slice(1).map((l) => l.split(","));
// Le costume du MJ d'abord (1re page), puis les normales
const ORDRE = { personnelle_mj: 0, speciale_mj: 1, normale: 2 };
const etiquettes = lignes.map(([code, , role]) => ({ code, role })).sort((a, b) => ORDRE[a.role] - ORDRE[b.role]);
const LOSANGES = { personnelle_mj: 2, speciale_mj: 1, normale: 0 };

const qr = (code) => QRCode.toString(`HTTPS://P.UYT.RE/${code}`, { type: "svg", errorCorrectionLevel: "Q", margin: 0, color: { dark: "#000", light: "#fff" } });

async function planche(etiquettes) {
  const parPage = F.col * F.rang;
  const x0 = (PAGE.l - F.col * F.l) / 2, y0 = (PAGE.h - F.rang * F.h) / 2;
  // Traits de coupe : toute la largeur ou hauteur de la feuille, pour caler le massicot
  const traits = [
    ...Array.from({ length: F.col + 1 }, (_, i) => `<line x1="${x0 + i * F.l}" y1="0" x2="${x0 + i * F.l}" y2="${PAGE.h}"/>`),
    ...Array.from({ length: F.rang + 1 }, (_, j) => `<line x1="0" y1="${y0 + j * F.h}" x2="${PAGE.l}" y2="${y0 + j * F.h}"/>`),
  ].join("");
  const pages = [];
  for (let p = 0; p < etiquettes.length; p += parPage) {
    const cellules = await Promise.all(etiquettes.slice(p, p + parPage).map(async ({ code, role }, k) => {
      const x = x0 + (k % F.col) * F.l, y = y0 + Math.floor(k / F.col) * F.h;
      const marque = LOSANGES[role] ? `<b>${"<s></s>".repeat(LOSANGES[role])}</b>` : "";
      return `<div class="e" style="left:${x}mm;top:${y}mm"><i></i><h1><span>Déjà</span><span>vu&nbsp;!</span></h1>${marque}<div class="q">${await qr(code)}</div></div>`;
    }));
    pages.push(`<section><svg class="traits" viewBox="0 0 ${PAGE.l} ${PAGE.h}">${traits}</svg>${cellules.join("")}</section>`);
  }
  return `<!doctype html><meta charset="utf-8"><title>Étiquettes Déjà vu !</title><style>
@page{size:Letter;margin:0}*{box-sizing:border-box}html,body{margin:0}
section{position:relative;width:${PAGE.l}mm;height:${PAGE.h}mm;overflow:hidden;page-break-after:always}
.traits{position:absolute;inset:0;width:100%;height:100%;stroke:#c4c4c4;stroke-width:.12}
.e{position:absolute;width:${F.l}mm;height:${F.h}mm}
.e i{position:absolute;left:50%;top:${F.point}mm;width:1.3mm;height:1.3mm;margin:-.65mm 0 0 -.65mm;border-radius:50%;background:#999}
h1{position:absolute;left:${MARGE}mm;top:${F.titreY}mm;margin:0;padding-top:.14em;font:900 ${F.titre}mm/.84 "Arial Black",Arial,sans-serif;letter-spacing:-.04em;text-transform:uppercase;text-align:left;color:#000}
b{position:absolute;right:${MARGE}mm;top:${F.qrY - 3.2}mm;display:flex;gap:.6mm}
b s{display:block;width:1.1mm;height:1.1mm;background:#000;transform:rotate(45deg)}
h1 span{display:block}
.q{position:absolute;left:${MARGE}mm;top:${F.qrY}mm;width:${F.qr}mm;height:${F.qr}mm}.q svg{display:block;width:100%;height:100%;shape-rendering:crispEdges}
</style>${pages.join("")}`;
}

const sorties = new URL("../sorties/", import.meta.url);
mkdirSync(sorties, { recursive: true });
const chrome = ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(existsSync);
const html = new URL("etiquettes.html", sorties).pathname, pdf = html.replace(/\.html$/, ".pdf");
writeFileSync(html, await planche(etiquettes));
if (chrome) execFileSync(chrome, ["--headless", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${pdf}`, `file://${html}`], { stdio: "ignore" });
const n = (r) => etiquettes.filter((e) => e.role === r).length;
console.log(`${etiquettes.length} étiquettes ${F.l}×${F.h} mm (MJ : ${n("personnelle_mj")} personnelle ◆◆, ${n("speciale_mj")} spéciales ◆), ${Math.ceil(etiquettes.length / (F.col * F.rang))} pages → ${chrome ? pdf : html}`);
