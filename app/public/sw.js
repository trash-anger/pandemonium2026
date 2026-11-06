// Service worker « Déjà vu ! » (FEAT-021) : l'interface reste disponible hors ligne après une première visite.
// - Pages du joueur : réseau d'abord (pour recevoir les correctifs), coquille en cache si le réseau manque (RG-021-4).
// - app.js et app.css sont versionnés (?v=) : cache d'abord. Icônes, manifeste et D3 : cache, rafraîchi en arrière-plan.
// - L'API, l'admin, la connexion et le banc ne passent jamais par le cache.
// - LOT-3 D (FEAT-016) : les pushs arrivent sans contenu ; le texte se lit sur /api/push/contenu avec l'adresse
//   de l'abonnement comme clé. Toucher la notification ouvre ou ramène l'app.
const CACHE = "deja-vu-l3-3";
const STATIQUES = ["/manifest.webmanifest", "/favicon.svg", "/icone-192.png", "/icone-512.png", "/apple-touch-icon.png",
  "/vendor/d3-7.9.0.min.js"]; // RG-009-13 : D3 en cache bien avant la révélation
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

// ---------- Notifications push (FEAT-016) ----------
const ICONE = "/icone-192.png";
const posterJSON = (url, corps) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps), cache: "no-store" });

self.addEventListener("push", (e) => {
  e.waitUntil((async () => {
    let liste = [];
    try {
      const abo = await self.registration.pushManager.getSubscription();
      if (abo) {
        const r = await posterJSON("/api/push/contenu", { endpoint: abo.endpoint });
        if (r.ok) liste = (await r.json()).notifications || [];
      }
    } catch { /* réseau absent : notification générique */ }
    // Safari exige une notification visible à chaque push
    if (!liste.length) liste = [{ titre: "Déjà vu !", texte: "Du nouveau dans le jeu.", tag: "generique" }];
    await Promise.all(liste.map((n) => self.registration.showNotification(n.titre, {
      body: n.texte, tag: n.tag, renotify: true, icon: ICONE, badge: ICONE, data: { url: n.url || "/" },
    })));
  })());
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const fenetres = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const cible = (e.notification.data && e.notification.data.url) || "/";
    const f = fenetres.find((c) => new URL(c.url).origin === location.origin);
    // Une suggestion au MJ ouvre l'admin ; le reste ramène l'app ouverte
    if (f && cible === "/") { await f.focus(); return; }
    await self.clients.openWindow(cible);
  })());
});

// Le navigateur a renouvelé l'abonnement : on prévient le serveur avec l'ancienne adresse comme clé
self.addEventListener("pushsubscriptionchange", (e) => {
  e.waitUntil((async () => {
    const ancien = e.oldSubscription && e.oldSubscription.endpoint;
    let nouveau = e.newSubscription;
    if (!nouveau) {
      const { cle } = await (await fetch("/api/push/cle", { cache: "no-store" })).json();
      if (!cle) return;
      const brut = atob(cle.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((cle.length + 3) % 4));
      nouveau = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: Uint8Array.from(brut, (c) => c.charCodeAt(0)) });
    }
    if (ancien && nouveau) await posterJSON("/api/push/renouveler", { ancien, endpoint: nouveau.endpoint });
  })());
});
