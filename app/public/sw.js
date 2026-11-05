// Service worker « Déjà vu ! » (FEAT-021) : l'interface reste disponible hors ligne après une première visite.
// - Pages du joueur : réseau d'abord (pour recevoir les correctifs), coquille en cache si le réseau manque (RG-021-4).
// - app.js et app.css sont versionnés (?v=) : cache d'abord. Icônes et manifeste : cache, rafraîchi en arrière-plan.
// - L'API, l'admin, la connexion et le banc ne passent jamais par le cache.
const CACHE = "deja-vu-l2-1";
const STATIQUES = ["/manifest.webmanifest", "/favicon.svg", "/icone-192.png", "/icone-512.png", "/apple-touch-icon.png"];
const DELAI_RESEAU_MS = 4000;

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(STATIQUES).catch(() => {});
    await mettreCoquilleEnCache(c);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

/** Met en cache la coquille (/) et les fichiers versionnés qu'elle référence. */
async function mettreCoquilleEnCache(c, reponse) {
  const r = reponse || (await fetch("/", { cache: "no-store" }).catch(() => null));
  if (!r || !r.ok) return;
  const html = await r.clone().text();
  await c.put("/", r);
  const fichiers = [...html.matchAll(/(?:href|src)="(\/app\.(?:js|css)\?v=[^"]+)"/g)].map((m) => m[1]);
  await Promise.all(fichiers.map((f) => c.match(f).then((x) => x || c.add(f)).catch(() => {})));
}

const horsCache = (p) => p.startsWith("/api/") || p.startsWith("/admin") || p.startsWith("/auth/") || p.startsWith("/__dev") || p === "/banc" || p === "/sw.js";

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || horsCache(url.pathname)) return;

  if (req.mode === "navigate") {
    e.respondWith(naviguer(req));
    return;
  }
  if (/^\/app\.(js|css)$/.test(url.pathname) && url.searchParams.has("v")) {
    e.respondWith(caches.match(req).then((x) => x || fetch(req).then((r) => garder(req, r))));
    return;
  }
  if (STATIQUES.includes(url.pathname)) {
    e.respondWith(caches.match(req).then((x) => {
      const frais = fetch(req).then((r) => garder(req, r)).catch(() => x);
      return x || frais;
    }));
  }
});

async function garder(req, r) {
  if (r && r.ok) {
    const c = await caches.open(CACHE);
    await c.put(req, r.clone());
  }
  return r;
}

/** Toutes les pages du joueur partagent la même coquille : seul le chemin change, et app.js le lit. */
async function naviguer(req) {
  const c = await caches.open(CACHE);
  try {
    const r = await Promise.race([
      fetch(req),
      new Promise((_, non) => setTimeout(() => non(new Error("lent")), DELAI_RESEAU_MS)),
    ]);
    // Une coquille fraîche (200 ou 404 de code inconnu) remplace l'ancienne
    if (r.headers.get("Content-Type")?.includes("text/html") && r.status === 200) mettreCoquilleEnCache(c, r.clone());
    return r;
  } catch {
    const coquille = await c.match("/");
    if (coquille) return coquille;
    return fetch(req);
  }
}
