// LOT-5 : mur de photos « Déjà vu ! » (FEAT-017).
// Seuls les scans faits avec le scanner intégré envoient une photo (RG-017-1), en basse qualité (RG-017-2, REQ-008),
// et seulement si le scanneur a accepté les photos (case unique, création ou Moi) : sinon rien ne quitte le téléphone.
// Chaque joueur voit dans l'app les photos de ses scans et celles prises en scannant son étiquette (RG-017-5) ; le MJ peut masquer une photo (RG-017-6). L'effet « déjà vu » est appliqué
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
  // Consentement unique (case de la création ou de Moi) : sans lui, aucune photo n'est gardée
  const ok = await db.prepare("SELECT photos_ok FROM personnages WHERE id = ?").bind(personnageId).first<{ photos_ok: number }>();
  if (!ok?.photos_ok) return { ok: false, erreur: "sans_accord", status: 403 };
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

/** Une page du mur d'un joueur : les photos de ses scans et celles prises en scannant son étiquette, des plus récentes
 *  aux plus anciennes ; `avant` = plus petit id déjà affiché. Ni les photos écartées, ni celles d'un auteur qui a retiré son accord. */
export async function lireMur(db: D1Database, moiId: string, avant?: number, nb = MUR_PAGE): Promise<{ photos: PhotoMur[]; total: number; suite: boolean }> {
  const filtre = `FROM photos f JOIN scans s ON s.id = f.scan_id JOIN personnages p ON p.id = f.personnage_id
    WHERE f.masquee = 0 AND p.photos_ok = 1 AND (f.personnage_id = ?1 OR s.cible_id = ?1)`;
  const lignes = (await db.prepare(`SELECT f.id, f.image, f.le, f.personnage_id ${filtre} ${avant ? "AND f.id < ?3" : ""} ORDER BY f.id DESC LIMIT ?2`)
    .bind(moiId, nb + 1, ...(avant ? [avant] : [])).all<{ id: number; image: string; le: string; personnage_id: string }>()).results;
  const total = (await db.prepare(`SELECT COUNT(*) AS n ${filtre}`).bind(moiId).first<{ n: number }>())?.n ?? 0;
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

/** Photos de la révélation (RG-009-9, RG-017-5) : seulement celles dont l'auteur a autorisé l'usage à la révélation,
 *  et que le MJ n'a pas écartées. Tirées au hasard ; le client en fait défiler quelques-unes avant la constellation. */
export async function photosRevelation(db: D1Database, nb = 30): Promise<string[]> {
  return (await db.prepare(
    "SELECT f.image FROM photos f JOIN personnages p ON p.id = f.personnage_id WHERE f.masquee = 0 AND p.photos_ok = 1 ORDER BY random() LIMIT ?",
  ).bind(nb).all<{ image: string }>()).results.map((x) => x.image);
}

/** Ajoute les photos à un instantané déjà sérialisé (l'instantané figé en base ne les contient pas). */
export const avecPhotos = (corps: string, photos: string[]) =>
  corps.trimEnd().endsWith("}") ? corps.trimEnd().slice(0, -1) + `,"photos":${JSON.stringify(photos)}}` : corps;
