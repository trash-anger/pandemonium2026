// Banc d'essai local (jamais actif en production) : page /banc, API de simulation /__dev/*,
// et agent injecté dans les pages du jeu pour recevoir les injections du banc (postMessage).
import bancHtml from "../banc/banc.html";
import { auHasard, ATTRIBUTS, CLASSES, COULEURS, FACTIONS, genererPseudo, TYPES } from "./catalogue";
import { genererCodes } from "./codes";
import { definirPin, nouvelAppareil, sha256 } from "./jeu";
import { bancProd } from "./mode";
import { ecrireConfig, HEURES_PAR_DEFAUT, lireConfig, lireParametres } from "./config";

export interface EnvDev {
  DB: D1Database;
  PUBLIC_ORIGIN: string;
  SESSION_SECRET?: string;
  /** « actif » sur le Worker d'aperçu des PR (wrangler.jsonc, env apercu) */
  BANC?: string;
  BANC_SESSION?: boolean;
}

const TABLES_PARTIE = ["appareils", "scans", "collection", "badges", "pin_essais", "reactions", "compteurs", "points_faction", "evenements", "revelations", "personnages"]; // appareils avant personnages (clé étrangère)

async function persoDuJeton(env: EnvDev, jeton: unknown): Promise<string | null> {
  if (typeof jeton !== "string" || !jeton) return null;
  const r = await env.DB.prepare("SELECT personnage_id AS id FROM appareils WHERE empreinte = ?").bind(await sha256(jeton)).first<{ id: string }>();
  return r?.id ?? null;
}

export { devActif } from "./mode";

const json = (v: unknown, status = 200) =>
  new Response(JSON.stringify(v), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

/** Ajoute l'agent du banc aux pages HTML du jeu (dev seulement). */
export async function avecAgent(r: Response): Promise<Response> {
  if (!(r.headers.get("Content-Type") || "").startsWith("text/html")) return r;
  const html = (await r.text()).replace("</body>", '<script src="/__dev/agent.js"></script></body>');
  return new Response(html, { status: r.status, headers: r.headers });
}

export async function routeDev(req: Request, env: EnvDev, url: URL): Promise<Response | null> {
  const p = url.pathname;
  // En production, seules les étiquettes du banc (Stock de test) sont utilisées ou modifiées
  const prod = bancProd(env), duBanc = prod ? " AND banc = 1" : "";
  if (p === "/banc") return new Response(prod ? bancHtml.replace(/<body([^>]*)>/, `<body$1>${BANDEAU_PROD}`) : bancHtml, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  if (p === "/__dev/agent.js") return new Response(AGENT, { headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" } });
  if (!p.startsWith("/__dev/")) return null;

  // ----- Simulation : modifie le vrai état du serveur -----
  if (p === "/__dev/reinitialiser" && req.method === "POST") {
    // En production : seulement jusqu'à samedi 7 novembre 6 h (Montréal), heure réelle, avec confirmation tapée.
    // Le journal du MJ est conservé et garde une trace de l'effacement.
    if (prod) {
      if (Date.now() >= REINIT_PROD_JUSQU_A) return json({ erreur: "« Tout réinitialiser » est fermé en production depuis samedi 6 h : utilise « Partie à zéro »." }, 403);
      const c = (await req.clone().json().catch(() => ({}))) as { confirmation?: string };
      if (String(c.confirmation ?? "").trim().toUpperCase() !== "TOUT") return json({ erreur: "Confirmation manquante : rien n'a été effacé." }, 400);
    }
    await env.DB.batch(["etiquettes", "config", ...(prod ? [] : ["journal_mj"]), ...TABLES_PARTIE].map((x) => env.DB.prepare(`DELETE FROM ${x}`)));
    if (prod) await env.DB.prepare("INSERT INTO journal_mj (qui, action, details) VALUES ('banc', 'tout_reinitialiser', '{}')").run();
    return json({ ok: true });
  }
  if (p === "/__dev/partie-zero" && req.method === "POST") {
    // Efface les personnages et remet les étiquettes réclamées à l'état vierge
    await env.DB.batch([
      ...TABLES_PARTIE.map((x) => env.DB.prepare(`DELETE FROM ${x}`)),
      env.DB.prepare("UPDATE etiquettes SET etat = 'vierge', personnage_id = NULL, faction_id = NULL, reclamee_le = NULL WHERE etat = 'reclamee'"),
    ]);
    return json({ ok: true });
  }
  const corps = req.method === "POST" ? ((await req.clone().json().catch(() => ({}))) as Record<string, unknown>) : {};
  if (p === "/__dev/personnage" && req.method === "POST") {
    // Personnage complet en un clic (PIN 1234), lié à une étiquette vierge tirée au hasard
    const e = await env.DB.prepare(`SELECT code FROM etiquettes WHERE etat = 'vierge' AND role = 'normale'${duBanc} ORDER BY random() LIMIT 1`).first<{ code: string }>();
    if (!e) return json({ erreur: "Plus d'étiquette vierge : clique « Stock de test »." }, 404);
    const id = crypto.randomUUID().slice(0, 12), type = auHasard(TYPES), couleur = auHasard(COULEURS), iso = new Date(Number(corps.maintenant) || Date.now()).toISOString();
    const attributs = ATTRIBUTS.filter(() => Math.random() < 0.3);
    await env.DB.prepare("INSERT INTO personnages (id, pseudo, type, couleur, attributs, classe, pin_sel, pin_empreinte, langue, cree_le) VALUES (?, ?, ?, ?, ?, ?, '', '', ?, ?)")
      .bind(id, genererPseudo(type, couleur, corps.langue === "en" ? "en" : "fr"), type, couleur, JSON.stringify(attributs), auHasard(CLASSES), corps.langue === "en" ? "en" : "fr", iso).run();
    await definirPin(env, id, "1234");
    await env.DB.prepare("UPDATE etiquettes SET etat = 'reclamee', personnage_id = ?, faction_id = ?, reclamee_le = ? WHERE code = ?").bind(id, auHasard(FACTIONS), iso, e.code).run();
    return json({ code: e.code, jeton: await nouvelAppareil(env, id, Date.now()) });
  }
  if (p === "/__dev/revelation" && req.method === "POST") {
    // H1 : révélation à 5 h (heure du banc), instantanés effacés ; « paliers » force le nombre de paliers franchis
    const h = { ...HEURES_PAR_DEFAUT, ...((await lireConfig(env.DB, "heures")) as object) };
    await ecrireConfig(env.DB, "heures", { ...h, revelation: HEURES_PAR_DEFAUT.revelation });
    if (corps.paliers !== undefined) {
      const n = Math.max(0, Math.min(5, Number(corps.paliers) || 0));
      const prm = await lireParametres(env.DB);
      await ecrireConfig(env.DB, "parametres", { ...prm, bareme: { ...prm.bareme, paliers: [0, 1, 2, 3, 4].map((i) => (i < n ? 0 : 1e9 + i)) } });
    }
    await env.DB.prepare("DELETE FROM revelations").run();
    return json({ revelation: HEURES_PAR_DEFAUT.revelation });
  }
  if (p === "/__dev/code-de" && req.method === "POST") {
    const id = await persoDuJeton(env, corps.jeton);
    const e = id ? await env.DB.prepare("SELECT code FROM etiquettes WHERE personnage_id = ? ORDER BY random() LIMIT 1").bind(id).first<{ code: string }>() : null;
    return e ? json(e) : json({ erreur: "Ce téléphone n'a pas de personnage." }, 404);
  }
  if (p === "/__dev/ajouter-etiquettes" && req.method === "POST") {
    // Monte le personnage à N étiquettes (factions distinctes) pour tester la surconsommation
    const id = await persoDuJeton(env, corps.jeton);
    if (!id) return json({ erreur: "Ce téléphone n'a pas de personnage." }, 404);
    const miennes = (await env.DB.prepare("SELECT faction_id AS f FROM etiquettes WHERE personnage_id = ?").bind(id).all<{ f: string }>()).results.map((x) => x.f);
    const libres = FACTIONS.filter((f) => !miennes.includes(f));
    const n = Math.max(0, Number(corps.n ?? 3) - miennes.length);
    const codes = (await env.DB.prepare(`SELECT code FROM etiquettes WHERE etat = 'vierge' AND role = 'normale'${duBanc} ORDER BY random() LIMIT ?`).bind(n).all<{ code: string }>()).results;
    const iso = new Date().toISOString();
    await env.DB.batch(codes.map((c, i) => env.DB.prepare("UPDATE etiquettes SET etat = 'reclamee', personnage_id = ?, faction_id = ?, reclamee_le = ? WHERE code = ?").bind(id, libres[i % libres.length], iso, c.code)));
    return json({ ajoutees: codes.length });
  }
  if (p === "/__dev/premier-scan" && req.method === "POST") {
    // Simule « un autre joueur m'a scanné » : fige le costume (RG-003-11)
    const id = await persoDuJeton(env, corps.jeton);
    if (!id) return json({ erreur: "Ce téléphone n'a pas de personnage." }, 404);
    await env.DB.prepare("UPDATE personnages SET premier_scanne_le = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
    return json({ ok: true });
  }
  if (p === "/__dev/pin-bloquer" && req.method === "POST") {
    await env.DB.prepare("INSERT INTO pin_essais (code, echecs, bloque_jusqu_a) VALUES (?, 0, ?) ON CONFLICT (code) DO UPDATE SET bloque_jusqu_a = excluded.bloque_jusqu_a")
      .bind(String(corps.code), new Date(Date.now() + 15 * 60_000).toISOString()).run();
    return json({ ok: true });
  }
  if (p === "/__dev/stock" && req.method === "POST") {
    // Petit stock de test : 30 petites, 1 personnelle MJ, 15 spéciales MJ, 10 grandes
    const existants = new Set((await env.DB.prepare("SELECT code FROM etiquettes").all<{ code: string }>()).results.map((r) => r.code));
    const lot0 = ((await env.DB.prepare("SELECT MAX(lot) AS m FROM etiquettes").first<{ m: number | null }>())?.m ?? 0) + 1;
    const plan: [number, string, string][] = [[30, "petit", "normale"], [1, "grand", "personnelle_mj"], [15, "grand", "speciale_mj"], [10, "grand", "normale"]];
    const stmt = env.DB.prepare("INSERT INTO etiquettes (code, format, role, lot, banc) VALUES (?, ?, ?, ?, 1)");
    let lot = lot0;
    for (const [n, format, role] of plan) {
      const codes = genererCodes(n, existants);
      codes.forEach((c) => existants.add(c));
      await env.DB.batch(codes.map((c) => stmt.bind(c, format, role, lot)));
      lot++;
    }
    return json({ ok: true });
  }
  if (p === "/__dev/etiquette") {
    // GET ?etat=vierge&role=normale → un code au hasard ; POST {code, etat} → change l'état
    if (req.method === "POST") {
      const { code, etat } = (await req.json()) as { code: string; etat: string };
      if (!["vierge", "reclamee", "desactivee"].includes(etat)) return json({ erreur: "État inconnu" }, 400);
      await env.DB.prepare(`UPDATE etiquettes SET etat = ? WHERE code = ?${duBanc}`).bind(etat, code).run();
      return json({ ok: true });
    }
    const etat = url.searchParams.get("etat") || "vierge", role = url.searchParams.get("role") || "normale";
    const e = await env.DB.prepare(`SELECT code FROM etiquettes WHERE etat = ? AND role = ?${duBanc} ORDER BY random() LIMIT 1`).bind(etat, role).first<{ code: string }>();
    return e ? json(e) : json({ erreur: "Aucune étiquette : clique « Stock de test »." }, 404);
  }
  if (p === "/__dev/etat") {
    const comptes = (await env.DB.prepare("SELECT role, etat, COUNT(*) AS n FROM etiquettes GROUP BY role, etat").all()).results;
    const n = async (x: string) => (await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${x}`).first<{ n: number }>())?.n;
    return json({ comptes, personnages: await n("personnages"), scans: await n("scans"), collection: await n("collection") });
  }
  return json({ erreur: "Route de dev inconnue" }, 404);
}

// Agent chargé dans chaque page du jeu servie en local. Il écoute le banc (window.parent)
// et lui renvoie ce qui se passe. Les injections visuelles des lots suivants s'ajoutent ici.
/** Samedi 7 novembre 2026, 6 h à Montréal (UTC−5) : fin de « Tout réinitialiser » en production. */
export const REINIT_PROD_JUSQU_A = Date.UTC(2026, 10, 7, 11, 0);

const BANDEAU_PROD = `<div style="position:sticky;top:0;z-index:99;background:#ffcf5a;color:#18161d;font:700 14px/1.4 system-ui;padding:10px 14px">
⚠️ PRODUCTION (p.uyt.re) : les actions écrivent dans la vraie base. Le banc n'utilise que ses propres étiquettes : clique d'abord « Stock de test ».
« Tout réinitialiser » efface TOUT, étiquettes imprimées comprises (possible jusqu'à samedi 6 h) ; « Partie à zéro » efface aussi les vrais joueurs.</div>`;

const AGENT = String.raw`(function(){
if (window.parent === window) return;
var envoyer = function(type, d){ try{ window.parent.postMessage(Object.assign({source:"dv-app", type:type}, d||{}), "*"); }catch(e){} };
var suffixe = /^T\d$/.test(window.name) ? "-" + window.name : "";
var CLE_H = "dv-banc-horloge" + suffixe, CLE_J = "dv-appareil" + suffixe;
var vraiNow = Date.now.bind(Date), decalage = 0, vitesse = 1, ancre = vraiNow();
Date.now = function(){ var r = vraiNow(); return ancre + decalage + (r - ancre) * vitesse; };
var VraiDate = Date;
// new Date() sans argument suit aussi l'horloge simulée
window.Date = new Proxy(VraiDate, { construct: function(c, a){ return a.length ? new c(...a) : new c(Date.now()); } });
function reglerHorloge(iso, v, depuis){ var r = vraiNow(); ancre = r; decalage = iso ? Date.parse(iso) + (depuis ? (r - depuis) * (v||1) : 0) - r : 0; vitesse = iso ? (v || 1) : 1; }
try { var hs = JSON.parse(localStorage.getItem(CLE_H) || "null"); if (hs) reglerHorloge(hs.iso, hs.vitesse, hs.regle); } catch(e){}
var css = document.createElement("style");
css.textContent = ".dv-reduit *{animation:none!important;transition:none!important}"
 + ".dv-banniere{position:fixed;left:10px;right:10px;top:10px;z-index:9999;background:#ff4f8b;color:#18161d;font:800 15px/1.35 system-ui;padding:12px 14px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.6);transform:translateY(-140%);transition:transform .35s}"
 + ".dv-banniere.on{transform:none}.dv-banniere small{display:block;font:700 10px ui-monospace,monospace;letter-spacing:.16em;opacity:.7}"
 + "@keyframes dvg{0%{transform:none;filter:none}20%{transform:translateX(-6px) skewX(4deg);filter:hue-rotate(90deg) saturate(3)}40%{transform:translateX(5px);clip-path:inset(20% 0 30% 0)}60%{transform:translateX(-3px) skewX(-3deg);filter:invert(1)}80%{transform:translateX(2px);clip-path:none}100%{transform:none;filter:none}}"
 + ".dv-glitch body{animation:dvg .25s steps(2) 0s var(--n,8)}";
document.head.appendChild(css);
function banniere(titre, texte){
  var b = document.createElement("div"); b.className = "dv-banniere";
  b.innerHTML = "<small></small><span></span>"; b.firstChild.textContent = titre || ""; b.lastChild.textContent = texte || "";
  document.body.appendChild(b); requestAnimationFrame(function(){ b.classList.add("on"); });
  setTimeout(function(){ b.classList.remove("on"); setTimeout(function(){ b.remove(); }, 400); }, 5000);
}
function glitch(s){
  var h = document.documentElement; h.style.setProperty("--n", Math.round((s||2)*4)); h.classList.remove("dv-glitch"); void h.offsetWidth; h.classList.add("dv-glitch");
  setTimeout(function(){ h.classList.remove("dv-glitch"); }, (s||2)*1000 + 100);
}
window.addEventListener("message", function(ev){
  var m = ev.data; if (!m || m.source !== "dv-banc") return;
  if (m.type === "horloge") {
    reglerHorloge(m.iso, m.vitesse, 0);
    try { m.iso ? localStorage.setItem(CLE_H, JSON.stringify({iso:m.iso, vitesse:m.vitesse||1, regle:vraiNow()})) : localStorage.removeItem(CLE_H); } catch(e){}
    envoyer("log", {texte:"horloge → " + (m.iso || "réelle") + " ×" + vitesse});
    if (m.recharger) location.reload();
  }
  else if (m.type === "identite") { var j = null; try { j = localStorage.getItem(CLE_J); } catch(e){} envoyer("identite", {jeton:j, demande:m.demande}); }
  else if (m.type === "adopter") { try { localStorage.setItem(CLE_J, m.jeton); localStorage.removeItem("dv-moi" + suffixe); } catch(e){} location.href = m.url || "/"; }
  else if (m.type === "oublier") { try { ["dv-appareil","dv-moi","dv-brouillon"].forEach(function(k){ localStorage.removeItem(k + suffixe); }); } catch(e){} envoyer("log", {texte:"stockage local vidé"}); location.href = m.url || "/"; }
  else if (m.type === "reduit") { document.documentElement.classList.toggle("dv-reduit", !!m.actif); }
  else if (m.type === "aller") { location.href = m.url; }
  else if (m.type === "recharger") { location.reload(); }
  else if (m.type === "injecter") {
    if (m.quoi === "banniere") banniere(m.titre, m.texte);
    else if (m.quoi === "glitch") glitch(m.secondes);
    else envoyer("log", {texte:"injection inconnue : " + m.quoi});
    envoyer("log", {texte:"injection " + m.quoi});
  }
});
document.addEventListener("submit", function(e){ envoyer("log", {texte:"formulaire → " + (e.target.action || "")}); }, true);
document.addEventListener("click", function(e){ var a = e.target.closest && e.target.closest("a,button"); if (a) envoyer("log", {texte:"clic : " + (a.textContent||"").trim().slice(0,40)}); }, true);
envoyer("pret", {url: location.pathname + location.search, titre: document.title, statut: document.documentElement.dataset.statut || ""});
})();`;
