-- LOT-2 : jauge de souvenirs (DEC-031), temps d'écran (RG-015-4), réactions (FEAT-014)
ALTER TABLE personnages ADD COLUMN souvenirs INTEGER NOT NULL DEFAULT 10;
ALTER TABLE personnages ADD COLUMN temps_ecran_s INTEGER NOT NULL DEFAULT 0;

-- Une réaction par emoji, par auteur et par carte (RG-014-4) ; le porteur ne voit que les totaux (RG-014-5)
CREATE TABLE reactions (
  auteur_id  TEXT NOT NULL,
  cible_id   TEXT NOT NULL,
  emoji      TEXT NOT NULL,
  pose_le    TEXT NOT NULL,
  PRIMARY KEY (auteur_id, cible_id, emoji)
);
CREATE INDEX reactions_cible ON reactions (cible_id);
CREATE INDEX scans_scanneur_resultat ON scans (scanneur_id, resultat, horodatage_serveur);
