-- LOT-3 E : suggestions de réglage au MJ (ADM-16, barème §6). Le serveur propose, le MJ applique ou ignore.
CREATE TABLE suggestions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  cle         TEXT NOT NULL,       -- plus_rapide, plus_lent, palier, transmission, foyer, rescans
  texte       TEXT NOT NULL,
  action      TEXT NOT NULL,       -- JSON : { prereglage } | { transmission } | { foyer } | { rescan_quete }
  cree_le     TEXT NOT NULL,
  etat        TEXT NOT NULL DEFAULT 'proposee' CHECK (etat IN ('proposee', 'appliquee', 'ignoree', 'perimee')),
  traitee_le  TEXT,
  auteur      TEXT
);
CREATE INDEX suggestions_cree ON suggestions (cree_le);
