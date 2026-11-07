// LOT-5 : mur de photos « Déjà vu ! » (FEAT-017).
// Seuls les scans faits avec le scanner intégré envoient une photo (RG-017-1), en basse qualité (RG-017-2, REQ-008),
// et seulement si le scanneur y a consenti à l'activation de la caméra (RG-017-4) : sinon rien ne quitte le téléphone.
// Le mur se voit dans l'app (RG-017-5) ; le MJ peut masquer une photo (RG-017-6). L'effet « déjà vu » est appliqué
// à l'affichage (RG-017-7).

/** Taille maximale d'une image : data URL d'environ 30 Ko (le téléphone vise 256 px de grand côté). */
export const IMAGE_MAX = 40_000;
/** Plafond par personne : évite qu'un seul téléphone remplisse la base. */
export const PHOTOS_PAR_PERSONNE = 300;
export const MUR_PAGE = 36;

const PREFIXE = "data:image/jpeg;base64,";

export function imageValide(x: unknown): x is string {
  return typeof x === "string" && x.length <= IMAGE_MAX && x.startsWith(PREFIXE) && /^[A-Za-z0-9+/]+={0,2}$/.test(x.slice(PREFIXE.length));
}

export type ResultatPhoto = { ok: true; id: number } | { ok: false; erreur: string; status: number };

/** Enregistre la photo d'un scan déjà traité. Le scan doit venir de l'app et appartenir au même personnage. */
export async function enregistrerPhoto(db: D1Database, personnageId: string, idClient: unknown, image: unknown, iso: string): Promise<ResultatPhoto> {
  if (typeof idClient !== "string" || !idClient || idClient.length > 64) return { ok: false, erreur: "scan", status: 400 };
  if (!imageValide(image)) return { ok: false, erreur: "image", status: 400 };
  const scan = await db.prepare("SELECT id FROM scans WHERE id_client = ? AND scanneur_id = ? AND source = 'app' AND cible_id IS NOT NULL")
    .bind(idClient, personnageId).first<{ id: number }>();
  if (!scan) return { ok: false, erreur: "scan", status: 404 };
  const deja = await db.prepare("SELECT id FROM photos WHERE scan_id = ?").bind(scan.id).first<{ id: number }>();
  if (deja) return { ok: true, id: deja.id };
  const n = (await db.prepare("SELECT COUNT(*) AS n FROM photos WHERE personnage_id = ?").bind(personnageId).first<{ n: number }>())?.n ?? 0;
  if (n >= PHOTOS_PAR_PERSONNE) return { ok: false, erreur: "plafond", status: 429 };
  const r = await db.prepare("INSERT OR IGNORE INTO photos (scan_id, personnage_id, image, le) VALUES (?, ?, ?, ?) RETURNING id")
    .bind(scan.id, personnageId, image, iso).first<{ id: number }>();
  return { ok: true, id: r?.id ?? 0 };
}

export interface PhotoMur { id: number; image: string; le: string; moi: boolean }

/** Une page du mur, des plus récentes aux plus anciennes ; `avant` = plus petit id déjà affiché. */
export async function lireMur(db: D1Database, moiId: string, avant?: number, nb = MUR_PAGE): Promise<{ photos: PhotoMur[]; total: number; suite: boolean }> {
  const lignes = (await db.prepare(
    `SELECT id, image, le, personnage_id FROM photos WHERE masquee = 0 ${avant ? "AND id < ?2" : ""} ORDER BY id DESC LIMIT ?1`,
  ).bind(nb + 1, ...(avant ? [avant] : [])).all<{ id: number; image: string; le: string; personnage_id: string }>()).results;
  const total = (await db.prepare("SELECT COUNT(*) AS n FROM photos WHERE masquee = 0").first<{ n: number }>())?.n ?? 0;
  return {
    photos: lignes.slice(0, nb).map((p) => ({ id: p.id, image: p.image, le: p.le, moi: p.personnage_id === moiId })),
    total,
    suite: lignes.length > nb,
  };
}

/** Vue du MJ : toutes les photos, masquées comprises, avec le pseudo du scanneur. */
export async function murAdmin(db: D1Database, avant?: number, nb = 60) {
  const lignes = (await db.prepare(
    `SELECT f.id, f.image, f.le, f.masquee, p.pseudo FROM photos f LEFT JOIN personnages p ON p.id = f.personnage_id
     ${avant ? "WHERE f.id < ?2" : ""} ORDER BY f.id DESC LIMIT ?1`,
  ).bind(nb + 1, ...(avant ? [avant] : [])).all<{ id: number; image: string; le: string; masquee: number; pseudo: string | null }>()).results;
  const c = await db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(masquee), 0) AS m FROM photos").first<{ n: number; m: number }>();
  return { photos: lignes.slice(0, nb), suite: lignes.length > nb, total: c?.n ?? 0, masquees: c?.m ?? 0 };
}

export async function masquerPhoto(db: D1Database, id: number, masquee: boolean): Promise<boolean> {
  const r = await db.prepare("UPDATE photos SET masquee = ? WHERE id = ?").bind(masquee ? 1 : 0, id).run();
  return (r.meta?.changes ?? 0) > 0;
}
