// Pages HTML rendues par le Worker. Charte du teaser (teaser/index.html).
// Coquille de l'application du joueur et panneau du MJ.
import { ECLAIRS, type bilanEclair } from "./eclair";
import type { etatDirect } from "./direct";
import type { ImageCachee } from "./revelation";
import type { etatMJ } from "./mj";
import type { etatRoles } from "./jumeaux";
import type { frise, suggestionsEnCours } from "./suivi";
import type { murAdmin } from "./mur";
import type { FicheJoueur } from "./fiche";

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
.barre-adm{position:fixed;left:0;right:0;bottom:0;z-index:20;display:grid;grid-template-columns:repeat(4,1fr);background:rgba(21,19,28,.97);border-top:1px solid var(--line);padding-bottom:env(safe-area-inset-bottom)}
.barre-adm a{display:flex;flex-direction:column;align-items:center;gap:2px;padding:9px 4px 8px;min-height:58px;color:var(--muted);text-decoration:none;font-family:var(--mono);font-size:11px;letter-spacing:.06em}
.barre-adm a span{font-size:21px}.barre-adm a[aria-current=page]{color:var(--fg);box-shadow:inset 0 3px 0 var(--pink)}
body.avec-barre main{padding-bottom:110px}
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
export const VERSION_APP = "mj-2";
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

export type VueAdmin = "direct" | "joueurs" | "preparation";

/** Barre d'onglets de l'admin (en bas, à portée de pouce). */
export const barreAdmin = (actif: VueAdmin | "photos") => `<nav class="barre-adm">${([
  ["direct", "/admin", "🔴", "Direct"], ["joueurs", "/admin/joueurs", "🔍", "Joueurs"], ["photos", "/admin/photos", "📷", "Photos"], ["preparation", "/admin/preparation", "⚙️", "Préparation"],
] as const).map(([id, href, e, l]) => `<a href="${href}"${id === actif ? ' aria-current="page"' : ""}><span>${e}</span>${l}</a>`).join("")}</nav>
<script>document.body.classList.add("avec-barre")</script>`;

export function pageAdmin(p: {
  vue: VueAdmin; ficheJ?: FicheJoueur | null;
  email: string; role: "mj" | "lecteur"; comptes: Compte[]; lots: Lot[]; heures: unknown; parametres: unknown;
  message?: string; erreur?: string; etiquette?: EtiquetteVue | null; recherche?: string;
  joueurs: { personnages: number; scans: number; cartes: number };
  /** Bouton du banc d'essai (selon l'environnement et le rôle) */
  banc?: boolean;
  direct?: EtatDirect;
  eclair?: Awaited<ReturnType<typeof bilanEclair>>;
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
<p class="muted" style="font-size:13px">Changer le rôle ne change ni le code ni le QR (CA-001-4).</p></form>
${e.personnage_id ? `<div class="carte"><p style="margin:0"><b>${esc(e.pseudo)}</b> · faction ${esc(e.faction_id)} · ${e.nb_etiquettes} étiquette(s)</p>
${lecture ? "" : `<form method="post" action="/admin/pin" class="rangee" style="margin-top:12px"><input type="hidden" name="code" value="${e.code}">
<div><label>Nouveau PIN (RG-019-7)</label><input name="pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required></div><div style="flex:0 0 auto"><button>Réinitialiser le PIN</button></div></form>
<form method="post" action="/admin/detacher" onsubmit="return confirm('Détacher ${e.code} de ce personnage ? L\'étiquette redevient vierge.')"><input type="hidden" name="code" value="${e.code}"><p style="margin:12px 0 0"><button class="bouton sec">Détacher l'étiquette</button></p></form>
<p style="margin:12px 0 4px" class="muted">Sanction ou mission (RG-020-11)</p>${actionsJoueur(e.personnage_id, e.pseudo ?? "")}${SCRIPT_MAINTENIR}`}</div>` : ""}`
    : p.recherche ? `<p class="err">Aucune étiquette ${esc(p.recherche)}.</p>` : "";

  const entete = `<span class="chip">Maître du jeu</span>
${p.message ? `<p class="ok">${esc(p.message)}</p>` : ""}${p.erreur ? `<p class="err">${esc(p.erreur)}</p>` : ""}`;
  const partie = `<h2>Partie</h2><div class="grille"><div class="stat"><b>${p.joueurs.personnages}</b><span>personnages</span></div><div class="stat"><b>${p.joueurs.cartes}</b><span>cartes collectées</span></div><div class="stat"><b>${p.joueurs.scans}</b><span>scans</span></div></div>`;

  const corps = p.vue === "direct" ? `${entete}
${p.suggestions ? blocSuggestions(p.suggestions, lecture) : ""}
${p.direct ? blocDirect(p.direct, lecture, p.eclair ?? null) : ""}
${p.mj ? blocMJ(p.mj, lecture) : ""}
${partie}
${p.frise ? blocFrise(p.frise) : ""}`

  : p.vue === "joueurs" ? `${entete}
<h2>Scanner une étiquette</h2>${SCANNER_ADMIN}
<form method="get" action="/admin/joueurs" class="rangee" style="margin-top:12px"><div><input class="saisie" name="code" maxlength="6" value="${esc(p.recherche || "")}" autocapitalize="characters" placeholder="CODE"></div><div style="flex:0 0 auto"><button>Chercher</button></div></form>
${p.ficheJ ? blocFiche(p.ficheJ) : ""}
${fiche}
${p.roles ? blocRoles(p.roles, lecture) : ""}`

  : `${entete}
<p class="muted mono" style="font-size:12px">${esc(p.email)} · ${lecture ? '<span class="err">lecture seule</span>' : "MJ"} · <a class="ok" href="/auth/deconnexion">déconnexion</a></p>
${p.banc ? `<p><a class="bouton sec" href="/banc">🧪 Banc d'essai</a></p>` : ""}
${p.push ? blocPush(p.push, lecture) : ""}
${p.image ? blocRevelation(p.image, lecture) : ""}
<h2>Étiquettes</h2><div class="grille">${stats}</div>
${lecture ? "" : `<h2>Codes du jeu</h2>
<form method="post" action="/admin/charger-jeu" class="carte"><p class="muted" style="font-size:13px;margin-top:0">Les codes imprimés sur papier (<span class="mono">donnees/etiquettes-jeu.csv</span>, livré avec le déploiement) : 890 étiquettes au même format, dont le costume du MJ (1 personnelle, 15 spéciales). Rejouable : n'ajoute que les codes absents.</p>
<p style="margin:0"><button>Charger les codes du jeu</button></p></form>`}
${lecture ? "" : `<h2>Générer (ADM-1)</h2>
<form method="post" action="/admin/generer" class="carte"><div class="rangee">
<div><label>Quantité</label><input type="number" name="n" min="1" max="2000" value="690" required></div>
<div><label>Format</label><select name="format"><option value="petit">petit 40×30</option><option value="grand">grand 40×50</option></select></div>
<div><label>Rôle</label><select name="role">${opts(ROLES)}</select></div></div>
<p class="muted" style="font-size:13px">Costume du MJ : 1 « personnelle_mj » et 15 « speciale_mj » (10 légendaires, 5 pièges), en grand format.</p>
<p style="margin:0"><button>Générer</button></p></form>`}
<h2>Lots et export Niimbot</h2>${lots}
<h2>Heures (ADM-3)</h2>
<form method="post" action="/admin/config" class="carte"><input type="hidden" name="cle" value="heures">
<p class="muted" style="font-size:13px">Heure de Montréal, format AAAA-MM-JJTHH:MM.</p>
<textarea name="valeur" style="min-height:170px"${lecture ? " readonly" : ""}>${esc(JSON.stringify(p.heures, null, 2))}</textarea>${lecture ? "" : `<p style="margin:12px 0 0"><button>Enregistrer les heures</button></p>`}</form>
<h2>Paramètres (ADM-2)</h2>
<form method="post" action="/admin/config" class="carte"><input type="hidden" name="cle" value="parametres">
<textarea name="valeur" style="min-height:300px"${lecture ? " readonly" : ""}>${esc(JSON.stringify(p.parametres, null, 2))}</textarea>${lecture ? "" : `<p style="margin:12px 0 0"><button>Enregistrer les paramètres</button></p>`}</form>
${lecture ? "" : `<h2>Zone dangereuse</h2>
<form method="post" action="/admin/partie-zero" class="carte"><p style="margin-top:0">Efface tous les personnages, scans, collections et badges ; les étiquettes réclamées redeviennent vierges. À utiliser après les tests, avant la fête.</p>
<label>Tape ZERO pour confirmer</label><input name="confirmation" autocomplete="off" required><p style="margin:12px 0 0"><button>Remettre la partie à zéro</button></p></form>`}`;

  return page("fr", "Admin · Déjà vu !", corps + barreAdmin(p.vue), false);
}

/** Photos de scan côté MJ (RG-017-6) : grille de toutes les photos ; toucher une vignette ouvre le plein écran, où l'on swipe.
 *  Appui long de 2 s (grille ou plein écran) : la photo est écartée du mur et de la révélation (cadre rouge) ; encore 2 s : rétablie.
 *  « Vue joueurs » applique l'effet déformant du mur ; sinon photos brutes, pour la modération. */
export function pageGalerie(m: Awaited<ReturnType<typeof murAdmin>>, lecture: boolean) {
  const donnees = JSON.stringify({ ...m, photos: m.photos.map((f) => ({ ...f, heure: heureMtl(f.le) })) }).replace(/</g, "\\u003c");
  return page("fr", "Photos · Déjà vu !", `<style>
main{max-width:none;padding:0}
.g-haut{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:calc(10px + env(safe-area-inset-top)) 16px 10px;background:var(--bg);border-bottom:1px solid var(--line)}
.g-haut a{color:var(--green);text-decoration:none;font-weight:700}.g-compte{font-family:var(--mono);font-size:13px;color:var(--muted);text-align:center;flex:1}
.bascule{background:var(--bg3);color:var(--fg);border:1.5px solid var(--line);padding:8px 12px;font-size:14px;border-radius:999px}
.bascule[aria-pressed=true]{background:var(--pink);color:var(--ink);border-color:var(--pink)}
.aide{color:var(--muted);font-size:14px;margin:12px 16px}
.grille-ph{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:0 16px 40px}
@media (min-width:700px){.grille-ph{grid-template-columns:repeat(auto-fill,minmax(160px,1fr))}}
.ph{position:relative;aspect-ratio:3/4;border-radius:10px;overflow:hidden;outline:4px solid transparent;outline-offset:-4px;background:var(--bg3);-webkit-touch-callout:none;user-select:none;-webkit-user-select:none}
.ph img,.plein-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none}
.ph .fantome,.plein-img .fantome{display:none}
.ph::after{content:"";position:absolute;inset:0;border-radius:10px;border:4px solid transparent;z-index:3;pointer-events:none}.ph.ecartee::after{border-color:#ff2a2a}.ph.ecartee img{opacity:.45}
.ph .jauge,.plein-img .jauge{position:absolute;left:0;bottom:0;height:5px;width:0;background:#ff2a2a;z-index:2}
.appui .jauge{width:100%;transition:width 2s linear}
.plein{position:fixed;inset:0;z-index:30;background:var(--bg)}.plein[hidden]{display:none}
.plein .g-haut{position:absolute;left:0;right:0}
.galerie{position:absolute;inset:0;display:flex;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scrollbar-width:none;overscroll-behavior:contain}
.galerie::-webkit-scrollbar{display:none}
.diapo{flex:0 0 100%;scroll-snap-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:80px 16px 90px}
.plein-img{position:relative;width:min(86vw,440px);aspect-ratio:3/4;max-height:64dvh;border-radius:14px;overflow:hidden;outline:5px solid transparent;outline-offset:4px;-webkit-touch-callout:none;user-select:none;-webkit-user-select:none}
.plein-img img{object-fit:contain;background:#000}
.diapo.ecartee .plein-img{outline-color:#ff2a2a}.diapo.ecartee .plein-img img{opacity:.55}
.etiq{font-family:var(--mono);font-size:13px;color:var(--muted);text-align:center}.etiq b{color:#ff2a2a}
.fermer{font-size:20px;background:var(--bg3);color:var(--fg);border:1.5px solid var(--line);width:44px;height:44px;padding:0;border-radius:50%}
.g-bas{position:absolute;left:0;right:0;bottom:0;padding:12px 16px calc(14px + env(safe-area-inset-bottom));text-align:center;font-size:14px;color:var(--muted);background:linear-gradient(transparent,var(--bg) 40%)}
/* Vue joueurs : même effet que le mur de l'app (dédoublement, décalage des couleurs) */
.effet .ph img,.effet .plein-img img{filter:blur(1.5px) saturate(1.3) contrast(1.1)}
.effet .ph .fantome,.effet .plein-img .fantome{display:block;mix-blend-mode:screen;opacity:.6}
.effet .f1{transform:translate(8%,-3%) scale(1.04);filter:blur(1.5px) grayscale(1) sepia(1) hue-rotate(290deg) saturate(5)!important}
.effet .f2{transform:translate(-7%,4%) scale(1.04);filter:blur(1.5px) grayscale(1) sepia(1) hue-rotate(80deg) saturate(5)!important;opacity:.45!important}
.vide{color:var(--muted);padding:40px 24px;text-align:center}
</style>
<div class="g-haut"><b>📷 Photos</b><div class="g-compte" id="compte"></div><button class="bascule" id="bascule" aria-pressed="false">Vue joueurs</button></div>
<p class="aide">${lecture ? "Lecture seule : touche une photo pour l'agrandir." : "Touche une photo pour l'agrandir et swiper. <b>Appui long 2 s</b> : écarter la photo du mur et de la révélation (cadre rouge). Encore 2 s : la rétablir."}</p>
<div class="grille-ph" id="grille"></div>
<div class="plein" id="plein" hidden><div class="g-haut"><button class="fermer" id="fermer" aria-label="Fermer">✕</button><div class="g-compte" id="compte-plein"></div><span style="width:44px"></span></div>
<div class="galerie" id="galerie"></div><div class="g-bas">${lecture ? "Swipe pour parcourir." : "Swipe pour parcourir. <b>Appui long 2 s</b> : écarter ou rétablir."}</div></div>
<script>
(() => {
  const D = ${donnees}, LECTURE = ${lecture ? "true" : "false"};
  const $ = (id) => document.getElementById(id);
  const grille = $("grille"), galerie = $("galerie"), plein = $("plein");
  let photos = D.photos, suite = D.suite, total = D.total, ecartees = D.masquees, charge = false, courante = 0;
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const imgs = (src) => '<img alt="" src="' + src + '"><img alt="" class="fantome f1" src="' + src + '"><img alt="" class="fantome f2" src="' + src + '"><i class="jauge"></i>';
  const ECARTEE = "Écartée du mur et de la révélation";
  function maj() {
    const e = ecartees + " écartée" + (ecartees > 1 ? "s" : "");
    $("compte").textContent = total + " photo" + (total > 1 ? "s" : "") + " · " + e;
    $("compte-plein").textContent = (courante + 1) + " / " + total + " · " + e;
  }
  function ajouter(liste) {
    for (const f of liste) {
      const i = photos.indexOf(f);
      const v = document.createElement("div");
      v.className = "ph" + (f.masquee ? " ecartee" : ""); v.dataset.id = f.id; v.innerHTML = imgs(f.image);
      geste(v, f, () => ouvrir(i));
      grille.appendChild(v);
      const d = document.createElement("div");
      d.className = "diapo" + (f.masquee ? " ecartee" : ""); d.dataset.id = f.id;
      d.innerHTML = '<div class="plein-img">' + imgs(f.image) + '</div><div class="etiq">' + esc(f.pseudo || "?") + " · " + esc(f.heure) + "<br><b>" + (f.masquee ? ECARTEE : "") + "</b></div>";
      geste(d.querySelector(".plein-img"), f, null);
      galerie.appendChild(d);
    }
  }
  if (!photos.length) grille.outerHTML = '<p class="vide">Aucune photo pour l\\'instant. Elles arrivent avec les scans faits dans l\\'app.</p>';
  else ajouter(photos);
  maj();

  // Grille → plein écran, et retour à la même photo
  function ouvrir(i) {
    plein.hidden = false; document.body.style.overflow = "hidden";
    galerie.scrollLeft = i * galerie.clientWidth; courante = i; maj();
  }
  $("fermer").onclick = () => {
    plein.hidden = true; document.body.style.overflow = "";
    const v = grille.children[courante]; if (v) v.scrollIntoView({ block: "center" });
  };
  galerie.addEventListener("scroll", () => {
    courante = Math.round(galerie.scrollLeft / galerie.clientWidth); maj();
    if (courante >= photos.length - 5) plus();
  }, { passive: true });
  addEventListener("scroll", () => { if (innerHeight + scrollY > document.body.scrollHeight - 600) plus(); }, { passive: true });
  async function plus() {
    if (!suite || charge || !photos.length) return;
    charge = true;
    try {
      const r = await (await fetch("/admin/photos.json?avant=" + photos[photos.length - 1].id, { credentials: "same-origin" })).json();
      photos = photos.concat(r.photos); suite = r.suite; ajouter(r.photos);
    } catch {} finally { charge = false; }
  }

  // Toucher court : ouvrir (grille) ; appui long de 2 s : écarter ou rétablir (partout, sauf en lecture seule)
  function geste(el, f, toucher) {
    let minuterie = null, x0 = 0, y0 = 0, actif = false, long = false;
    const annuler = () => { clearTimeout(minuterie); minuterie = null; el.classList.remove("appui"); };
    el.addEventListener("contextmenu", (e) => e.preventDefault());
    el.addEventListener("pointerdown", (e) => {
      x0 = e.clientX; y0 = e.clientY; actif = true; long = false;
      if (LECTURE) return;
      el.classList.add("appui");
      minuterie = setTimeout(() => { annuler(); long = true; basculer(f); }, 2000);
    });
    el.addEventListener("pointermove", (e) => { if (actif && Math.hypot(e.clientX - x0, e.clientY - y0) > 12) { actif = false; annuler(); } });
    el.addEventListener("pointerup", () => { const court = actif && !long && minuterie; annuler(); if ((court || (LECTURE && actif)) && toucher) toucher(); actif = false; });
    for (const t of ["pointercancel", "pointerleave"]) el.addEventListener(t, () => { actif = false; annuler(); });
  }
  async function basculer(f) {
    const voulu = !f.masquee;
    const corps = new FormData(); corps.set("id", f.id); corps.set("masquee", voulu ? "1" : "0");
    try {
      const r = await fetch("/admin/mur/masquer", { method: "POST", body: corps, credentials: "same-origin", headers: { "X-Galerie": "1" } });
      if (!r.ok) throw 0;
      f.masquee = voulu ? 1 : 0; ecartees += voulu ? 1 : -1;
      document.querySelectorAll('[data-id="' + f.id + '"]').forEach((x) => x.classList.toggle("ecartee", voulu));
      const b = galerie.querySelector('[data-id="' + f.id + '"] .etiq b'); if (b) b.textContent = voulu ? ECARTEE : "";
      if (navigator.vibrate) navigator.vibrate(voulu ? [40, 60, 40] : 30);
      maj();
    } catch { alert("Échec : réseau ou session expirée. Recharge la page."); }
  }

  // Vue joueurs : l'effet du mur, mémorisé sur ce téléphone
  const bascule = $("bascule");
  const appliquer = (on) => { document.body.classList.toggle("effet", on); bascule.setAttribute("aria-pressed", on); try { localStorage.setItem("dv-admin-effet", on ? "1" : ""); } catch {} };
  try { appliquer(localStorage.getItem("dv-admin-effet") === "1"); } catch {}
  bascule.onclick = () => appliquer(!document.body.classList.contains("effet"));
})();
</script>${barreAdmin("photos")}`, false);
}

/** Scanner de l'admin : la caméra lit l'étiquette et ouvre la fiche du joueur (BarcodeDetector, sinon jsQR). */
const SCANNER_ADMIN = `<div class="carte" id="sc-zone" style="padding:0;overflow:hidden">
<button class="bouton" id="sc-ouvrir" type="button" style="width:100%;border-radius:0;padding:16px">📷 Ouvrir le scanner</button>
<div id="sc-vue" hidden style="position:relative;background:#000;aspect-ratio:4/3">
<video id="sc-video" playsinline muted autoplay style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
<div style="position:absolute;left:50%;top:50%;width:56%;aspect-ratio:1;transform:translate(-50%,-50%);border:3px solid var(--green);border-radius:16px;box-shadow:0 0 0 999px rgba(11,10,15,.45)"></div>
<div style="position:absolute;left:10px;right:10px;bottom:10px;display:flex;gap:10px;justify-content:center">
<button type="button" class="bouton sec" id="sc-lampe" hidden>🔦 Lampe</button><button type="button" class="bouton sec" id="sc-fermer">Fermer</button></div></div>
<p class="muted" id="sc-note" style="font-size:13px;margin:8px 12px" hidden></p></div>
<script>(() => {
  const $ = (id) => document.getElementById(id);
  let flux = null, fini = true, minuterie = null;
  const code = (texte) => {
    try { const u = new URL(String(texte).trim()); const h = u.host.toLowerCase();
      if (h !== "p.uyt.re" && h !== location.host.toLowerCase()) return null;
      const m = u.pathname.match(/^\\/([A-Za-z0-9]{4,6})\\/?$/); return m ? m[1].toUpperCase() : null; } catch { return null; }
  };
  const note = (t) => { $("sc-note").hidden = !t; $("sc-note").textContent = t || ""; };
  function arreter() { fini = true; clearTimeout(minuterie); if (flux) flux.getTracks().forEach((p) => p.stop()); flux = null; $("sc-vue").hidden = true; $("sc-ouvrir").hidden = false; }
  async function lecteur() {
    if ("BarcodeDetector" in window) {
      try { if ((await BarcodeDetector.getSupportedFormats()).includes("qr_code")) { const d = new BarcodeDetector({ formats: ["qr_code"] }); return async (v) => { const r = await d.detect(v); return r.length ? r[0].rawValue : null; }; } } catch {}
    }
    if (!window.jsQR) await new Promise((ok, non) => { const s = document.createElement("script"); s.src = "/vendor/jsqr-1.4.0.min.js"; s.onload = ok; s.onerror = non; document.head.appendChild(s); });
    const cv = document.createElement("canvas"), cx = cv.getContext("2d", { willReadFrequently: true });
    return (v) => { const w = v.videoWidth, h = v.videoHeight; if (!w) return null; const k = Math.min(1, 640 / Math.max(w, h));
      cv.width = Math.round(w * k); cv.height = Math.round(h * k); cx.drawImage(v, 0, 0, cv.width, cv.height);
      const r = window.jsQR(cx.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height, { inversionAttempts: "dontInvert" }); return r ? r.data : null; };
  }
  async function ouvrir() {
    note("");
    try { flux = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" } } }); }
    catch (e) { note(e && e.name === "NotAllowedError" ? "Caméra refusée : autorise-la dans les réglages du site." : "Pas de caméra disponible ici : tape le code."); return; }
    fini = false; $("sc-ouvrir").hidden = true; $("sc-vue").hidden = false;
    const v = $("sc-video"); v.srcObject = flux; await v.play().catch(() => {});
    setTimeout(() => { const piste = flux && flux.getVideoTracks()[0], caps = piste && piste.getCapabilities ? piste.getCapabilities() : {};
      if (!caps.torch) return; let on = false; $("sc-lampe").hidden = false;
      $("sc-lampe").onclick = async () => { try { await piste.applyConstraints({ advanced: [{ torch: !on }] }); on = !on; } catch {} }; }, 300);
    let lire; try { lire = await lecteur(); } catch { arreter(); note("Lecteur de QR indisponible : tape le code."); return; }
    const boucle = async () => {
      if (fini) return;
      let t = null; try { if (v.readyState >= 2) t = await lire(v); } catch {}
      const c = t && code(t);
      if (c) { if (navigator.vibrate) navigator.vibrate(30); arreter(); location.href = "/admin/joueurs?code=" + encodeURIComponent(c); return; }
      if (t) note("Ce QR n'est pas une étiquette du jeu.");
      minuterie = setTimeout(boucle, 120);
    };
    boucle();
  }
  $("sc-ouvrir").onclick = ouvrir; $("sc-fermer").onclick = arreter;
  addEventListener("pagehide", arreter);
})();</script>`;

const FACTIONS_LIB: Record<string, string> = { ordre: "Ordre", chaos: "Chaos", friperie: "Friperie", influence: "Influenceurs", necro: "Nécromanciens" };
const RESULTATS_LIB: Record<string, string> = { nouvelle_carte: "nouvelle carte", deja_vu: "déjà vu", deja_vu_repete: "déjà vu (trop tôt)", creation: "création", soi_meme: "soi-même", special: "étiquette spéciale", special_mj: "spéciale (MJ)", legendaire: "légendaire", piege: "piège", bloque: "bloqué", suspendu: "suspendu", pause: "pause du MJ" };
const SANCTIONS_LIB = ["", "Avertissement", "Retour en caisse", "Article défectueux", "Rappel de produit", "Interdit de magasin"];

/** Fiche complète d'un joueur pour le MJ : identité, jeu, secrets, modération. */
function blocFiche(f: FicheJoueur) {
  const h = (iso: string | null) => (iso ? heureMtl(iso) : "—");
  const ligne = (k: string, v: string) => `<tr><th>${k}</th><td>${v}</td></tr>`;
  const roles: string[] = [];
  if (f.groupe) roles.push(`${f.groupe.type === "triples" ? "Triplé" : "Jumeau"} ${f.groupe.reuni ? '<span class="ok">· groupe réuni</span>' : ""} : ${f.groupe.membres.map((m) => `${esc(m.pseudo)} ${m.retrouve ? "✅" : "⏳"}`).join(", ")}`);
  if (f.chat_noir_le) roles.push(`🐈‍⬛ Chat noir depuis ${h(f.chat_noir_le)}`);
  if (f.corruption) roles.push(f.corruption.actif ? `🦠 Corrompu (${esc(f.corruption.cause)}) jusqu'à ${h(f.corruption.fin)}` : `Ancienne corruption (${esc(f.corruption.cause)})${f.corruption.immun_jusqu_a ? `, immunisé jusqu'à ${h(f.corruption.immun_jusqu_a)}` : ""}`);
  const etat = f.suspendu ? '<span class="err">⛔ suspendu</span>' : f.bloque_jusqu_a ? `<span class="err">bloqué jusqu'à ${h(f.bloque_jusqu_a)} (${esc(f.bloque_cause ?? "?")})</span>` : '<span class="ok">actif</span>';
  return `<div class="carte" id="fiche-joueur">
<p style="margin:0;font-family:var(--display);font-size:24px;line-height:1.1">${esc(f.pseudo)}${f.est_mj ? ' <span class="chip">MJ</span>' : ""}</p>
<p class="muted mono" style="font-size:12px;margin:6px 0 0">${esc(f.type)} · ${esc(f.couleur)} · ${esc(f.classe)} · ${esc(f.attributs.join(", ") || "sans attribut")} · ${esc(f.langue)} · créé ${h(f.cree_le)}</p>
<table style="margin-top:10px">
${ligne("État", etat)}
${ligne("Étiquettes", f.etiquettes.map((e) => `<a class="ok mono" href="/admin/joueurs?code=${e.code}">${e.code}</a> ${esc(FACTIONS_LIB[e.faction ?? ""] ?? e.faction ?? "")}${e.role !== "normale" ? ` (${esc(e.role)})` : ""}`).join(" · "))}
${ligne("Collection", `${f.stats.cartes} cartes · scanné par ${f.stats.scanne_par} · ${f.stats.deja_vus} déjà vus · ${f.stats.scans} scans`)}
${ligne("Points", f.stats.points.map((x) => `${esc(FACTIONS_LIB[x.faction] ?? x.faction)} ${x.points}`).join(" · ") || "—")}
${ligne("Mémoire", `🧠 ${f.souvenirs}`)}
${ligne("Médailles", f.badges.length ? f.badges.map((b) => esc(b.badge)).join(", ") : "—")}
${ligne("Secrets", roles.join("<br>") || "—")}
${ligne("Effets", f.effets.map((e) => `${esc(e.effet)}${e.fin ? ` → ${h(e.fin)}` : ""}${e.reste != null ? ` (${e.reste})` : ""}`).join(", ") || "—")}
${ligne("Sanctions", f.sanctions.map((x) => `${SANCTIONS_LIB[x.niveau] ?? x.niveau} ${h(x.le)}${x.annulee ? " (annulée)" : ""}`).join("<br>") || "—")}
${ligne("Missions", f.missions.map((m) => `${esc(m.code)} ${esc(m.etat)} ${h(m.debut)}`).join("<br>") || "—")}
${ligne("Duels", `${f.duels.joues} joués · ${f.duels.gagnes} gagnés`)}
${ligne("Photos", `accord ${f.photos_ok ? "✅" : "❌"} · ${f.photos.prises} prises · ${f.photos.de_lui} de son étiquette · ${f.photos.ecartees} écartées · <a class="ok" href="/admin/photos">galerie</a>`)}
${ligne("Téléphones", `${f.appareils.n} · vu ${h(f.appareils.vu_le)} · push ${f.appareils.push ? "✅" : "❌"}`)}
</table>
<p style="margin:12px 0 4px" class="muted">Derniers scans</p>
<table>${f.derniers.map((d) => `<tr><td class="mono">${h(d.le)}</td><td>${esc(RESULTATS_LIB[d.resultat] ?? d.resultat)}</td><td>${esc(d.pseudo ?? "")}</td></tr>`).join("") || '<tr><td class="muted">Aucun scan.</td></tr>'}</table>
</div>`;
}

type EtatDirect = Awaited<ReturnType<typeof etatDirect>>;
const NOMS_PREREGLAGES: Record<string, string> = { lent: "Lent", normal: "Normal", rapide: "Rapide", tres_rapide: "Très rapide" };
const EFFETS_P = ["solde éclair 5 min", "glitch global", "indice bonus jumeaux", "solde éclair 5 min", "image complète"];
const heureMtl = (iso: string) => new Date(iso).toLocaleTimeString("fr-CA", { timeZone: "America/Toronto", hour: "2-digit", minute: "2-digit" });

/** Tableau de bord en direct (ADM-4) et commandes du MJ (ADM-3, ADM-5, ADM-6, ADM-15). */
function blocDirect(d: EtatDirect, lecture: boolean, eclair: Awaited<ReturnType<typeof bilanEclair>> = null) {
  const q = d.quete;
  const pct = q.prochain ? Math.min(100, Math.round((q.total / q.prochain) * 100)) : 100;
  const factions = Object.entries(d.factions).sort((a, b) => b[1].points - a[1].points)
    .map(([f, x]) => `<tr><td>${esc(f)}</td><td>${Math.round(x.points)}</td><td>${x.membres}</td><td>${x.moyenne}</td></tr>`).join("");
  const paliers = q.seuils.map((s, i) => `${i < q.franchis ? "✅" : "⬜"} P-${i + 1} · ${s} <span class="muted">(${EFFETS_P[i]})</span>`).join("<br>");
  const derniers = d.evenements.slice(-6).reverse()
    .map((e) => `<li class="mono" style="font-size:13px">${heureMtl(e.debut)} · ${esc(e.type)} ${esc(e.donnees.texte ?? e.donnees.code ?? (e.donnees.n ? "P-" + e.donnees.n : ""))}</li>`).join("");
  return `<h2>En direct <a class="ok" style="font-size:14px" href="/admin">↻</a></h2>
<div class="carte"><p style="margin:0" class="mono">Quête ${q.total} / ${q.prochain ?? "—"} · ${q.franchis}/5 paliers · préréglage ${NOMS_PREREGLAGES[q.prereglage]}</p>
<div style="height:10px;background:#2a2433;border-radius:6px;margin:10px 0;overflow:hidden"><div style="height:100%;width:${pct}%;background:#3dff8a"></div></div>
${d.solde ? `<p class="ok mono">🔥 Solde éclair jusqu'à ${heureMtl(d.solde.fin!)}</p>` : ""}<p class="mono" style="font-size:13px;margin:0">${paliers}</p>
<p class="mono" style="font-size:13px">Révélation ${heureMtl(d.heures.revelation)} · fin ${heureMtl(d.heures.fin)}</p></div>
<table><tr><th>Faction</th><th>Points</th><th>Membres</th><th>Moyenne</th></tr>${factions}</table>
${derniers ? `<ul style="padding-left:18px">${derniers}</ul>` : ""}
${eclair ? `<p class="ok mono">⚡ Mission éclair ${esc(eclair.donnees.code)} jusqu'à ${heureMtl(eclair.fin)} · ${eclair.reussites} réussite(s)${eclair.donnees.type ? ` · type ${esc(eclair.donnees.type)}` : ""}${eclair.donnees.attributs ? ` · ${esc(eclair.donnees.attributs.join(" + "))}` : ""}</p>` : ""}
${lecture ? "" : `<div class="carte">
${eclair
    ? `<form method="post" action="/admin/direct/eclair-stop" class="rangee"><div><label>Mission éclair (FEAT-013)</label><p class="muted" style="margin:0;font-size:13px">En cours : une seule à la fois.</p></div><div style="flex:0 0 auto"><button class="bouton sec">Arrêter</button></div></form>`
    : `<form method="post" action="/admin/direct/eclair" class="rangee"><div><label>Mission éclair à tous (FEAT-013)</label><select name="code">${Object.entries(ECLAIRS).map(([k, v]) => `<option value="${k}">${k} · ${esc(v.nom)} · ${v.duree} min · +${v.points} pts</option>`).join("")}</select></div><div style="flex:0 0 auto"><button>⚡ Lancer</button></div></form>`}
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

export function pageConnexion(interrompue = false) {
  const note = interrompue
    ? `<p>La connexion a été interrompue (délai dépassé ou autre fenêtre). Réessaie depuis cette page, sans changer d'application.</p>`
    : "";
  return page("fr", "Admin · Déjà vu !", `<span class="chip">Maître du jeu</span><h1>ADMIN</h1>
<p class="muted">Accès réservé au maître du jeu.</p>${note}<p><a class="bouton" href="/auth/connexion">${interrompue ? "Réessayer avec Google" : "Se connecter avec Google"}</a></p>`, false);
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
  const clients = m.clients.slice(0, 12).map((c) => `<details class="carte" style="padding:10px 12px;margin:6px 0"><summary style="cursor:pointer">
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
<h3>Derniers clients (30 min)${m.clients.length > 12 ? ` · 12 sur ${m.clients.length}` : ""}</h3>
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
