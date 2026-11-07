// Pages HTML rendues par le Worker. Charte du teaser (teaser/index.html).
// Coquille de l'application du joueur et panneau du MJ.
import type { etatDirect } from "./direct";
import type { ImageCachee } from "./revelation";
import type { etatMJ } from "./mj";
import type { etatRoles } from "./jumeaux";
import type { frise, suggestionsEnCours } from "./suivi";

export type Langue = "fr" | "en";

export function langue(req: Request): Langue {
  const q = new URL(req.url).searchParams.get("lang");
  if (q === "fr" || q === "en") return q;
  const a = (req.headers.get("Accept-Language") || "").toLowerCase();
  const fr = a.indexOf("fr"), en = a.indexOf("en");
  return en >= 0 && (fr < 0 || en < fr) ? "en" : "fr";
}

export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const CSS = `
:root{--gold:#e8b84a;--bg:#0b0a0f;--bg2:#15131c;--bg3:#1e1a27;--fg:#efe9df;--muted:#aaa4b6;--pink:#ff4f8b;--green:#3dff8a;--paper:#f1ece2;--ink:#18161d;--line:#3a3445;
--mono:ui-monospace,"SF Mono",SFMono-Regular,Menlo,Consolas,monospace;--sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--display:"Arial Black","Helvetica Neue",Impact,system-ui,sans-serif}
*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--sans);-webkit-text-size-adjust:100%}
body{min-height:100dvh;background:radial-gradient(ellipse at 20% 0%,#3a1426 0%,var(--bg) 60%) fixed}
body::after{content:"";position:fixed;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px)}
main{max-width:560px;margin:0 auto;padding:28px 18px 48px}
.chip{display:inline-block;font-family:var(--mono);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--pink);border:1.5px solid var(--pink);padding:5px 9px}
h1{font-family:var(--display);font-size:clamp(56px,18vw,108px);line-height:.88;margin:18px 0 0;letter-spacing:-.02em;text-shadow:-.035em 0 var(--pink),.035em 0 var(--green)}
h2{font-family:var(--display);font-size:22px;margin:30px 0 10px}
p{font-size:17px;line-height:1.5}.muted{color:var(--muted)}.mono{font-family:var(--mono)}
.code{font-family:var(--mono);font-weight:700;font-size:30px;letter-spacing:.3em;color:var(--green)}
.fr-defile{overflow-x:auto;-webkit-overflow-scrolling:touch}.frise{display:block;width:100%;min-width:560px;height:auto;overflow:visible}.fr-titre{margin:14px 0 2px;font-size:13px;font-weight:700}
.fr-axe{font:9px var(--mono);fill:var(--muted)}.fr-base{stroke:var(--line);stroke-width:1}.fr-rep{stroke:var(--muted);stroke-width:1;stroke-dasharray:2 3;opacity:.7}
.fr-melange{stroke:var(--muted);stroke-width:1;opacity:.6}.fr-seuil{stroke:var(--line);stroke-dasharray:3 3}.fr-ligne{fill:none;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
.fr-evt{font-size:10px;fill:var(--fg)}.fr-leg{font-weight:400;color:var(--muted);margin-left:10px;white-space:nowrap}.fr-leg i{display:inline-block;width:12px;height:8px;border-radius:2px;margin-right:4px;vertical-align:middle}
.fr-table{font:12px var(--mono);border-collapse:collapse;width:100%}.fr-table td,.fr-table th{padding:2px 6px;text-align:right;border-bottom:1px solid var(--line)}
.carte{background:var(--bg2);border:1px solid var(--line);border-radius:16px;padding:16px;margin-top:18px}
.compte{font-family:var(--mono);font-size:28px;color:var(--pink);letter-spacing:.06em}
input,select,textarea,button{font:inherit;color:inherit}
input,select,textarea{width:100%;background:var(--bg3);border:1.5px solid var(--line);border-radius:12px;padding:12px;font-size:17px}
input.saisie{font-family:var(--mono);font-size:26px;letter-spacing:.35em;text-transform:uppercase;text-align:center}
textarea{font-family:var(--mono);font-size:13px;min-height:220px}
button,.bouton{display:inline-block;background:var(--pink);color:var(--ink);border:0;border-radius:12px;padding:12px 18px;font-weight:800;font-size:16px;text-decoration:none;cursor:pointer}
.bouton.sec{background:var(--bg3);color:var(--fg);border:1.5px solid var(--line)}
label{display:block;font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:14px 0 6px}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:8px 6px;border-bottom:1px solid var(--line)}th{font-family:var(--mono);font-size:11px;letter-spacing:.1em;color:var(--muted);text-transform:uppercase}
.grille{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px}
.stat{background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:12px}.stat b{display:block;font-size:26px}.stat span{font-family:var(--mono);font-size:10.5px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase}
.ok{color:var(--green)}.err{color:var(--pink)}
.rangee{display:flex;gap:10px;flex-wrap:wrap;align-items:end}.rangee>*{flex:1 1 140px}
footer{margin-top:40px;font-family:var(--mono);font-size:11px;color:var(--muted);letter-spacing:.12em}
@media (prefers-reduced-motion:no-preference){h1{animation:g 7s infinite steps(1)}@keyframes g{0%,96%{transform:none}97%{transform:translateX(3px) skewX(-4deg)}98%{transform:translateX(-2px)}}}`;

function page(l: Langue, titre: string, corps: string, robots = true): Response {
  const html = `<!doctype html><html lang="${l}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0b0a0f">${robots ? "" : '<meta name="robots" content="noindex">'}
<title>${esc(titre)}</title><link rel="icon" href="/favicon.svg"><style>${CSS}</style></head>
<body><main>${corps}</main></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

/** Coquille de l'application du joueur (LOT-1) : tout l'affichage est fait par public/app.js. */
export const VERSION_APP = "l3e-1";
export function pageApp(l: Langue, status = 200): Response {
  const html = `<!doctype html><html lang="${l}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0b0a0f"><meta name="robots" content="noindex">
<title>Déjà vu !</title><link rel="icon" href="/favicon.svg">
<link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Déjà vu !"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="stylesheet" href="/app.css?v=${VERSION_APP}"><script src="/app.js?v=${VERSION_APP}" defer></script></head>
<body><div id="app"><main class="ecran centre"><p class="chargement">${l === "en" ? "Looking for your size in the stockroom…" : "On cherche ta taille en réserve…"}</p></main></div>
<noscript><p style="padding:20px">JavaScript est nécessaire pour jouer. / JavaScript is required to play.</p></noscript></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

// ---------- Panneau du MJ (FEAT-020, ADM-1 à ADM-3) ----------

export interface Lot { lot: number; format: string; role: string; n: number; cree_le: string; banc?: number }
export interface Compte { format: string; role: string; etat: string; n: number }
export interface EtiquetteVue { code: string; format: string; role: string; etat: string; lot: number; cree_le: string; personnage_id: string | null; faction_id: string | null; pseudo: string | null; nb_etiquettes: number | null }

const ROLES = ["normale", "personnelle_mj", "speciale_mj"];
const ETATS = ["vierge", "reclamee", "desactivee"];
const opts = (liste: string[], choisi?: string) =>
  liste.map((v) => `<option value="${v}"${v === choisi ? " selected" : ""}>${v}</option>`).join("");

export function pageAdmin(p: {
  email: string; role: "mj" | "lecteur"; comptes: Compte[]; lots: Lot[]; heures: unknown; parametres: unknown;
  message?: string; erreur?: string; etiquette?: EtiquetteVue | null; recherche?: string;
  joueurs: { personnages: number; scans: number; cartes: number };
  /** Bouton du banc d'essai (selon l'environnement et le rôle) */
  banc?: boolean;
  direct?: EtatDirect;
  image?: ImageCachee;
  mj?: Awaited<ReturnType<typeof etatMJ>>;
  roles?: Awaited<ReturnType<typeof etatRoles>>;
  push?: { cle: boolean; appareils: number; joueurs: number; en_echec: number };
  frise?: Awaited<ReturnType<typeof frise>>;
  suggestions?: Awaited<ReturnType<typeof suggestionsEnCours>>;
}) {
  const lecture = p.role === "lecteur";
  const total = p.comptes.reduce((a, c) => a + c.n, 0);
  const somme = (f: (c: Compte) => boolean) => p.comptes.filter(f).reduce((a, c) => a + c.n, 0);
  const stats = [
    ["total", total], ["petit", somme((c) => c.format === "petit")], ["grand", somme((c) => c.format === "grand")],
    ["MJ", somme((c) => c.role !== "normale")], ["réclamées", somme((c) => c.etat === "reclamee")], ["désactivées", somme((c) => c.etat === "desactivee")],
  ].map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join("");

  const lots = p.lots.length
    ? `<table><tr><th>Lot</th><th>Format</th><th>Rôle</th><th>N</th><th>Export</th></tr>${p.lots
        .map((x) => `<tr><td>#${x.lot}</td><td>${x.format}</td><td>${x.role}</td><td>${x.n}</td><td>${x.banc ? "🧪 banc" : lecture ? "—" : `<a class="ok" href="/admin/export.csv?lot=${x.lot}">CSV</a>`}</td></tr>`)
        .join("")}</table>
${lecture ? "" : `<p><a class="bouton sec" href="/admin/export.csv?format=petit">CSV de tous les petits</a> <a class="bouton sec" href="/admin/export.csv?format=grand">CSV de tous les grands</a></p>`}`
    : `<p class="muted">Aucune étiquette générée.</p>`;

  const e = p.etiquette;
  const fiche = e
    ? `<form method="post" action="/admin/etiquette" class="carte"><input type="hidden" name="code" value="${e.code}">
<div class="code">${e.code}</div><p class="muted mono">lot #${e.lot} · ${e.format} · créée ${esc(e.cree_le)}</p>
${lecture ? `<p class="mono">rôle : ${e.role} · état : ${e.etat}</p>` : `<div class="rangee"><div><label>Rôle</label><select name="role">${opts(ROLES, e.role)}</select></div>
<div><label>État</label><select name="etat">${opts(ETATS, e.etat)}</select></div><div><button>Enregistrer</button></div></div>`}
<p class="muted" style="font-size:13px">Changer le rôle ne change ni le code ni le QR (CA-001-4). <a class="ok" href="/${e.code}">Ouvrir la page</a></p></form>
${e.personnage_id ? `<div class="carte"><p style="margin:0"><b>${esc(e.pseudo)}</b> · faction ${esc(e.faction_id)} · ${e.nb_etiquettes} étiquette(s)</p>
${lecture ? "" : `<form method="post" action="/admin/pin" class="rangee" style="margin-top:12px"><input type="hidden" name="code" value="${e.code}">
<div><label>Nouveau PIN (RG-019-7)</label><input name="pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required></div><div style="flex:0 0 auto"><button>Réinitialiser le PIN</button></div></form>
<form method="post" action="/admin/detacher" onsubmit="return confirm('Détacher ${e.code} de ce personnage ? L\'étiquette redevient vierge.')"><input type="hidden" name="code" value="${e.code}"><p style="margin:12px 0 0"><button class="bouton sec">Détacher l'étiquette</button></p></form>
<p style="margin:12px 0 4px" class="muted">Sanction ou mission (RG-020-11)</p>${actionsJoueur(e.personnage_id, e.pseudo ?? "")}${SCRIPT_MAINTENIR}`}</div>` : ""}`
    : p.recherche ? `<p class="err">Aucune étiquette ${esc(p.recherche)}.</p>` : "";

  return page("fr", "Admin · Déjà vu !", `<span class="chip">Maître du jeu</span>
<p class="muted mono" style="font-size:12px">${esc(p.email)} · ${lecture ? '<span class="err">lecture seule</span>' : "MJ"} · <a class="ok" href="/auth/deconnexion">déconnexion</a></p>
${p.banc ? `<p><a class="bouton sec" href="/banc">🧪 Banc d'essai</a></p>` : ""}
${p.message ? `<p class="ok">${esc(p.message)}</p>` : ""}${p.erreur ? `<p class="err">${esc(p.erreur)}</p>` : ""}
${p.suggestions ? blocSuggestions(p.suggestions, lecture) : ""}
${p.direct ? blocDirect(p.direct, lecture) : ""}
${p.frise ? blocFrise(p.frise) : ""}
${p.mj ? blocMJ(p.mj, lecture) : ""}
${p.roles ? blocRoles(p.roles, lecture) : ""}
${p.push ? blocPush(p.push, lecture) : ""}
${p.image ? blocRevelation(p.image, lecture) : ""}
<h2>Étiquettes</h2><div class="grille">${stats}</div>
<h2>Partie</h2><div class="grille"><div class="stat"><b>${p.joueurs.personnages}</b><span>personnages</span></div><div class="stat"><b>${p.joueurs.cartes}</b><span>cartes collectées</span></div><div class="stat"><b>${p.joueurs.scans}</b><span>scans</span></div></div>

${lecture ? "" : `<h2>Générer (ADM-1)</h2>
<form method="post" action="/admin/generer" class="carte"><div class="rangee">
<div><label>Quantité</label><input type="number" name="n" min="1" max="2000" value="690" required></div>
<div><label>Format</label><select name="format"><option value="petit">petit 40×30</option><option value="grand">grand 40×50</option></select></div>
<div><label>Rôle</label><select name="role">${opts(ROLES)}</select></div></div>
<p class="muted" style="font-size:13px">Costume du MJ : 1 « personnelle_mj » et 15 « speciale_mj » (10 légendaires, 5 pièges), en grand format.</p>
<p style="margin:0"><button>Générer</button></p></form>`}

<h2>Lots et export Niimbot</h2>${lots}

<h2>Chercher une étiquette</h2>
<form method="get" action="/admin" class="rangee"><div><input class="saisie" name="code" maxlength="6" value="${esc(p.recherche || "")}" autocapitalize="characters"></div><div style="flex:0 0 auto"><button>Chercher</button></div></form>
${fiche}

<h2>Heures (ADM-3)</h2>
<form method="post" action="/admin/config" class="carte"><input type="hidden" name="cle" value="heures">
<p class="muted" style="font-size:13px">Heure de Montréal, format AAAA-MM-JJTHH:MM.</p>
<textarea name="valeur" style="min-height:170px"${lecture ? " readonly" : ""}>${esc(JSON.stringify(p.heures, null, 2))}</textarea>${lecture ? "" : `<p style="margin:12px 0 0"><button>Enregistrer les heures</button></p>`}</form>

<h2>Paramètres (ADM-2)</h2>
<form method="post" action="/admin/config" class="carte"><input type="hidden" name="cle" value="parametres">
<textarea name="valeur" style="min-height:300px"${lecture ? " readonly" : ""}>${esc(JSON.stringify(p.parametres, null, 2))}</textarea>${lecture ? "" : `<p style="margin:12px 0 0"><button>Enregistrer les paramètres</button></p>`}</form>
${lecture ? "" : `<h2>Zone dangereuse</h2>
<form method="post" action="/admin/partie-zero" class="carte"><p style="margin-top:0">Efface tous les personnages, scans, collections et badges ; les étiquettes réclamées redeviennent vierges. À utiliser après les tests, avant la fête.</p>
<label>Tape ZERO pour confirmer</label><input name="confirmation" autocomplete="off" required><p style="margin:12px 0 0"><button>Remettre la partie à zéro</button></p></form>`}
<footer>LOT-1 · panneau provisoire</footer>`, false);
}

type EtatDirect = Awaited<ReturnType<typeof etatDirect>>;
const NOMS_PREREGLAGES: Record<string, string> = { lent: "Lent", normal: "Normal", rapide: "Rapide", tres_rapide: "Très rapide" };
const EFFETS_P = ["solde éclair 5 min", "glitch global", "indice bonus jumeaux", "solde éclair 5 min", "image complète"];
const heureMtl = (iso: string) => new Date(iso).toLocaleTimeString("fr-CA", { timeZone: "America/Toronto", hour: "2-digit", minute: "2-digit" });

/** Tableau de bord en direct (ADM-4) et commandes du MJ (ADM-3, ADM-5, ADM-6, ADM-15). */
function blocDirect(d: EtatDirect, lecture: boolean) {
  const q = d.quete;
  const pct = q.prochain ? Math.min(100, Math.round((q.total / q.prochain) * 100)) : 100;
  const factions = Object.entries(d.factions).sort((a, b) => b[1].points - a[1].points)
    .map(([f, x]) => `<tr><td>${esc(f)}</td><td>${Math.round(x.points)}</td><td>${x.membres}</td><td>${x.moyenne}</td></tr>`).join("");
  const paliers = q.seuils.map((s, i) => `${i < q.franchis ? "✅" : "⬜"} P-${i + 1} · ${s} <span class="muted">(${EFFETS_P[i]})</span>`).join("<br>");
  const derniers = d.evenements.slice(-6).reverse()
    .map((e) => `<li class="mono" style="font-size:13px">${heureMtl(e.debut)} · ${esc(e.type)} ${esc(e.donnees.texte ?? (e.donnees.n ? "P-" + e.donnees.n : ""))}</li>`).join("");
  return `<h2>En direct <a class="ok" style="font-size:14px" href="/admin">↻</a></h2>
<div class="carte"><p style="margin:0" class="mono">Quête ${q.total} / ${q.prochain ?? "—"} · ${q.franchis}/5 paliers · préréglage ${NOMS_PREREGLAGES[q.prereglage]}</p>
<div style="height:10px;background:#2a2433;border-radius:6px;margin:10px 0;overflow:hidden"><div style="height:100%;width:${pct}%;background:#3dff8a"></div></div>
${d.solde ? `<p class="ok mono">🔥 Solde éclair jusqu'à ${heureMtl(d.solde.fin!)}</p>` : ""}<p class="mono" style="font-size:13px;margin:0">${paliers}</p>
<p class="mono" style="font-size:13px">Révélation ${heureMtl(d.heures.revelation)} · fin ${heureMtl(d.heures.fin)}</p></div>
<table><tr><th>Faction</th><th>Points</th><th>Membres</th><th>Moyenne</th></tr>${factions}</table>
${derniers ? `<ul style="padding-left:18px">${derniers}</ul>` : ""}
${lecture ? "" : `<div class="carte">
<form method="post" action="/admin/direct/message" class="rangee"><div><label>Message à tous (bannière 15 min)</label><input name="texte" maxlength="200" required></div><div style="flex:0 0 auto"><button>Envoyer</button></div></form>
<form method="post" action="/admin/direct/glitch" class="rangee" style="margin-top:12px"><div><label>Glitch global (texte facultatif)</label><input name="texte" maxlength="120" placeholder="La Matrice a remarqué votre soirée."></div><div style="flex:0 0 auto"><button>⚡ Glitch</button></div></form>
<form method="post" action="/admin/direct/revelation" style="margin-top:12px"><label>Révélation</label><div class="rangee">
<button name="action" value="moins15" class="bouton sec">−15 min</button><button name="action" value="plus15" class="bouton sec">+15 min</button>
<button name="action" value="defaut" class="bouton sec">5 h</button>
<button name="action" value="maintenant" onclick="return confirm('Déclencher la révélation maintenant, chez tout le monde ?')">Maintenant</button></div></form>
<form method="post" action="/admin/prereglage" style="margin-top:12px"><label>Préréglage du barème (ADM-15)</label><div class="rangee">
${Object.keys(NOMS_PREREGLAGES).map((k) => `<button name="nom" value="${k}" class="${k === q.prereglage ? "" : "bouton sec"}">${NOMS_PREREGLAGES[k]}</button>`).join("")}</div>
<p class="muted" style="font-size:13px">Choisir un préréglage efface les saisies manuelles (<span class="mono">parametres.bareme</span>).</p></form></div>`}`;
}

export function pageConnexion() {
  return page("fr", "Admin · Déjà vu !", `<span class="chip">Maître du jeu</span><h1>ADMIN</h1>
<p class="muted">Accès réservé au maître du jeu.</p><p><a class="bouton" href="/auth/connexion">Se connecter avec Google</a></p>`, false);
}

/** Image cachée de la révélation (RG-009-6, RG-009-16) : stockée en base, jamais dans le dépôt (REQ-017).
 *  Le navigateur du MJ échantillonne une phrase ou une image en points ; le serveur ne fait que les valider. */
function blocRevelation(img: ImageCachee, lecture: boolean) {
  const apercu = `<canvas id="rev-apercu" width="600" height="160" style="width:100%;max-width:600px;background:#0b0910;border-radius:8px;display:block"></canvas>
<p class="mono" style="font-size:13px" id="rev-info"></p>
<script>(() => { const img = ${JSON.stringify(img).replace(/</g, "\\u003c")}; window.dessinerImageCachee = (img) => { const c = document.getElementById("rev-apercu"), x = c.getContext("2d");
  const s = Math.min((c.width - 20) / img.l, (c.height - 20) / img.h), ox = (c.width - img.l * s) / 2, oy = (c.height - img.h * s) / 2;
  x.clearRect(0, 0, c.width, c.height); x.fillStyle = "#3dff8a"; for (const [a, b] of img.p) x.fillRect(ox + a * s, oy + b * s, Math.max(1, s * 0.7), Math.max(1, s * 0.7));
  document.getElementById("rev-info").textContent = "« " + img.nom + " » · " + img.p.length + " points"; }; dessinerImageCachee(img); })();</script>`;
  const outil = lecture ? "" : `<form method="post" action="/admin/revelation/image" id="f-image" style="margin-top:12px">
<input type="hidden" name="points" id="rev-points">
<div class="rangee"><div><label>Phrase cachée (« / » pour passer à la ligne)</label><input id="rev-texte" maxlength="40" placeholder="DÉJÀ / VU !"></div>
<div style="flex:0 0 auto"><button type="button" class="bouton sec" id="rev-depuis-texte">Échantillonner</button></div></div>
<div class="rangee" style="margin-top:8px"><div><label>…ou une image (les zones sombres deviennent le dessin)</label><input type="file" id="rev-fichier" accept="image/*"></div>
<div style="flex:0 0 auto"><label><input type="checkbox" id="rev-inverser"> claires</label></div></div>
<div class="rangee" style="margin-top:8px"><button id="rev-enregistrer" disabled>Enregistrer l'image</button>
<button name="action" value="defaut" class="bouton sec" formnovalidate>Revenir à « DÉJÀ VU ! »</button></div></form>
<script>(() => {
  let courante = null;
  // Rastérise un canvas source en points sur une grille d'au plus 160 colonnes et 5000 points
  function echantillonner(src, nom, garder) {
    let pas = Math.max(1, Math.ceil(Math.max(src.width / 160, src.height / 160)));
    for (;;) {
      const l = Math.floor(src.width / pas), h = Math.floor(src.height / pas), p = [];
      const d = src.getContext("2d").getImageData(0, 0, src.width, src.height).data;
      for (let y = 0; y < h; y++) for (let x = 0; x < l; x++) {
        const i = ((y * pas + (pas >> 1)) * src.width + (x * pas + (pas >> 1))) * 4;
        if (garder(d[i], d[i + 1], d[i + 2], d[i + 3])) p.push([x, y]);
      }
      if (p.length <= 5000 || pas > 40) return { nom, l, h, p };
      pas++;
    }
  }
  function choisir(img) {
    if (img.p.length < 20) { alert("Trop peu de points : choisis une phrase ou une image plus grande."); return; }
    courante = img; dessinerImageCachee(img);
    document.getElementById("rev-points").value = JSON.stringify(img);
    document.getElementById("rev-enregistrer").disabled = false;
  }
  document.getElementById("rev-depuis-texte").onclick = () => {
    const texte = document.getElementById("rev-texte").value.trim(); if (!texte) return;
    // « / » coupe la phrase en lignes : l'image tient mieux sur un téléphone en portrait
    const lignes = texte.split("/").map((l) => l.trim()).filter(Boolean);
    const c = document.createElement("canvas"), x = c.getContext("2d"), police = "900 60px system-ui, sans-serif";
    x.font = police; c.width = Math.ceil(Math.max(...lignes.map((l) => x.measureText(l).width))) + 8; c.height = 72 * lignes.length;
    x.font = police; x.textBaseline = "middle"; x.textAlign = "center"; x.fillStyle = "#000";
    lignes.forEach((l, i) => x.fillText(l, c.width / 2, 38 + i * 72));
    const img = echantillonner(c, lignes.join(" "), (r, g, b, a) => a > 128);
    choisir(img);
  };
  document.getElementById("rev-fichier").onchange = (ev) => {
    const f = ev.target.files[0]; if (!f) return;
    const im = new Image(); im.onload = () => {
      const k = Math.min(1, 640 / Math.max(im.width, im.height)), c = document.createElement("canvas");
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
      const claires = document.getElementById("rev-inverser").checked;
      choisir(echantillonner(c, f.name.replace(/\.[^.]+$/, ""), (r, g, b) => { const l = 0.3 * r + 0.59 * g + 0.11 * b; return claires ? l > 160 : l < 96; }));
    }; im.src = URL.createObjectURL(f);
  };
  document.getElementById("f-image").addEventListener("submit", (ev) => {
    if (ev.submitter && ev.submitter.value === "defaut") return;
    if (!courante) ev.preventDefault();
  });
})();</script>`;
  return `<h2>Révélation : image cachée</h2>
<div class="carte"><p class="muted" style="font-size:13px;margin-top:0">La constellation se réorganise en ce dessin, d'autant plus nettement que la salle a franchi de paliers. Elle est figée à l'heure de la révélation.</p>
${apercu}
<p><a class="bouton sec" href="/revelation?apercu=1">Aperçu de la révélation (état actuel)</a></p>${outil}</div>`;
}

// ---------- Costume du MJ : légendaires, pièges, pause, derniers clients, sanctions, missions (FEAT-022, ADM-17 à ADM-19) ----------
type EtatMJ = Awaited<ReturnType<typeof etatMJ>>;
export const NOMS_EFFETS: Record<string, string> = {
  "L-1": "Cape de Déjà-vu +2", "L-2": "Retour sans reçu", "L-3": "La Pilule rouge", "L-4": "Miroir de la cabine d'essayage",
  "L-5": "Bon de réduction −100 %", "L-6": "Boucle temporelle", "L-7": "Dernier exemplaire", "L-8": "Dé à 20 faces doré",
  "L-9": "Ticket de caisse infini", "L-10": "Mannequin de vitrine",
  "T-1": "File d'attente du Black Friday", "T-2": "Paiement refusé", "T-3": "Mise à jour obligatoire", "T-4": "Abonnement premium", "T-5": "CAPTCHA infini",
  pause: "Fermé pour inventaire",
};
const NOMS_MISSIONS: Record<string, string> = {
  "M-1": "Ramène-moi des clients (10 min)", "M-2": "Tournée des factions (20 min)", "M-3": "Service après-vente (10 min)",
  "M-4": "Contrôle qualité (15 min)", "M-5": "Livraison express (10 min)", "M-6": "Solde privée (cadeau)", "M-7": "Mission libre",
};
const SANCTIONS = ["Avertissement", "Retour en caisse (5 min)", "Article défectueux", "Rappel de produit", "Interdit de magasin"];
const EMOJI_TYPE: Record<string, string> = { mort_vivant: "🧟", nuit: "🧛", magie: "🧙", robot: "🤖", animal: "🦄", sexy: "💋", pop: "🦸", inclassable: "🤡" };
const heureCourte = (iso: string) => new Date(iso).toLocaleTimeString("fr-CA", { timeZone: "America/Toronto", hour: "2-digit", minute: "2-digit" });

/** Niveau 5 : le bouton doit être maintenu 2 s (confirmation renforcée, RG-020-8). */
const SCRIPT_MAINTENIR = `<script>(() => { if (window.maintenirPret) return; window.maintenirPret = 1;
document.addEventListener("pointerdown", (ev) => { const b = ev.target.closest("[data-maintenir]"); if (!b) return; ev.preventDefault();
  if (!confirm("Interdit de magasin : le personnage sera suspendu. Confirmer, puis maintenir le bouton 2 s.")) return;
  const debut = Date.now(); b.textContent = "Maintiens… 2 s";
  const fin = () => { clearTimeout(minuteur); b.textContent = "5 · Interdit de magasin"; removeEventListener("pointerup", fin); };
  const minuteur = setTimeout(() => { removeEventListener("pointerup", fin); const f = b.form; f.querySelector("[name=confirme]").value = "oui"; const n = document.createElement("input"); n.type = "hidden"; n.name = "niveau"; n.value = "5"; f.appendChild(n); f.submit(); }, 2000);
  addEventListener("pointerup", fin); }); })();</script>`;

/** Sanctions et mission pour un joueur (depuis « Derniers clients » ou sa fiche). */
function actionsJoueur(id: string, pseudo: string) {
  const conf = (n: number) => n >= 3 && n <= 4 ? ` onclick="return confirm('Niveau ${n} : ${SANCTIONS[n - 1]} pour ${esc(pseudo).replace(/'/g, "\\'")} ?')"` : "";
  return `<form method="post" action="/admin/mj/sanction" class="rangee" style="gap:6px;flex-wrap:wrap"><input type="hidden" name="personnage" value="${esc(id)}">
<input type="hidden" name="confirme" value="">
${[1, 2, 3, 4].map((n) => `<button name="niveau" value="${n}" class="bouton sec" style="font-size:13px"${conf(n)}>${n} · ${SANCTIONS[n - 1]}</button>`).join("")}
<button type="button" data-maintenir class="bouton" style="font-size:13px;background:#d7263d">5 · Interdit de magasin</button></form>
<form method="post" action="/admin/mj/mission" class="rangee" style="margin-top:8px"><input type="hidden" name="personnage" value="${esc(id)}">
<div><select name="code">${Object.entries(NOMS_MISSIONS).map(([k, v]) => `<option value="${k}">${k} · ${v}</option>`).join("")}</select></div>
<div style="flex:0 0 90px"><input name="duree" inputmode="numeric" placeholder="min (M-7)"></div><div style="flex:0 0 auto"><button>Confier</button></div></form>`;
}

function blocMJ(m: EtatMJ, lecture: boolean) {
  const pause = m.pause
    ? `<p class="err mono">⛔ Fermé pour inventaire ${m.pause.fin ? `jusqu'à ${heureCourte(m.pause.fin)}` : "jusqu'à réouverture"}</p>
${lecture ? "" : `<form method="post" action="/admin/mj/rouvrir"><button>Rouvrir le magasin</button></form>`}`
    : `<p class="ok mono">Magasin ouvert</p>${lecture ? "" : `<form method="post" action="/admin/mj/pause" class="rangee" style="gap:6px">${[5, 10, 15].map((x) => `<button name="minutes" value="${x}" class="bouton sec">⛔ ${x} min</button>`).join("")}<button name="minutes" value="0" class="bouton sec">⛔ Jusqu'à réouverture</button></form>
<p class="muted" style="font-size:13px">Pendant la pause, toutes tes étiquettes bloquent 2 min le scanner de qui les scanne (RG-020-5).</p>`}`;
  const de = m.dernierExemplaire;
  const codes = m.codes.map((x) => `<tr><td class="mono">${esc(x.code)}</td><td>${x.effet.startsWith("T") ? "🪤" : "✦"} ${esc(x.effet)} · ${esc(NOMS_EFFETS[x.effet])}</td><td>${m.obtenus[x.effet] ?? 0}</td></tr>`).join("");
  const clients = m.clients.map((c) => `<details class="carte" style="padding:10px 12px;margin:6px 0"><summary style="cursor:pointer">
<span class="mono">${heureCourte(c.le)}</span> · ${EMOJI_TYPE[c.type] ?? "❔"} <b>${esc(c.pseudo)}</b>${c.suspendu ? ' <span class="err">suspendu</span>' : ""} · <span class="mono">${esc(c.code)}</span>
<span class="muted">${c.role === "personnelle_mj" ? "ta carte" : esc(c.effet ? `${c.effet} ${NOMS_EFFETS[c.effet] ?? ""}` : c.resultat)}</span></summary>
${lecture ? "" : `<div style="margin-top:10px">${actionsJoueur(c.id, c.pseudo)}</div>`}</details>`).join("");
  const missions = m.missions.map((x) => `<tr><td>${esc(x.pseudo)}</td><td>${esc(x.code)}</td><td class="mono">${x.fin ? heureCourte(x.fin) : "—"}</td>
<td>${lecture ? "" : `<form method="post" action="/admin/mj/mission/reussie" class="rangee" style="gap:4px"><input type="hidden" name="id" value="${x.id}">
${x.code === "M-7" ? `<select name="recompense"><option value="points">+20 points</option><option value="souvenirs">+3 souvenirs</option><option value="solde">5 cartes ×2</option></select>` : ""}
<button class="bouton sec" style="font-size:13px">Réussie</button><button formaction="/admin/mj/mission/annuler" class="bouton sec" style="font-size:13px">Annuler</button></form>`}</td></tr>`).join("");
  const sanctions = m.sanctions.map((x) => `<tr><td class="mono">${heureCourte(x.le)}</td><td>${esc(x.pseudo)}</td><td>${x.niveau} · ${SANCTIONS[x.niveau - 1]}</td>
<td>${lecture ? "" : `<form method="post" action="/admin/mj/sanction/annuler" onsubmit="return confirm('Annuler cette sanction ? Ce qui a été retiré est rendu.')"><input type="hidden" name="id" value="${x.id}"><button class="bouton sec" style="font-size:13px">Annuler</button></form>`}</td></tr>`).join("");
  return `<h2>Costume du MJ</h2>
<div class="carte">${pause}</div>
<h3>Légendaires et pièges</h3>
<p class="muted" style="font-size:13px">Prochain mélange à ${heureCourte(m.prochainMelange)}. Dernier exemplaire (L-7) : ${de.disponible ? '<span class="ok">en rayon</span>' : '<span class="err">rupture de stock</span>'}${de.prochaine ? ` · prochaine remise à ${heureCourte(de.prochaine)}` : ""}.</p>
${codes ? `<table><tr><th>Étiquette</th><th>Effet en ce moment</th><th>Obtenu</th></tr>${codes}</table>` : '<p class="muted">Aucune étiquette spéciale (rôle « speciale_mj »).</p>'}
<h3>Derniers clients (30 min)</h3>
${clients || '<p class="muted">Personne n\'a scanné tes étiquettes récemment.</p>'}
${missions ? `<h3>Missions en cours</h3><table><tr><th>Joueur</th><th>Mission</th><th>Fin</th><th></th></tr>${missions}</table>` : ""}
${sanctions ? `<h3>Sanctions</h3><table><tr><th>Heure</th><th>Joueur</th><th>Niveau</th><th></th></tr>${sanctions}</table>` : ""}
${lecture ? "" : SCRIPT_MAINTENIR}`;
}

type PageAdmin = Parameters<typeof pageAdmin>[0];

// ---------- Suggestions de réglage (ADM-16) ----------
const ETATS_SUGG: Record<string, string> = { proposee: "en attente", appliquee: "appliquée", ignoree: "ignorée", perimee: "remplacée" };
function blocSuggestions(l: NonNullable<PageAdmin["suggestions"]>, lecture: boolean) {
  const actuelle = l.find((x) => x.etat === "proposee");
  const histo = l.filter((x) => x !== actuelle).slice(0, 5);
  if (!actuelle && !histo.length) return "";
  return `<h2 id="suggestions">Suggestions</h2>
${actuelle ? `<div class="carte" style="border-color:var(--pink)"><p style="margin:0">🎛️ ${esc(actuelle.texte)}</p>
<p class="muted" style="font-size:13px;margin:4px 0 0">Proposée à ${heureCourte(actuelle.cree_le)}. Rien ne s'applique sans toi.</p>
${lecture ? "" : `<form method="post" action="/admin/suggestion" class="rangee" style="margin-top:12px"><input type="hidden" name="id" value="${actuelle.id}">
<div style="flex:0 0 auto"><button name="action" value="appliquer">Appliquer</button></div><div style="flex:0 0 auto"><button name="action" value="ignorer" class="bouton sec">Ignorer</button></div></form>`}</div>` : ""}
${histo.length ? `<ul class="muted" style="font-size:13px;padding-left:18px">${histo.map((x) => `<li>${heureCourte(x.cree_le)} · ${esc(x.texte)} <i>(${ETATS_SUGG[x.etat] ?? x.etat})</i></li>`).join("")}</ul>` : ""}`;
}

// ---------- Frise d'activité (ADM-14) : petits graphiques superposés, un seul axe chacun ----------
const EMOJI_REPERE: Record<string, string> = { palier: "★", sanction: "⚠", mission: "🎯", message: "📣", pause: "⏸", suggestion: "🎛" };
function blocFrise(f: NonNullable<PageAdmin["frise"]>) {
  const T = f.tranches;
  if (!T.length) return `<h2>Frise d'activité</h2><div class="carte"><p class="muted" style="margin:0">La frise démarre à l'ouverture du jeu (${heureCourte(f.debut)}).</p></div>`;
  const W = 640, G = 34, D = 8, L = W - G - D; // marge gauche (graduations), droite
  const t0 = Date.parse(f.debut), t1 = Date.parse(f.fin), x = (iso: string) => G + ((Date.parse(iso) - t0) / (t1 - t0)) * L;
  const bw = L / f.nb, pct = (c: { corrompus: number; actifs: number }) => (c.actifs ? (100 * c.corrompus) / c.actifs : 0);
  const fmt = (n: number) => Math.round(n).toLocaleString("fr-CA");
  const heures: string[] = [];
  for (let h = Math.ceil(t0 / 3600e3) * 3600e3; h <= t1; h += 3600e3) heures.push(new Date(h).toISOString());
  const verticales = (hh: number) => f.reperes.filter((r) => r.type === "heure").map((r) => `<line x1="${x(r.le)}" x2="${x(r.le)}" y1="0" y2="${hh}" class="fr-rep"><title>${esc(r.libelle)}</title></line>`).join("");
  const axeX = (hh: number) => heures.map((h) => `<text x="${x(h)}" y="${hh + 12}" class="fr-axe" text-anchor="middle">${new Date(h).toLocaleTimeString("fr-CA", { timeZone: "America/Toronto", hour: "numeric" }).replace(/\s/g, "")}</text>`).join("");
  const infobulle = (c: (typeof T)[number]) => `${heureCourte(c.debut)} · ${c.nouvelles} nouvelles cartes, ${c.rescans} rescans · ${c.joueurs} nouveaux joueurs · ${Math.round(pct(c))} % corrompus (${c.corrompus}/${c.actifs}) · cumul ${fmt(c.cumul)} / attendu ${fmt(c.attendu)}`;
  const zones = (hh: number) => T.map((c, i) => `<rect x="${G + i * bw}" y="0" width="${bw}" height="${hh}" fill="transparent"><title>${esc(infobulle(c))}</title></rect>`).join("");
  const graduation = (hh: number, max: number, suffixe = "") => `<text x="${G - 4}" y="9" class="fr-axe" text-anchor="end">${fmt(max)}${suffixe}</text><text x="${G - 4}" y="${hh}" class="fr-axe" text-anchor="end">0</text><line x1="${G}" x2="${W - D}" y1="${hh}" y2="${hh}" class="fr-base"/>`;
  const svg = (titre: string, hh: number, corps: string, legende = "") => `<p class="fr-titre">${titre}${legende}</p>
<div class="fr-defile"><svg viewBox="0 0 ${W} ${hh + 16}" class="frise" role="img" aria-label="${esc(titre)}">${verticales(hh)}${corps}${axeX(hh)}${zones(hh)}</svg></div>`;
  const puce = (c: string, l: string, tiret = false) => ` <span class="fr-leg"><i style="background:${tiret ? "none" : c};border-top:${tiret ? `2px dashed ${c}` : "0"}"></i>${l}</span>`;

  // 1. Scans par tranche : nouvelles cartes et rescans empilés (1 px d'écart)
  const h1 = 80, m1 = Math.max(4, ...T.map((c) => c.nouvelles + c.rescans));
  const barres = T.map((c, i) => {
    const xn = G + i * bw + 0.5, w = Math.max(1, bw - 1), hn = (c.nouvelles / m1) * h1, hr = (c.rescans / m1) * h1;
    return `${hn ? `<rect x="${xn}" y="${h1 - hn}" width="${w}" height="${hn}" rx="1" fill="var(--green)"/>` : ""}${hr ? `<rect x="${xn}" y="${h1 - hn - hr - (hn ? 1 : 0)}" width="${w}" height="${hr}" rx="1" fill="#7d7690"/>` : ""}`;
  }).join("");
  const evts = f.reperes.filter((r) => EMOJI_REPERE[r.type] && Date.parse(r.le) >= t0).map((r) => `<text x="${x(r.le)}" y="10" class="fr-evt" text-anchor="middle">${EMOJI_REPERE[r.type]}<title>${esc(heureCourte(r.le) + " · " + r.libelle)}</title></text>`).join("");
  const melanges = f.reperes.filter((r) => r.type === "melange").map((r) => `<line x1="${x(r.le)}" x2="${x(r.le)}" y1="${h1}" y2="${h1 + 3}" class="fr-melange"><title>${heureCourte(r.le)} · Mélange des légendaires</title></line>`).join("");

  // 2. Cumul des nouvelles cartes et courbe attendue du préréglage
  const h2 = 80, m2 = Math.max(10, ...T.map((c) => Math.max(c.cumul, c.attendu)));
  const ligne = (k: "cumul" | "attendu") => T.map((c, i) => `${i ? "L" : "M"}${(G + (i + 1) * bw).toFixed(1)} ${(h2 - (c[k] / m2) * h2).toFixed(1)}`).join(" ");
  const der = T[T.length - 1];

  // 3. Part de corrompus (0–100 %), repères à 10 et 50 %
  const h3 = 60, l3 = T.map((c, i) => `${i ? "L" : "M"}${(G + (i + 1) * bw).toFixed(1)} ${(h3 - (pct(c) / 100) * h3).toFixed(1)}`).join(" ");

  // 4. Nouveaux joueurs par tranche
  const h4 = 40, m4 = Math.max(2, ...T.map((c) => c.joueurs));
  const b4 = T.map((c, i) => c.joueurs ? `<rect x="${G + i * bw + 0.5}" y="${h4 - (c.joueurs / m4) * h4}" width="${Math.max(1, bw - 1)}" height="${(c.joueurs / m4) * h4}" rx="1" fill="var(--gold)"/>` : "").join("");

  const ratio = f.ratio === null ? "Courbe attendue : pas encore assez de joueurs." : `Connexions : <b>${f.ratio.toFixed(1).replace(".", ",")}×</b> la courbe attendue (préréglage ${NOMS_PREREGLAGES[f.prereglage]} : ${f.cartes_par_joueur} cartes par joueur d'ici la révélation).`;
  return `<h2>Frise d'activité</h2>
<div class="carte frise-carte"><p class="mono" style="margin:0 0 4px;font-size:13px">${ratio}</p>
<p class="muted" style="font-size:12px;margin:0">Tranches de ${f.tranche_min} min. Survole ou touche la frise pour le détail (sur téléphone, elle défile de côté). Repères : ★ palier · ⚠ sanction · 🎯 mission · 📣 message · ⏸ pause · 🎛 suggestion ; traits verticaux : minuit, 2 h, révélation ; petits traits : mélanges des légendaires.</p>
${svg("Scans par 5 min", h1, graduation(h1, m1) + barres + melanges + evts, puce("var(--green)", "nouvelles cartes") + puce("#7d7690", "rescans"))}
${svg("Nouvelles cartes cumulées", h2, graduation(h2, m2) + `<path d="${ligne("attendu")}" class="fr-ligne" stroke="var(--gold)" stroke-dasharray="5 4"/><path d="${ligne("cumul")}" class="fr-ligne" stroke="var(--green)"/>`,
    puce("var(--green)", `réel (${fmt(der.cumul)})`) + puce("var(--gold)", `attendu (${fmt(der.attendu)})`, true))}
${svg("Part de corrompus", h3, graduation(h3, 100, " %") + [10, 50].map((v) => `<line x1="${G}" x2="${W - D}" y1="${h3 - (v / 100) * h3}" y2="${h3 - (v / 100) * h3}" class="fr-seuil"/><text x="${W - D}" y="${h3 - (v / 100) * h3 - 2}" class="fr-axe" text-anchor="end">${v} %</text>`).join("") + `<path d="${l3}" class="fr-ligne" stroke="var(--pink)"/>`)}
${svg("Nouveaux joueurs par 5 min", h4, graduation(h4, m4) + b4)}
<details style="margin-top:8px"><summary class="muted" style="font-size:13px">Tableau</summary><div style="overflow-x:auto"><table class="fr-table"><tr><th>Heure</th><th>Nouvelles</th><th>Rescans</th><th>Joueurs +</th><th>Corrompus</th><th>Cumul / attendu</th></tr>
${T.map((c) => `<tr><td>${heureCourte(c.debut)}</td><td>${c.nouvelles}</td><td>${c.rescans}</td><td>${c.joueurs}</td><td>${Math.round(pct(c))} %</td><td>${fmt(c.cumul)} / ${fmt(c.attendu)}</td></tr>`).join("")}</table></div></details></div>`;
}

// ---------- Notifications push (FEAT-016) ----------
function blocPush(x: { cle: boolean; appareils: number; joueurs: number; en_echec: number }, lecture: boolean) {
  return `<h2>Notifications</h2>
<div class="carte">${x.cle
    ? `<p class="mono" style="margin:0">🔔 ${x.appareils} appareil(s) abonné(s) · ${x.joueurs} joueur(s)${x.en_echec ? ` · ${x.en_echec} en échec` : ""}</p>
<p class="muted" style="font-size:13px;margin:4px 0 0">Envoyées chaque minute : annonces H−30 et révélation, messages, paliers, jumeau, chat noir, sanctions, missions. Au plus une toutes les 10 min, sauf annonces, jumeau et chat noir.</p>`
    : `<p class="err" style="margin:0">Clé VAPID absente (secret VAPID_JWK) : aucune notification push.</p>`}</div>
${lecture || !x.cle ? "" : `<form method="post" action="/admin/push/test"><p><button class="bouton sec">🔔 Push de test sur les appareils du MJ</button></p></form>`}`;
}

// ---------- Jumeaux et chats noirs (FEAT-007, FEAT-008) ; contagion en direct (ADM-7) ----------
function blocRoles(r: Awaited<ReturnType<typeof etatRoles>>, lecture: boolean) {
  const pct = Math.round(r.part * 100);
  const alerte = pct > 50 ? `<p class="err">Plus de 50 % de corrompus : la durée de corruption diminue d'elle-même. Baisser la transmission de 10 points ?</p>`
    : r.actifs >= 20 && pct < 10 ? `<p class="muted">Moins de 10 % de corrompus. Relancer un foyer ?</p>` : "";
  return `<h2>Jumeaux et chats noirs</h2>
<div class="carte">
<p class="mono" style="margin:0">👯 ${r.groupes}/${r.cible} groupes (dont ${r.triples}/${r.cible_triples} triplés) · ${r.reunis} réuni(s)</p>
<p class="muted" style="font-size:13px;margin:4px 0 0">${r.depart ? `Formation depuis ${heureCourte(r.depart)}` : "Formation : à la 60e activation ou à minuit"} ; tous formés à ${heureCourte(r.complets)}.</p>
<p class="mono" style="margin:12px 0 0">🐈‍⬛ ${r.chats} chat(s) noir(s) · 🦠 ${r.corrompus}/${r.actifs} corrompus (${pct} %)</p>
${r.liste_chats.length ? `<p class="muted" style="font-size:13px;margin:4px 0 0">Chats : ${r.liste_chats.map((c) => `${EMOJI_TYPE[c.type] ?? "❔"} ${esc(c.pseudo)}`).join(", ")}</p>` : ""}
${alerte}</div>
${lecture ? "" : `<form method="post" action="/admin/contagion" class="rangee">
<div><label>Transmission (%)</label><input name="transmission" inputmode="numeric" value="${Math.round(r.transmission * 100)}"></div>
<div><label>Corruption (min)</label><input name="corruption_min" inputmode="numeric" value="${r.corruption_min}"></div>
<div style="flex:0 0 auto"><button>Appliquer</button></div></form>
<form method="post" action="/admin/contagion/foyer" onsubmit="return confirm('Corrompre 3 joueurs sains au hasard ?')"><p><button class="bouton sec">🦠 Relancer un foyer</button></p></form>`}`;
}
