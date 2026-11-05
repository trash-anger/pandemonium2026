-- LOT-0 : étiquettes et configuration (specs/donnees.md#etiquette)
CREATE TABLE etiquettes (
  code          TEXT PRIMARY KEY,                       -- RG-001-3, RG-001-4
  format        TEXT NOT NULL CHECK (format IN ('petit', 'grand')),
  role          TEXT NOT NULL DEFAULT 'normale'
                CHECK (role IN ('normale', 'personnelle_mj', 'speciale_mj')),
  etat          TEXT NOT NULL DEFAULT 'vierge'
                CHECK (etat IN ('vierge', 'reclamee', 'desactivee')),
  rarete        TEXT NOT NULL DEFAULT 'commune'
                CHECK (rarete IN ('commune', 'rare', 'legendaire')),
  serie_id      TEXT,
  faction_id    TEXT,
  personnage_id TEXT,
  lot           INTEGER NOT NULL,                        -- numéro de génération, pour l'export
  cree_le       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX etiquettes_lot ON etiquettes (lot, format);

-- Paramètres réglables par le MJ (ADM-2, ADM-3), une valeur JSON par clé
CREATE TABLE config (
  cle         TEXT PRIMARY KEY,
  valeur      TEXT NOT NULL,
  modifie_le  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Journal des actions du MJ (RG-020-2)
CREATE TABLE journal_mj (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  quand   TEXT NOT NULL DEFAULT (datetime('now')),
  qui     TEXT NOT NULL,
  action  TEXT NOT NULL,
  details TEXT
);
