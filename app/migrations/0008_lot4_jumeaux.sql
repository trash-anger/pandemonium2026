-- LOT-4 : jumeaux et triplés (FEAT-007), chats noirs et glitch contagieux (FEAT-008).

-- Groupes formés pendant la soirée (RG-007-1) : 2 joueurs (jumeaux) ou 3 (triplés)
CREATE TABLE groupes (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  type      TEXT NOT NULL CHECK (type IN ('jumeaux', 'triples')),
  forme_le  TEXT NOT NULL,
  reuni_le  TEXT
);
ALTER TABLE personnages ADD COLUMN groupe_id INTEGER;
-- Indices bonus (L-4, M-5) en plus du calendrier (un toutes les 10 min à partir de minuit)
ALTER TABLE personnages ADD COLUMN indices_bonus INTEGER NOT NULL DEFAULT 0;
CREATE INDEX personnages_groupe ON personnages (groupe_id);

-- Paires mutuelles validées dans la fenêtre de 90 s (RG-007-7) ; a < b
CREATE TABLE retrouvailles (
  groupe_id INTEGER NOT NULL,
  a         TEXT NOT NULL,
  b         TEXT NOT NULL,
  le        TEXT NOT NULL,
  PRIMARY KEY (a, b)
);

-- Chat noir (RG-008-1) : rôle secret attribué pendant la soirée
ALTER TABLE personnages ADD COLUMN chat_noir_le TEXT;

-- Périodes de corruption (PeriodeCorruption, donnees.md) : servent à l'état et au graphe de propagation.
-- Immunisé de fin à immun_jusqu_a (RG-008-5b).
CREATE TABLE corruptions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  personnage_id  TEXT NOT NULL,
  debut          TEXT NOT NULL,
  fin            TEXT NOT NULL,
  immun_jusqu_a  TEXT,
  source_id      TEXT,             -- chat noir ou corrompu qui a transmis
  cause          TEXT NOT NULL     -- chat, corrompu, sanction, surconsommation, foyer
);
CREATE INDEX corruptions_personnage ON corruptions (personnage_id, fin);
CREATE INDEX corruptions_fin ON corruptions (fin);
