-- LOT-1 : personnages, appareils, scans, collection, badges (specs/donnees.md)
-- Les horodatages sont des ISO UTC fournis par le Worker (horloge simulable en local).

CREATE TABLE personnages (
  id                 TEXT PRIMARY KEY,
  pseudo             TEXT NOT NULL,
  type               TEXT NOT NULL,           -- 8 types de costume (FEAT-003), l'emoji en découle
  couleur            TEXT NOT NULL,           -- 12 couleurs dominantes
  attributs          TEXT NOT NULL DEFAULT '[]', -- JSON : identifiants des 12 attributs
  classe             TEXT NOT NULL,           -- classe D&D (textes §1.5)
  photos_ok          INTEGER NOT NULL DEFAULT 0, -- REQ-010, révocable
  pin_sel            TEXT NOT NULL,
  pin_empreinte      TEXT NOT NULL,           -- HMAC du PIN, jamais le PIN en clair
  langue             TEXT NOT NULL DEFAULT 'fr',
  est_mj             INTEGER NOT NULL DEFAULT 0,
  surconsommation    INTEGER NOT NULL DEFAULT 0, -- RG-003-10
  bloque_jusqu_a     TEXT,                    -- BlocageScan simplifié (surconsommation ; pièges au LOT-3)
  cree_le            TEXT NOT NULL,
  premier_scanne_le  TEXT                     -- premier scan par un autre joueur (RG-003-11, RG-003-12)
);

-- Jeton anonyme du navigateur (FEAT-019) : seule son empreinte SHA-256 est stockée
CREATE TABLE appareils (
  empreinte      TEXT PRIMARY KEY,
  personnage_id  TEXT NOT NULL REFERENCES personnages (id),
  cree_le        TEXT NOT NULL,
  vu_le          TEXT NOT NULL
);
CREATE INDEX appareils_personnage ON appareils (personnage_id);

-- Événement brut, jamais modifié ; id_client garantit l'idempotence
CREATE TABLE scans (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  id_client           TEXT UNIQUE,
  scanneur_id         TEXT,                    -- NULL pour un spectateur
  code                TEXT NOT NULL,
  cible_id            TEXT,                    -- personnage porteur de l'étiquette
  source              TEXT NOT NULL,           -- app, qr_externe, code_manuel
  resultat            TEXT NOT NULL,
  horodatage_client   TEXT,
  horodatage_serveur  TEXT NOT NULL,
  reponse             TEXT                     -- réponse rejouée si le même id_client revient
);
CREATE INDEX scans_scanneur ON scans (scanneur_id);

-- Collection : personnages distincts, non réciproque (RG-004-1, RG-004-4)
CREATE TABLE collection (
  possesseur_id    TEXT NOT NULL,
  personnage_id    TEXT NOT NULL,
  premier_scan_le  TEXT NOT NULL,
  dernier_scan_le  TEXT NOT NULL,
  nb_scans         INTEGER NOT NULL DEFAULT 1,
  code             TEXT NOT NULL,              -- étiquette du premier scan
  PRIMARY KEY (possesseur_id, personnage_id)
);

CREATE TABLE badges (
  personnage_id  TEXT NOT NULL,
  badge          TEXT NOT NULL,
  obtenu_le      TEXT NOT NULL,
  PRIMARY KEY (personnage_id, badge)
);

-- Limitation des PIN (RG-019-4) : par étiquette
CREATE TABLE pin_essais (
  code            TEXT PRIMARY KEY,
  echecs          INTEGER NOT NULL DEFAULT 0,
  bloque_jusqu_a  TEXT
);

ALTER TABLE etiquettes ADD COLUMN reclamee_le TEXT;
CREATE INDEX etiquettes_personnage ON etiquettes (personnage_id);
