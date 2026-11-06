-- LOT-3 (étape A) : quête collective, points de faction, événements globaux (FEAT-009, FEAT-011, FEAT-020)
-- Contribution de chaque scan à la quête (barème §1.1), déjà multipliée
ALTER TABLE scans ADD COLUMN quete REAL NOT NULL DEFAULT 0;

-- Compteurs cumulés (quête, score de chaque faction) : lus à chaque rafraîchissement sans parcourir les scans
CREATE TABLE compteurs (
  cle     TEXT PRIMARY KEY,           -- 'quete', 'faction:ordre', …
  valeur  REAL NOT NULL DEFAULT 0
);

-- Points de faction par joueur (barème §2), pour le rattachement final (RG-011-6) et les sanctions
CREATE TABLE points_faction (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  personnage_id  TEXT NOT NULL,
  faction        TEXT NOT NULL,
  points         REAL NOT NULL,
  raison         TEXT NOT NULL,
  le             TEXT NOT NULL
);
CREATE INDEX points_faction_perso ON points_faction (personnage_id, faction);

-- Événements globaux diffusés à tous : paliers, soldes éclair, glitchs, messages du MJ
CREATE TABLE evenements (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  type     TEXT NOT NULL,             -- palier, solde, glitch, message
  cle      TEXT UNIQUE,               -- 'palier:2' : un palier n'est franchi qu'une fois
  donnees  TEXT NOT NULL DEFAULT '{}',
  debut    TEXT NOT NULL,
  fin      TEXT,
  auteur   TEXT
);
