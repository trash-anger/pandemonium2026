#!/usr/bin/env node
// Plan de tests imprimable : vrai téléphone + planche des codes fixes (0001…) + banc d'essai.
// Usage : npm run plan-tests   →   sorties/plan-tests.pdf (papier Lettre, noir et blanc)
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const APERCU = "deja-vu-apercu.uyt-re.workers.dev";

// [id, titre, qui, préparation, étapes, attendu]
// Notations : TÉL vrai téléphone ; TÉL 2 2e vrai téléphone ou onglet privé ; T1… téléphones du banc ; 0001 code de la planche
const SECTIONS = [
  ["1. Étiquettes et personnage", [
    ["R1", "Créer un personnage depuis une vierge", "TÉL · 0031",
      "Vrai téléphone sans personnage.",
      ["Scanner 0031 avec l'appareil photo.", "Faire les 4 écrans de création, choisir un PIN.", "Lire le tutoriel, revenir à l'accueil."],
      "Personnage créé, faction tirée, accueil « Et maintenant ? ». 0031 apparaît désormais sous « Ma carte »."],
    ["R2", "Reprendre un joueur fixe avec son PIN", "TÉL 2 · 0001",
      "Onglet de navigation privée (ou 2e téléphone) : aucun personnage.",
      ["Scanner 0001 : la carte de Joueur 1 s'affiche en lecture seule.", "« Réintégrer le jeu avec mon PIN » : taper 0000, puis 1234."],
      "0000 : PIN faux, essais restants affichés. 1234 : l'onglet devient Joueur 1."],
    ["R3", "Trop d'essais de PIN", "TÉL 2 · 0002",
      "Onglet privé sans personnage.",
      ["Scanner 0002, « Réintégrer », taper un mauvais PIN jusqu'au blocage."],
      "Récupération bloquée 15 min. Pour débloquer : admin › Chercher 0002 › « Réinitialiser le PIN » (ou rejouer « Codes fixes »)."],
    ["R4", "Spectateur", "TÉL 2 · 0003",
      "Onglet privé sans personnage.",
      ["Scanner 0003."],
      "Carte de Joueur 3 en lecture seule, aucun scan enregistré."],
    ["R5", "Ajouter une étiquette, puis surconsommer", "TÉL · 0032, 0033, 0034",
      "Le personnage de R1.",
      ["Scanner 0032 et accepter d'ajouter l'étiquette.", "Recommencer avec 0033, puis 0034."],
      "2e et 3e étiquettes ajoutées (factions différentes). À la 4e : surconsommation, corruption et badge."],
    ["R6", "Codes particuliers et saisie manuelle", "TÉL · 0051, 0099, 0042",
      "Le personnage de R1.",
      ["Scanner 0051, puis 0099.", "Onglet Scanner › taper « 00 42 » à la main."],
      "0051 : étiquette retirée. 0099 : code inconnu. Saisie tolérante : 0042 est reconnue (vierge)."],
  ]],
  ["2. Cartes, déjà vu, téléphones du banc", [
    ["R7", "Nouvelle carte puis déjà vu", "TÉL · 0002",
      "Le personnage de R1.",
      ["Scanner 0002.", "Rescanner 0002 tout de suite, puis 5 min plus tard."],
      "1er scan : nouvelle carte et faux souvenir. Ensuite : « déjà vu » (le rescan de moins de 5 min ne compte pas)."],
    ["R8", "Le vrai téléphone scanne un téléphone du banc", "TÉL · T1",
      "Banc : T1 « Joueur prêt (PIN 1234) ». Son QR s'affiche sous son écran.",
      ["Avec le vrai téléphone, scanner le QR sous T1, directement sur l'écran de l'ordinateur."],
      "Nouvelle carte avec le personnage de T1 ; T1 voit sa collection inchangée."],
    ["R9", "Un téléphone du banc scanne le vrai téléphone", "T1 · TÉL",
      "Personnage de R1 (étiquette 0031).",
      ["Dans la barre d'adresse de T1, taper /0031 puis « aller »."],
      "T1 obtient la carte du vrai téléphone. Rescanner : « déjà vu »."],
    ["R10", "Matrice entre téléphones du banc", "T1 à T6",
      "Banc : 3 à 6 téléphones, « Joueur prêt » sur tous (cible « tous »).",
      ["C1 : cliquer les cases de la matrice (ligne = qui scanne, colonne = qui est scanné).", "Cliquer une 2e fois une même case."],
      "Chaque case donne une nouvelle carte, puis « déjà vu ». « soi » : on se scanne soi-même."],
  ]],
  ["3. Costume du MJ : légendaires, pièges, pause", [
    ["R11", "Les 10 légendaires", "TÉL · 0011 à 0020",
      "Le personnage de R1.",
      ["Scanner 0011 à 0020 une par une, lire l'écran de chacune.", "Rescanner 0011."],
      "Écran « ✦ Légendaire » avec le bon nom (voir la planche). Rescan : déjà obtenue. Onglet Collection : « Légendes »."],
    ["R12", "Dernier exemplaire (L-7) : rupture de stock", "T1 · TÉL · 0017",
      "Un personnage qui n'a pas encore L-7 (T1 du banc).",
      ["Le vrai téléphone scanne 0017 (s'il ne l'a pas déjà fait en R11).", "T1 : barre d'adresse /0017."],
      "Le premier l'obtient ; le second voit « Rupture de stock » et l'heure de la prochaine remise en rayon."],
    ["R13", "Les 5 pièges, puis Retour sans reçu", "TÉL 2 · 0021 à 0025, 0012",
      "Nouvel onglet privé : créer un personnage sur 0035.",
      ["Scanner 0021 : attendre la fin du blocage. Rescanner 0021.", "Scanner 0012 (L-2), puis 0022.", "Faire 0023, 0024, 0025."],
      "Piège : scanner bloqué quelques minutes, une seule fois (rescan : « déjà vu »). Après L-2 : le piège suivant est évité."],
    ["R14", "Vue du MJ", "TÉL 2 · 0005, 0013",
      "Nouvel onglet privé : scanner 0005 et réintégrer avec 1234 (personnage du MJ).",
      ["Scanner 0013, puis 0021."],
      "« Vue du MJ : cette étiquette porte en ce moment… » ; aucun effet subi."],
    ["R15", "Fermé pour inventaire", "TÉL · 0005",
      "Admin › Pause : « ⛔ 5 min » (ou banc D5 « Pause 5 min »).",
      ["Le personnage de R1 scanne 0005.", "Admin : « Rouvrir le magasin »."],
      "Piège « Fermé pour inventaire » : scanner bloqué 2 min. Après réouverture, 0005 redonne la carte du MJ."],
    ["R16", "Sanction et mission sur le vrai téléphone", "TÉL · admin",
      "Admin › Chercher 0031 (le personnage de R1).",
      ["Sanction 2 « Retour en caisse (5 min) ».", "Confier une mission, puis la marquer réussie."],
      "Sanction : bannière et scanner bloqué 5 min. Mission : visible sur l'accueil, puis réussie."],
  ]],
  ["4. Contagion et jumeaux", [
    ["R17", "Le chat noir contamine le vrai téléphone", "T1 · TÉL",
      "Banc : E2 « Transmission 100 % » ; cible T1 › « Devenir chat noir ».",
      ["Le vrai téléphone scanne le QR sous T1."],
      "Le vrai téléphone devient corrompu (glitch, durée affichée). Admin › frise : la courbe des corrompus monte."],
    ["R18", "Guérison par L-2", "TÉL · 0012",
      "Le vrai téléphone corrompu (R17) n'a jamais eu L-2.",
      ["Scanner 0012."],
      "La corruption en cours est annulée."],
    ["R19", "Retrouvailles de jumeaux (banc seul)", "T1 · T2",
      "Banc : 2 téléphones prêts, cible « tous », E1 « Attribuer ».",
      ["E1 « Retrouvailles T1↔T2 ».", "Recommencer avec « Trop lent (> 90 s) »."],
      "Scans mutuels en moins de 90 s : retrouvailles et badge. Au-delà : pas de retrouvailles."],
  ]],
  ["5. Notifications push (vrai téléphone)", [
    ["R20", "Activer les notifications", "TÉL",
      "Android : Chrome. iPhone : ajouter d'abord l'app à l'écran d'accueil (iOS 16.4 et plus), puis l'ouvrir depuis l'icône.",
      ["Après la 1re carte, toucher « Activer les notifications » et accepter."],
      "« Notifications activées. » et une notification de bienvenue."],
    ["R21", "Push reçus téléphone verrouillé", "TÉL · TÉL 2 MJ · admin",
      "R20 fait sur le vrai téléphone ; pour le push de test, R20 aussi sur le personnage du MJ (0005).",
      ["Verrouiller le téléphone.", "Admin › Message à tous : « Envoyer ».", "Admin › Chercher 0031 › Sanction 1 « Avertissement ». ", "Admin › « 🔔 Push de test sur les appareils du MJ »."],
      "Une notification par action, en moins d'une minute (la sanction tout de suite, le message au plus une fois par 10 min). Toucher la notification ouvre l'app."],
  ]],
  ["6. Moments de la soirée (banc A3b)", [
    ["R22", "Minuit : fin des modifications", "TÉL 2 · 0036 · banc",
      "Nouvel onglet privé : créer un personnage sur 0036 (personne ne doit l'avoir scanné : un premier scan subi fige aussi le costume). Banc A3b « 23:58 ».",
      ["Ouvrir « Moi » et modifier le costume avant minuit.", "Attendre 2 min, réessayer."],
      "Avant minuit : modification possible. Après : fiche figée."],
    ["R23", "2 h : jumeaux pour tout le monde", "TÉL · T1 à T3",
      "Banc A3b « 1:58 », 3 téléphones prêts.",
      ["Attendre 2 min, faire un scan ou rafraîchir l'accueil du vrai téléphone."],
      "Un jumeau (ou des triplés) attribué, premier indice affiché."],
    ["R24", "Révélation à 5 h", "TÉL · T1",
      "Banc A3b « 4:58 ».",
      ["Attendre 2 min sur l'accueil du vrai téléphone."],
      "La révélation s'ouvre : graphe, zoom sur TOI, liens. Admin : tout remettre avec A3b « Heures normales »."],
  ]],
];

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
const fiche = ([id, titre, qui, prep, etapes, attendu]) => `<div class="cas">
<div class="tete"><span class="id">${id}</span><b>${esc(titre)}</b><span class="qui">${esc(qui)}</span><span class="cases">☐ OK &nbsp; ☐ KO</span></div>
<p><i>Avant</i> ${esc(prep)}</p>
<ol>${etapes.map((e) => `<li>${esc(e)}</li>`).join("")}</ol>
<p><i>Attendu</i> ${esc(attendu)}</p>
<div class="notes">Notes :</div></div>`;

const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><title>Plan de tests · Déjà vu !</title>
<style>
@page{size:letter;margin:11mm}
*{box-sizing:border-box}body{margin:0;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9pt;line-height:1.35;color:#000}
h1{font-size:17pt;margin:0 0 1mm}h2{font-size:11.5pt;margin:4mm 0 2mm;padding-bottom:.8mm;border-bottom:.4mm solid #000;break-after:avoid}
.sous{margin:0 0 3mm}
.boite{border:.35mm solid #000;border-radius:2mm;padding:2.5mm 3.5mm;margin-bottom:3mm;break-inside:avoid}
.boite h3{margin:0 0 1.5mm;font-size:10pt}.boite p{margin:1mm 0}.boite ol,.boite ul{margin:1mm 0;padding-left:5mm}
.boite.q{border-width:.7mm}
table.leg{border-collapse:collapse;margin:1mm 0}table.leg td{padding:.4mm 3mm .4mm 0;vertical-align:top}table.leg td:first-child{white-space:nowrap;width:1%}
.cas{border:.25mm solid #000;border-radius:1.5mm;padding:1.8mm 2.5mm;margin-bottom:2.2mm;break-inside:avoid}
.tete{display:flex;gap:2.5mm;align-items:baseline}
.id{font-family:Menlo,monospace;font-weight:800;border:.3mm solid #000;border-radius:1mm;padding:0 1.2mm}
.qui{font-family:Menlo,monospace;font-size:8pt}
.cases{margin-left:auto;white-space:nowrap;font-size:9pt}
.cas p{margin:.8mm 0}.cas i{font-style:normal;font-weight:700;font-size:7.5pt;letter-spacing:.06em;text-transform:uppercase;margin-right:1.5mm}
.cas ol{margin:.6mm 0;padding-left:5mm}
.notes{border-top:.2mm dotted #000;margin-top:1.5mm;padding-top:.6mm;height:6mm;font-size:7.5pt}
code{font-family:Menlo,monospace;font-size:8.5pt}
</style><body>
<h1>Déjà vu ! · Plan de tests</h1>
<p class="sous">Vrai téléphone + planche « Codes fixes du banc » + banc d'essai, sur l'aperçu <b>${APERCU}</b>. À cocher au fil des tests.</p>

<div class="boite q"><h3>Quelle heure compte ? (réponse à ta question)</h3>
<p><b>Pas celle de l'horloge simulée du banc.</b> L'horloge du banc (A3 : « 21:00 », « minuit »…) ne vaut que pour les téléphones dessinés dans le banc : ils envoient l'heure simulée au serveur. Ton vrai téléphone, lui, n'est pas dans le banc : le serveur prend l'<b>heure réelle</b>. Avec les heures normales (samedi 21 h), il répondrait « bientôt » à chaque scan avant samedi soir.</p>
<p><b>La solution : A3b « Soirée en heure réelle ».</b> Ce bouton décale toute la soirée (début, minuit, 1 h, 2 h, révélation, fin) pour qu'il soit maintenant l'heure choisie, et remet l'horloge du banc en heure réelle. Vrai téléphone et banc vivent alors à la même heure. « 23:58 » : minuit dans 2 min ; « 4:58 » : révélation dans 2 min. « Heures normales » remet samedi 21 h. N'utilise plus l'horloge simulée (A3) pendant ces tests : les téléphones du banc seraient décalés de plusieurs heures et les échanges avec le vrai téléphone (retrouvailles, contagion) ne marcheraient pas.</p></div>

<div class="boite"><h3>Préparation (une fois)</h3>
<ol>
<li>Fusionner ou pousser la PR des codes fixes : l'aperçu montre la dernière PR poussée.</li>
<li>Sur l'ordinateur : <code>${APERCU}/banc</code> (connexion Google). A4 « Stock de test » (étiquettes des téléphones du banc), puis « Codes fixes 0001… ».</li>
<li>A3b « 21:01 » : la soirée vient de commencer, en heure réelle.</li>
<li>Avant de rejouer toute la campagne : A4 « Partie à zéro », puis à nouveau « Codes fixes 0001… » et A3b.</li>
</ol>
<table class="leg">
<tr><td><b>TÉL</b></td><td>ton vrai téléphone (navigateur normal) ; il garde un seul personnage</td></tr>
<tr><td><b>TÉL 2</b></td><td>un autre personnage sur le vrai téléphone : onglet de navigation privée (ou un autre téléphone). Pour repartir sans personnage, fermer tous les onglets privés et en rouvrir un. <b>Attention :</b> l'appareil photo ouvre un onglet normal ; dans l'onglet privé, taper le code dans l'onglet Scanner (ou l'adresse <code>…/0001</code>).</td></tr>
<tr><td><b>T1…T6</b></td><td>téléphones du banc ; le QR de leurs étiquettes s'affiche sous leur écran, scannable avec TÉL</td></tr>
<tr><td><b>0001…</b></td><td>QR de la planche imprimée ; PIN des joueurs fixes et du MJ : 1234</td></tr>
<tr><td><b>Faire scanner un code à T1</b></td><td>taper <code>/0031</code> dans la barre d'adresse de T1, puis « aller »</td></tr>
</table></div>

${SECTIONS.map(([t, cas]) => `<h2>${t}</h2>${cas.map(fiche).join("")}`).join("\n")}

<div class="boite"><h3>Pas testable à cette échelle</h3>
<ul><li>Suggestions au MJ et paliers : il faut au moins 20 joueurs actifs ; ils sont couverts par les tests automatiques.</li>
<li>Scanner intégré, lampe et mur : LOT-5, à venir.</li></ul></div>
</body></html>`;

mkdirSync("sorties", { recursive: true });
const h = resolve("sorties/plan-tests.html"), pdf = resolve("sorties/plan-tests.pdf");
writeFileSync(h, html);
const chrome = ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(existsSync);
if (!chrome) console.log(`${h} écrit ; Chrome introuvable : l'imprimer en PDF (Lettre, 100 %).`);
else { execFileSync(chrome, ["--headless", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${pdf}`, `file://${h}`], { stdio: "ignore" }); console.log(pdf); }
