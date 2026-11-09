-- Après la fête : page de fin (dossier fin/) et ses analytics, sans cookie.
-- Le visiteur est une empreinte hachée du jour (IP + navigateur + date + secret) : ni IP ni identifiant durable stockés.
CREATE TABLE visites (
  id            TEXT PRIMARY KEY,
  le            TEXT NOT NULL,
  visiteur      TEXT NOT NULL,
  hote          TEXT,
  chemin        TEXT,
  code          TEXT,                      -- étiquette scannée (chemin = code d'une étiquette du jeu)
  source        TEXT NOT NULL,             -- etiquette, campagne, reseaux, recherche, site, teaser, direct
  referent      TEXT,                      -- domaine du site d'origine
  utm_source    TEXT, utm_medium TEXT, utm_campaign TEXT,
  pays          TEXT, region TEXT, ville TEXT,
  appareil      TEXT, navigateur TEXT, os TEXT, langue TEXT,
  app           INTEGER NOT NULL DEFAULT 0, -- ouverte depuis l'app installée
  ecran         TEXT,
  bot           INTEGER NOT NULL DEFAULT 0,
  duree_ms      INTEGER NOT NULL DEFAULT 0, -- temps passé page visible
  defilement    INTEGER NOT NULL DEFAULT 0, -- défilement maximal, en %
  vu_le         TEXT
);
CREATE INDEX visites_le ON visites (le);
CREATE INDEX visites_visiteur ON visites (visiteur, le);

CREATE TABLE clics_fin (
  visite_id  TEXT NOT NULL,
  type       TEXT NOT NULL,               -- partage, partage_ok, copie, pandemonium, langue
  le         TEXT NOT NULL
);
CREATE INDEX clics_fin_visite ON clics_fin (visite_id);
CREATE INDEX clics_fin_le ON clics_fin (le);
