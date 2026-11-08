// Fiche joueur du MJ (admin → Joueurs) : tout ce que le serveur sait d'un personnage, secrets compris.
// Lecture seule : les actions (PIN, sanctions, missions, détacher) restent des formulaires de l'admin.

export interface FicheJoueur {
  id: string; pseudo: string; type: string; couleur: string; classe: string; attributs: string[]; langue: string;
  cree_le: string; est_mj: boolean; photos_ok: boolean; souvenirs: number; suspendu: boolean;
  bloque_jusqu_a: string | null; bloque_cause: string | null;
  etiquettes: { code: string; faction: string | null; role: string }[];
  stats: { cartes: number; scanne_par: number; deja_vus: number; scans: number; points: { faction: string; points: number }[] };
  badges: { badge: string; le: string }[];
  derniers: { le: string; resultat: string; pseudo: string | null }[];
  groupe: { type: string; reuni: boolean; membres: { id: string; pseudo: string; retrouve: boolean }[] } | null;
  chat_noir_le: string | null;
  corruption: { cause: string; debut: string; fin: string; immun_jusqu_a: string | null; actif: boolean } | null;
  effets: { effet: string; fin: string | null; reste: number | null }[];
  sanctions: { niveau: number; le: string; annulee: boolean }[];
  missions: { code: string; etat: string; debut: string; fin: string | null }[];
  photos: { prises: number; de_lui: number; ecartees: number };
  duels: { joues: number; gagnes: number };
  appareils: { n: number; vu_le: string | null; push: number };
}

const n = async (db: D1Database, sql: string, ...b: unknown[]) => (await db.prepare(sql).bind(...b).first<{ n: number }>())?.n ?? 0;

export async function ficheJoueur(db: D1Database, id: string, t = Date.now()): Promise<FicheJoueur | null> {
  const p = await db.prepare("SELECT * FROM personnages WHERE id = ?").bind(id).first<Record<string, unknown>>();
  if (!p) return null;
  const maintenant = new Date(t).toISOString();
  const tous = <T>(sql: string, ...b: unknown[]) => db.prepare(sql).bind(...b).all<T>().then((r) => r.results);

  const groupe = p.groupe_id
    ? await (async () => {
        const g = await db.prepare("SELECT type, reuni_le FROM groupes WHERE id = ?").bind(p.groupe_id).first<{ type: string; reuni_le: string | null }>();
        const membres = await tous<{ id: string; pseudo: string }>("SELECT id, pseudo FROM personnages WHERE groupe_id = ? AND id <> ?", p.groupe_id, id);
        const vus = new Set((await tous<{ a: string; b: string }>("SELECT a, b FROM retrouvailles WHERE a = ?1 OR b = ?1", id)).map((r) => (r.a === id ? r.b : r.a)));
        return g ? { type: g.type, reuni: !!g.reuni_le, membres: membres.map((m) => ({ ...m, retrouve: vus.has(m.id) })) } : null;
      })()
    : null;
  const c = await db.prepare("SELECT cause, debut, fin, immun_jusqu_a FROM corruptions WHERE personnage_id = ? ORDER BY id DESC LIMIT 1")
    .bind(id).first<{ cause: string; debut: string; fin: string; immun_jusqu_a: string | null }>();
  const appareil = await db.prepare("SELECT COUNT(*) AS n, MAX(vu_le) AS vu FROM appareils WHERE personnage_id = ?").bind(id).first<{ n: number; vu: string | null }>();

  return {
    id, pseudo: String(p.pseudo), type: String(p.type), couleur: String(p.couleur), classe: String(p.classe),
    attributs: JSON.parse(String(p.attributs || "[]")), langue: String(p.langue || "fr"), cree_le: String(p.cree_le),
    est_mj: !!p.est_mj, photos_ok: !!p.photos_ok, souvenirs: Number(p.souvenirs ?? 10), suspendu: !!p.suspendu,
    bloque_jusqu_a: p.bloque_jusqu_a && String(p.bloque_jusqu_a) > maintenant ? String(p.bloque_jusqu_a) : null,
    bloque_cause: (p.bloque_cause as string | null) ?? null,
    etiquettes: await tous("SELECT code, faction_id AS faction, role FROM etiquettes WHERE personnage_id = ? ORDER BY code", id),
    stats: {
      cartes: await n(db, "SELECT COUNT(*) AS n FROM collection WHERE possesseur_id = ?", id),
      scanne_par: await n(db, "SELECT COUNT(*) AS n FROM collection WHERE personnage_id = ?", id),
      deja_vus: await n(db, "SELECT COUNT(*) AS n FROM scans WHERE scanneur_id = ? AND resultat = 'deja_vu'", id),
      scans: await n(db, "SELECT COUNT(*) AS n FROM scans WHERE scanneur_id = ?", id),
      points: await tous("SELECT faction, ROUND(SUM(points), 1) AS points FROM points_faction WHERE personnage_id = ? GROUP BY faction ORDER BY points DESC", id),
    },
    badges: await tous("SELECT badge, obtenu_le AS le FROM badges WHERE personnage_id = ? ORDER BY obtenu_le", id),
    derniers: await tous(
      `SELECT s.horodatage_serveur AS le, s.resultat, c.pseudo FROM scans s LEFT JOIN personnages c ON c.id = s.cible_id
       WHERE s.scanneur_id = ? ORDER BY s.id DESC LIMIT 8`, id),
    groupe,
    chat_noir_le: (p.chat_noir_le as string | null) ?? null,
    corruption: c ? { ...c, actif: c.debut <= maintenant && c.fin > maintenant } : null,
    effets: await tous("SELECT effet, fin, reste FROM effets WHERE personnage_id = ? AND (fin IS NULL OR fin > ?) ORDER BY obtenu_le", id, maintenant),
    sanctions: (await tous<{ niveau: number; le: string; annulee_le: string | null }>("SELECT niveau, le, annulee_le FROM sanctions WHERE personnage_id = ? ORDER BY id DESC", id))
      .map((s) => ({ niveau: s.niveau, le: s.le, annulee: !!s.annulee_le })),
    missions: await tous("SELECT code, etat, debut, fin FROM missions WHERE personnage_id = ? ORDER BY id DESC LIMIT 5", id),
    photos: {
      prises: await n(db, "SELECT COUNT(*) AS n FROM photos WHERE personnage_id = ?", id),
      de_lui: await n(db, "SELECT COUNT(*) AS n FROM photos f JOIN scans s ON s.id = f.scan_id WHERE s.cible_id = ?", id),
      ecartees: await n(db, "SELECT COUNT(*) AS n FROM photos f JOIN scans s ON s.id = f.scan_id WHERE f.masquee = 1 AND (f.personnage_id = ?1 OR s.cible_id = ?1)", id),
    },
    duels: {
      joues: await n(db, "SELECT COUNT(*) AS n FROM duels WHERE (a_id = ?1 OR b_id = ?1) AND etat = 'accepte'", id),
      gagnes: await n(db, "SELECT COUNT(*) AS n FROM duels WHERE etat = 'accepte' AND json_extract(resultat, '$.gagnant') = ?", id),
    },
    appareils: { n: appareil?.n ?? 0, vu_le: appareil?.vu ?? null, push: await n(db, "SELECT COUNT(*) AS n FROM abonnements_push WHERE personnage_id = ?", id) },
  };
}
