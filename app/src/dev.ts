// Banc d'essai local (jamais actif en production) : page /banc, API de simulation /__dev/*,
// et agent injecté dans les pages du jeu pour recevoir les injections du banc (postMessage).
import bancHtml from "../banc/banc.html";
import { genererCodes } from "./codes";

export interface EnvDev {
  DB: D1Database;
  PUBLIC_ORIGIN: string;
}

export const devActif = (env: EnvDev) => env.PUBLIC_ORIGIN.startsWith("http://localhost");

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
  if (p === "/banc") return new Response(bancHtml, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  if (p === "/__dev/agent.js") return new Response(AGENT, { headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" } });
  if (!p.startsWith("/__dev/")) return null;

  // ----- Simulation : modifie le vrai état du serveur -----
  if (p === "/__dev/reinitialiser" && req.method === "POST") {
    await env.DB.batch([env.DB.prepare("DELETE FROM etiquettes"), env.DB.prepare("DELETE FROM config"), env.DB.prepare("DELETE FROM journal_mj")]);
    return json({ ok: true });
  }
  if (p === "/__dev/stock" && req.method === "POST") {
    // Petit stock de test : 30 petites, 1 personnelle MJ, 15 spéciales MJ, 10 grandes
    const existants = new Set((await env.DB.prepare("SELECT code FROM etiquettes").all<{ code: string }>()).results.map((r) => r.code));
    const lot0 = ((await env.DB.prepare("SELECT MAX(lot) AS m FROM etiquettes").first<{ m: number | null }>())?.m ?? 0) + 1;
    const plan: [number, string, string][] = [[30, "petit", "normale"], [1, "grand", "personnelle_mj"], [15, "grand", "speciale_mj"], [10, "grand", "normale"]];
    const stmt = env.DB.prepare("INSERT INTO etiquettes (code, format, role, lot) VALUES (?, ?, ?, ?)");
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
      await env.DB.prepare("UPDATE etiquettes SET etat = ? WHERE code = ?").bind(etat, code).run();
      return json({ ok: true });
    }
    const etat = url.searchParams.get("etat") || "vierge", role = url.searchParams.get("role") || "normale";
    const e = await env.DB.prepare("SELECT code FROM etiquettes WHERE etat = ? AND role = ? ORDER BY random() LIMIT 1").bind(etat, role).first<{ code: string }>();
    return e ? json(e) : json({ erreur: "Aucune étiquette : clique « Stock de test »." }, 404);
  }
  if (p === "/__dev/etat") {
    const comptes = (await env.DB.prepare("SELECT role, etat, COUNT(*) AS n FROM etiquettes GROUP BY role, etat").all()).results;
    return json({ comptes });
  }
  return json({ erreur: "Route de dev inconnue" }, 404);
}

// Agent chargé dans chaque page du jeu servie en local. Il écoute le banc (window.parent)
// et lui renvoie ce qui se passe. Les injections visuelles des lots suivants s'ajoutent ici.
const AGENT = String.raw`(function(){
if (window.parent === window) return;
var envoyer = function(type, d){ try{ window.parent.postMessage(Object.assign({source:"dv-app", type:type}, d||{}), "*"); }catch(e){} };
var vraiNow = Date.now.bind(Date), decalage = 0, vitesse = 1, ancre = vraiNow();
Date.now = function(){ var r = vraiNow(); return ancre + decalage + (r - ancre) * vitesse; };
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
  if (m.type === "horloge") { var r = vraiNow(); ancre = r; decalage = m.iso ? Date.parse(m.iso) - r : 0; vitesse = m.vitesse || 1; envoyer("log", {texte:"horloge → " + (m.iso || "réelle") + " ×" + vitesse}); }
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
