#!/usr/bin/env node
// Planche PDF des codes fixes du banc (0001, 0002…), à imprimer en noir et blanc sur papier Lettre.
// Usage : npm run planche -- [origine]   (par défaut, l'aperçu des PR)
// Écrit sorties/codes-banc.html et sorties/codes-banc.pdf (dossier ignoré par git).
// Les codes viennent de src/banc-fixe.ts ; les noms des légendaires, de public/app.js.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import QRCode from "qrcode";
import { CODES_FIXES, PIN_FIXE } from "../src/banc-fixe.ts";

const origine = (process.argv[2] || "https://deja-vu-apercu.uyt-re.workers.dev").replace(/\/$/, "");

// Textes du jeu (version française, la première dans app.js)
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const legendaires = Object.fromEntries([...app.matchAll(/"(L-\d+)": \["([^"]+)", "([^"]+)"\]/g)].slice(0, 10).map((m) => [m[1], { nom: m[2], effet: m[3] }]));
const pieges = Object.fromEntries([...app.matchAll(/"(T-\d)": "([^"]+)"/g)].slice(0, 5).map((m) => [m[1], m[2]]));
const factions = Object.fromEntries([...app.matchAll(/^\s+(\w+): \{ e: "([^"]+)", fr: "([^"]+)"/gm)].map((m) => [m[1], m[3]]));
const TYPES = { nuit: "Créature de la nuit", robot: "Robot", animal: "Animal", pop: "Pop culture", inclassable: "Inclassable" };
const COULEURS = { rouge: "rouge", argent: "argent", vert: "vert", rose: "rose", noir: "noir" };
const EFFET_PIEGE = {
  "T-1": "File d'attente : scanner bloqué.", "T-2": "Carte refusée : scanner bloqué.", "T-3": "Fausse mise à jour : scanner bloqué.",
  "T-4": "Faux abonnement : scanner bloqué.", "T-5": "CAPTCHA impossible : scanner bloqué.",
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** Badge, titre, deux lignes de description, et ce que ça teste (tableau récapitulatif). */
function fiche(c) {
  const p = c.personnage;
  switch (c.groupe) {
    case "joueur": return { badge: "JOUEUR", titre: `${p.nom} · PIN ${PIN_FIXE}`, l1: `${TYPES[p.type]}, ${COULEURS[p.couleur]}`, l2: factions[p.faction],
      test: "Personnage fixe. Sans personnage sur le téléphone : « Réintégrer le jeu avec mon PIN ». Avec un autre personnage : nouvelle carte, puis déjà vu." };
    case "mj": return { badge: "MJ", titre: `Étiquette du MJ · PIN ${PIN_FIXE}`, l1: "Reçoit les suggestions", l2: "En pause : piège de 2 min",
      test: "Personnage MJ fixe : le reprendre avec le PIN pour recevoir les pushs de suggestion. Scanné en pause « Fermé pour inventaire » : piège de 2 min." };
    case "legendaire": { const l = legendaires[c.effet]; return { badge: `LÉGENDAIRE ${c.effet}`, titre: l.nom, l1: l.effet, l2: "",
      test: `${c.effet} « ${l.nom} », toujours sur ce code (pas de mélange). Scannée par le MJ : vue sans effet.` }; }
    case "piege": return { badge: `PIÈGE ${c.effet}`, titre: pieges[c.effet], l1: EFFET_PIEGE[c.effet], l2: "Une seule fois par joueur",
      test: `${c.effet} « ${pieges[c.effet]} », toujours sur ce code. Un 2e scan : « déjà vu » ; L-2 protège du prochain.` };
    case "vierge": return { badge: "VIERGE", titre: "Étiquette vierge", l1: "Créer un personnage, ou", l2: "l'ajouter à un personnage existant",
      test: "Création de personnage (PIN au choix), ajout d'une 2e ou 3e étiquette, surconsommation. Reste réclamée jusqu'à « Partie à zéro »." };
    case "retiree": return { badge: "RETIRÉE", titre: "Étiquette désactivée", l1: "Affiche « étiquette retirée »", l2: "",
      test: "Étiquette désactivée par le MJ." };
    case "inconnue": return { badge: "INCONNUE", titre: "Code absent de la base", l1: "Affiche « code inconnu »", l2: "",
      test: "Code jamais généré : page introuvable." };
  }
}

const SECTIONS = [
  ["Joueurs fixes et MJ", ["joueur", "mj"], "0001 à 0005", `PIN ${PIN_FIXE}. Scanné par un autre personnage : nouvelle carte, puis « déjà vu ».`],
  ["Légendaires", ["legendaire"], "0011 à 0020 : L-1 à L-10", "Toujours le même effet sur ces codes (pas de mélange). Scannée par le MJ : vue sans effet."],
  ["Pièges", ["piege"], "0021 à 0025 : T-1 à T-5", "Bloquent le scanner, une seule fois par joueur ; L-2 protège du prochain."],
  ["Vierges", ["vierge"], "0031 à 0042", "Création de personnage, 2e ou 3e étiquette, surconsommation. Restent réclamées jusqu'à « Partie à zéro »."],
  ["Cas particuliers", ["retiree", "inconnue"], "0051, 0099", ""],
];

const cartes = [];
for (const c of CODES_FIXES) {
  // Majuscules : mode alphanumérique du QR, plus compact (CT-007)
  const url = `${origine.toUpperCase()}/${c.code}`;
  const svg = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "Q", margin: 1, color: { dark: "#000", light: "#fff" } });
  cartes.push({ ...c, ...fiche(c), svg });
}

/** Lignes du récapitulatif ; les vierges, toutes pareilles, tiennent sur une ligne. */
function lignes(cs) {
  if (cs[0]?.groupe === "vierge") return `<tr><td class="c">${cs[0].code}–${cs.at(-1).code}</td><td class="a">VIERGE</td><td>${esc(cs[0].l1)} ${esc(cs[0].l2)}</td></tr>`;
  return cs.map((c) => `<tr><td class="c">${c.code}</td><td class="a">${esc(c.badge)}</td><td>${c.groupe === "joueur" ? esc(`${c.personnage.nom} · ${c.l1} · ${c.l2}`) : c.groupe === "mj" ? esc(c.test) : `<b>${esc(c.titre)}</b>${c.l1 ? ` : ${esc(c.l1)}` : ""}`}</td></tr>`).join("");
}

const carte = (c) => `<div class="carte g-${c.groupe}">
  <div class="badge">${esc(c.badge)}</div>
  <div class="qr">${c.svg}</div>
  <div class="code">${c.code}</div>
  <div class="titre">${esc(c.titre)}</div>
  <div class="desc">${esc(c.l1)}${c.l2 ? `<br>${esc(c.l2)}` : ""}</div>
</div>`;

const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><title>Codes fixes du banc · Déjà vu !</title>
<style>
@page{size:letter;margin:10mm}
*{box-sizing:border-box}
body{margin:0;font-family:"Helvetica Neue",Arial,sans-serif;color:#000;font-size:9pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}
h1{font-size:18pt;margin:0 0 1mm}h2{font-size:12pt;margin:0 0 2mm;padding-bottom:1mm;border-bottom:.4mm solid #000}
h2 small{font-weight:400;font-size:9pt;margin-left:2mm}
.sous{margin:0 0 4mm;font-size:9.5pt}
ol{margin:0 0 3mm;padding-left:5mm;line-height:1.3}ol li{margin-bottom:.6mm}
table{width:100%;border-collapse:collapse;font-size:8.3pt}
th,td{border:.2mm solid #000;padding:.6mm 1.5mm;text-align:left;vertical-align:top}
th{background:#e6e6e6}tr.sec td{background:#f2f2f2;border-top:.5mm solid #000}td.c,td.a{white-space:nowrap}td.c{font-family:Menlo,Consolas,monospace;font-weight:700}
.page{break-after:page}
section{margin-bottom:3mm;break-inside:auto}h2{break-after:avoid}
.grille{display:grid;grid-template-columns:repeat(5,1fr);gap:2mm}
.carte{border:.35mm solid #000;border-radius:2mm;padding:1.5mm 1.2mm 2mm;text-align:center;break-inside:avoid;display:flex;flex-direction:column;align-items:center}
.badge{font-weight:800;font-size:6.8pt;letter-spacing:.06em;padding:.4mm 1.5mm;border:.3mm solid #000;border-radius:1mm;margin-bottom:1mm;white-space:nowrap}
.g-joueur .badge,.g-mj .badge{background:#000;color:#fff}
.g-legendaire .badge{border-style:double;border-width:.9mm}
.g-piege .badge{border-style:dashed}
.g-retiree .badge,.g-inconnue .badge{text-decoration:line-through}
.qr{width:27mm;height:27mm}.qr svg{width:100%;height:100%;display:block}
.code{font-family:Menlo,Consolas,monospace;font-weight:800;font-size:15pt;letter-spacing:.12em;margin-top:1mm;line-height:1}
.titre{font-weight:700;font-size:7.6pt;margin-top:1mm;line-height:1.12}
.desc{font-size:6.6pt;line-height:1.18;margin-top:.5mm}
.pied{font-size:7.5pt;margin-top:3mm}
</style>
<body>
<div class="page">
<h1>Déjà vu ! · Codes fixes du banc</h1>
<p class="sous">${CODES_FIXES.length} codes de test pour <b>${esc(origine)}</b>. Ils n'existent jamais en production : scannés sur p.uyt.re, ils affichent « code inconnu ».</p>
<ol>
<li><b>Installer les codes</b> : sur ${esc(origine.replace(/^https?:\/\//, ""))}/banc, bouton « Codes fixes 0001… » (A4). À refaire après « Partie à zéro » ou « Tout réinitialiser ». Les PIN reviennent à ${PIN_FIXE}.</li>
<li><b>Ouvrir la soirée</b> : dans l'admin de l'aperçu, mettre le début de la soirée dans le passé. Sinon chaque scan répond « bientôt » (le banc n'avance l'horloge que dans ses propres téléphones).</li>
<li><b>Prendre un personnage fixe</b> : scanner 0001 à 0004 (ou 0005 pour le MJ) avec l'appareil photo d'un téléphone sans personnage, puis « Réintégrer le jeu avec mon PIN » (${PIN_FIXE}).</li>
<li><b>Ou en créer un</b> : scanner une vierge (0031 à 0042).</li>
</ol>
<table><thead><tr><th>Code</th><th>Attribution</th><th>Détail</th></tr></thead><tbody>
${SECTIONS.map(([titre, groupes, plage, note]) => `<tr class="sec"><td colspan="3"><b>${titre}</b> · ${plage}.${note ? " " + esc(note) : ""}</td></tr>` + lignes(cartes.filter((c) => groupes.includes(c.groupe)))).join("\n")}
</tbody></table>
<p class="pied">Les étiquettes du « Stock de test » (codes au hasard) gardent le mélange des légendaires toutes les 20 min. Imprimer à 100 % (taille réelle), noir et blanc.</p>
</div>
${SECTIONS.map(([titre, groupes, plage]) => `<section><h2>${titre}<small>${plage}</small></h2><div class="grille">${cartes.filter((c) => groupes.includes(c.groupe)).map(carte).join("")}</div></section>`).join("\n")}
</body></html>`;

mkdirSync("sorties", { recursive: true });
const sortieHtml = resolve("sorties/codes-banc.html"), sortiePdf = resolve("sorties/codes-banc.pdf");
writeFileSync(sortieHtml, html);

const chrome = ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(existsSync);
if (!chrome) {
  console.log(`${sortieHtml} écrit ; Chrome introuvable : ouvrir le fichier et l'imprimer en PDF (format Lettre, 100 %).`);
} else {
  execFileSync(chrome, ["--headless", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${sortiePdf}`, `file://${sortieHtml}`], { stdio: "ignore" });
  console.log(`${sortiePdf} : ${CODES_FIXES.length} codes pour ${origine}`);
}
