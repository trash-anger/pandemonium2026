-- LOT-3 (étape C) : costume du MJ (FEAT-022), pause, sanctions et missions personnelles (ADM-17 à ADM-19).

-- Cause du blocage du scanner : piège (T-1…T-5), pause, sanction, surconsommation
ALTER TABLE personnages ADD COLUMN bloque_cause TEXT;
-- Sanction de niveau 5 « Interdit de magasin » : ses étiquettes ne répondent plus, il sort des classements
ALTER TABLE personnages ADD COLUMN suspendu INTEGER NOT NULL DEFAULT 0;

-- Effets obtenus (légendaires L-x, pièges T-x) et effets en cours (fin, ou nombre d'usages restants)
CREATE TABLE effets (
  personnage_id  TEXT NOT NULL,
  effet          TEXT NOT NULL,   -- L-1…L-10, T-1…T-5, M-6 (solde privée), S-3 (article défectueux)
  obtenu_le      TEXT NOT NULL,
  fin            TEXT,            -- effet limité dans le temps
  reste          INTEGER,         -- effet à usages (L-2, L-4, L-5, M-6)
  PRIMARY KEY (personnage_id, effet)
);
CREATE INDEX effets_effet ON effets (effet, obtenu_le);

-- Sanctions graduées (ADM-18), annulables (RG-020-10)
CREATE TABLE sanctions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  personnage_id  TEXT NOT NULL,
  niveau         INTEGER NOT NULL,
  le             TEXT NOT NULL,
  auteur         TEXT,
  donnees        TEXT NOT NULL DEFAULT '{}', -- ce qu'il faut rendre en cas d'annulation
  annulee_le     TEXT
);

-- Missions personnelles du MJ (ADM-19) : une seule active par joueur (RG-020-12)
CREATE TABLE missions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  personnage_id  TEXT NOT NULL,
  code           TEXT NOT NULL,   -- M-1…M-7
  donnees        TEXT NOT NULL DEFAULT '{}',
  debut          TEXT NOT NULL,
  fin            TEXT,
  etat           TEXT NOT NULL DEFAULT 'active' CHECK (etat IN ('active', 'reussie', 'echouee', 'annulee', 'offerte')),
  auteur         TEXT,
  termine_le     TEXT
);
CREATE INDEX missions_etat ON missions (etat, personnage_id);

-- Messages personnels (sanction, mission) : le joueur les relève avec /api/notifs
CREATE TABLE notifs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  personnage_id  TEXT NOT NULL,
  type           TEXT NOT NULL,
  donnees        TEXT NOT NULL DEFAULT '{}',
  le             TEXT NOT NULL
);
CREATE INDEX notifs_personnage ON notifs (personnage_id, id);
