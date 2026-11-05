// Pages HTML rendues par le Worker. Charte du teaser (teaser/index.html).
// Coquille de l'application du joueur et panneau du MJ.

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
:root{--bg:#0b0a0f;--bg2:#15131c;--bg3:#1e1a27;--fg:#efe9df;--muted:#aaa4b6;--pink:#ff4f8b;--green:#3dff8a;--paper:#f1ece2;--ink:#18161d;--line:#3a3445;
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
export const VERSION_APP = "l1-4";
export function pageApp(l: Langue, status = 200): Response {
  const html = `<!doctype html><html lang="${l}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0b0a0f"><meta name="robots" content="noindex">
<title>Déjà vu !</title><link rel="icon" href="/favicon.svg">
<link rel="stylesheet" href="/app.css?v=${VERSION_APP}"><script src="/app.js?v=${VERSION_APP}" defer></script></head>
<body><div id="app"><main class="ecran centre"><p class="chargement">${l === "en" ? "Looking for your size in the stockroom…" : "On cherche ta taille en réserve…"}</p></main></div>
<noscript><p style="padding:20px">JavaScript est nécessaire pour jouer. / JavaScript is required to play.</p></noscript></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

// ---------- Panneau du MJ (FEAT-020, ADM-1 à ADM-3) ----------

export interface Lot { lot: number; format: string; role: string; n: number; cree_le: string }
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
        .map((x) => `<tr><td>#${x.lot}</td><td>${x.format}</td><td>${x.role}</td><td>${x.n}</td><td>${lecture ? "—" : `<a class="ok" href="/admin/export.csv?lot=${x.lot}">CSV</a>`}</td></tr>`)
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
<form method="post" action="/admin/detacher" onsubmit="return confirm('Détacher ${e.code} de ce personnage ? L\'étiquette redevient vierge.')"><input type="hidden" name="code" value="${e.code}"><p style="margin:12px 0 0"><button class="bouton sec">Détacher l'étiquette</button></p></form>`}</div>` : ""}`
    : p.recherche ? `<p class="err">Aucune étiquette ${esc(p.recherche)}.</p>` : "";

  return page("fr", "Admin · Déjà vu !", `<span class="chip">Maître du jeu</span>
<p class="muted mono" style="font-size:12px">${esc(p.email)} · ${lecture ? '<span class="err">lecture seule</span>' : "MJ"} · <a class="ok" href="/auth/deconnexion">déconnexion</a></p>
${p.message ? `<p class="ok">${esc(p.message)}</p>` : ""}${p.erreur ? `<p class="err">${esc(p.erreur)}</p>` : ""}
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

export function pageConnexion() {
  return page("fr", "Admin · Déjà vu !", `<span class="chip">Maître du jeu</span><h1>ADMIN</h1>
<p class="muted">Accès réservé au maître du jeu.</p><p><a class="bouton" href="/auth/connexion">Se connecter avec Google</a></p>`, false);
}
