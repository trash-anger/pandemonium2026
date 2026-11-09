// Analytics de la page de fin (admin → 📈 Stats). Agrégation en mémoire : quelques milliers de visites au plus.

export type Periode = "24h" | "7j" | "30j" | "tout";
export const PERIODES: Record<Periode, { lib: string; ms: number | null }> = {
  "24h": { lib: "24 h", ms: 24 * 3600_000 }, "7j": { lib: "7 jours", ms: 7 * 86400_000 }, "30j": { lib: "30 jours", ms: 30 * 86400_000 }, tout: { lib: "Tout", ms: null },
};

export interface Visite {
  id: string; le: string; visiteur: string; hote: string | null; chemin: string | null; code: string | null; source: string; referent: string | null;
  utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; pays: string | null; region: string | null; ville: string | null;
  appareil: string | null; navigateur: string | null; os: string | null; langue: string | null; app: number; ecran: string | null;
  bot: number; duree_ms: number; defilement: number;
}

export const SOURCES: Record<string, string> = {
  etiquette: "Étiquette QR scannée", campagne: "Campagne (utm)", reseaux: "Réseaux sociaux", recherche: "Moteur de recherche",
  site: "Autre site", teaser: "Ancien teaser", direct: "Lien direct",
};
export const CLICS: Record<string, string> = {
  partage: "Bouton Partager", partage_ok: "Partage envoyé", copie: "Lien copié", pandemonium: "Lien Facebook Pandémonium", langue: "Changement de langue",
};
const TRANCHES = [["< 5 s", 5e3], ["5 – 15 s", 15e3], ["15 – 30 s", 30e3], ["30 s – 1 min", 60e3], ["1 – 3 min", 180e3], ["> 3 min", Infinity]] as const;

export type Ligne = { cle: string; n: number };
const compter = (vs: Visite[], f: (v: Visite) => string | null | undefined, max = 12): Ligne[] => {
  const m = new Map<string, number>();
  for (const v of vs) { const k = f(v); if (k) m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m].map(([cle, n]) => ({ cle, n })).sort((a, b) => b.n - a.n).slice(0, max);
};
const mediane = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
/** Clé d'heure ou de jour, à l'heure de Montréal. */
const tranche = (iso: string, parJour: boolean) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("fr-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return parJour ? `${p.year}-${p.month}-${p.day}` : `${p.year}-${p.month}-${p.day} ${p.hour}`;
};

export async function tableauAnalytics(db: D1Database, periode: Periode, t = Date.now()) {
  const ms = PERIODES[periode].ms;
  const depuis = ms ? new Date(t - ms).toISOString() : "0000";
  const toutes = (await db.prepare("SELECT * FROM visites WHERE le >= ? ORDER BY le LIMIT 200000").bind(depuis).all<Visite>()).results;
  const robots = toutes.filter((v) => v.bot).length;
  const vs = toutes.filter((v) => !v.bot);
  const clics = (await db.prepare(
    "SELECT c.type, c.visite_id FROM clics_fin c JOIN visites v ON v.id = c.visite_id WHERE c.le >= ? AND v.bot = 0",
  ).bind(depuis).all<{ type: string; visite_id: string }>()).results;

  // Courbe : par heure sur 24 h et 7 jours, par jour au-delà (trous à zéro)
  const parJour = periode === "30j" || (periode === "tout" && vs.length > 0 && t - Date.parse(vs[0].le) > 7 * 86400_000);
  const pasMs = parJour ? 86400_000 : 3600_000;
  const debut = ms ? t - ms : vs.length ? Date.parse(vs[0].le) : t - 24 * 3600_000;
  const cles: string[] = [];
  for (let x = debut; x <= t + pasMs - 1; x += pasMs) { const k = tranche(new Date(x).toISOString(), parJour); if (cles[cles.length - 1] !== k) cles.push(k); }
  const parTranche = new Map(cles.map((k) => [k, { vues: 0, visiteurs: new Set<string>() }]));
  for (const v of vs) { const c = parTranche.get(tranche(v.le, parJour)); if (c) { c.vues++; c.visiteurs.add(v.visiteur); } }

  const engages = new Set(clics.filter((c) => c.type !== "langue").map((c) => c.visite_id));
  const durees = vs.map((v) => v.duree_ms).filter((d) => d > 0);
  return {
    periode, robots,
    vues: vs.length,
    // L'empreinte change chaque jour (pas de cookie) : un même visiteur revenu un autre jour compte deux fois
    visiteurs: new Set(vs.map((v) => `${v.le.slice(0, 10)}|${v.visiteur}`)).size,
    dureeMediane: mediane(durees),
    defilementMoyen: vs.length ? Math.round(vs.reduce((a, v) => a + v.defilement, 0) / vs.length) : 0,
    engagement: vs.length ? engages.size / vs.length : 0,
    partages: clics.filter((c) => c.type === "partage_ok" || c.type === "copie").length,
    facebook: clics.filter((c) => c.type === "pandemonium").length,
    courbe: { parJour, points: cles.map((k) => ({ cle: k, vues: parTranche.get(k)!.vues, visiteurs: parTranche.get(k)!.visiteurs.size })) },
    sources: compter(vs, (v) => SOURCES[v.source] ?? v.source),
    etiquettes: compter(vs, (v) => v.code, 15),
    referents: compter(vs, (v) => v.referent, 12),
    campagnes: compter(vs, (v) => (v.utm_source || v.utm_campaign ? [v.utm_source, v.utm_medium, v.utm_campaign].filter(Boolean).join(" · ") : null), 10),
    domaines: compter(vs, (v) => v.hote),
    pays: compter(vs, (v) => v.pays, 12),
    villes: compter(vs, (v) => (v.ville ? `${v.ville}${v.pays ? ` (${v.pays})` : ""}` : null), 12),
    appareils: compter(vs, (v) => v.appareil),
    navigateurs: compter(vs, (v) => v.navigateur),
    os: compter(vs, (v) => v.os),
    langues: compter(vs, (v) => (v.langue ? v.langue.slice(0, 2) : null)),
    app: compter(vs, (v) => (v.app ? "App installée (ancienne PWA)" : "Navigateur")),
    durees: TRANCHES.map(([cle], i) => ({ cle, n: vs.filter((v) => v.duree_ms < TRANCHES[i][1] && v.duree_ms >= (i ? TRANCHES[i - 1][1] : 0)).length })),
    clics: compter(clics as unknown as Visite[], (c) => CLICS[(c as unknown as { type: string }).type] ?? null),
    dernieres: vs.slice(-25).reverse(),
  };
}
export type Tableau = Awaited<ReturnType<typeof tableauAnalytics>>;

const CSV_COLONNES = ["le", "hote", "chemin", "code", "source", "referent", "utm_source", "utm_medium", "utm_campaign", "pays", "region", "ville",
  "appareil", "navigateur", "os", "langue", "app", "ecran", "bot", "duree_ms", "defilement"] as const;
export async function csvAnalytics(db: D1Database): Promise<string> {
  const vs = (await db.prepare("SELECT * FROM visites ORDER BY le").all<Visite>()).results;
  const cel = (x: unknown) => { const s = x == null ? "" : String(x); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [CSV_COLONNES.join(","), ...vs.map((v) => CSV_COLONNES.map((c) => cel(v[c])).join(","))].join("\n") + "\n";
}
