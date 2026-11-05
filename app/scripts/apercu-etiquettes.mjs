#!/usr/bin/env node
// Aperçu des gabarits d'étiquettes à l'échelle (40×30 et 40×50 mm), à partir d'un CSV exporté de l'admin.
// Usage : npm run apercu -- <export.csv> [petit|grand] [max]
// Écrit sorties/apercu-<format>.html (dossier ignoré par git : les codes ne doivent pas être publiés).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import QRCode from "qrcode";

const [csv, format = "petit", max = "60"] = process.argv.slice(2);
if (!csv) {
  console.error("Usage : npm run apercu -- <export.csv> [petit|grand] [max]");
  process.exit(1);
}
const lignes = readFileSync(csv, "utf8").trim().split(/\r?\n/).slice(1).map((l) => l.split(","));
const choix = lignes.slice(0, Number(max));

const versions = new Set();
const etiquettes = [];
for (const [code, url] of choix) {
  // Correction d'erreur Q (RG-001-11), mode alphanumérique grâce à l'URL en majuscules (CT-007)
  const qr = QRCode.create(url, { errorCorrectionLevel: "Q" });
  versions.add(qr.version);
  const svg = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "Q", margin: 2, color: { dark: "#000", light: "#fff" } });
  etiquettes.push({ code, svg });
}

const grand = format === "grand";
const html = `<!doctype html><meta charset="utf-8"><title>Aperçu ${format} · ${basename(csv)}</title>
<style>
@page{margin:8mm}body{font-family:system-ui,sans-serif;background:#eee;margin:0;padding:8mm}
.planche{display:flex;flex-wrap:wrap;gap:4mm}
.e{width:40mm;height:${grand ? 50 : 30}mm;background:#fff;border-radius:2mm;outline:.2mm dashed #bbb;display:flex;
  ${grand ? "flex-direction:column;align-items:center;justify-content:center" : "align-items:center;padding-left:1mm"};box-sizing:border-box;overflow:hidden}
.q{width:25.4mm;height:25.4mm;flex:none}.q svg{width:100%;height:100%;display:block}
.t{${grand ? "text-align:center;margin-top:1mm" : "flex:1;text-align:center"}}
.logo{font-family:"Arial Black",Impact,sans-serif;font-size:${grand ? 4.2 : 3.6}mm;line-height:.95;letter-spacing:-.02em}
.c{font-family:ui-monospace,Menlo,monospace;font-weight:700;font-size:${grand ? 4.4 : 4}mm;letter-spacing:.25em;margin-top:1mm}
.trou{width:5mm;height:5mm;border-radius:50%;border:.3mm solid #999;margin-bottom:auto;margin-top:3mm}
h1{font-size:14px}p{font-size:12px;color:#555}
@media print{body{background:#fff}.e{outline:.2mm dashed #ccc}h1,p{display:none}}
</style>
<h1>${etiquettes.length} étiquettes ${format} (${grand ? "40×50" : "40×30"} mm) · QR version ${[...versions].join(", ")}, correction Q, 25,4 mm</h1>
<p>Imprimer à 100 % (sans mise à l'échelle) pour vérifier les tailles et tester le scan. Gabarit à reproduire dans l'app NIIMBOT : voir app/README.md.</p>
<div class="planche">${etiquettes
  .map((e) => `<div class="e"><div class="q">${e.svg}</div><div class="t">${grand ? `<div class="c">${e.code}</div><div class="logo">DÉJÀ VU !</div>` : `<div class="logo">DÉJÀ<br>VU !</div><div class="c">${e.code}</div>`}</div></div>`)
  .join("")}</div>`;

mkdirSync("sorties", { recursive: true });
const sortie = `sorties/apercu-${format}.html`;
writeFileSync(sortie, html);
console.log(`${sortie} : ${etiquettes.length} étiquettes, QR version ${[...versions].join(", ")}`);
