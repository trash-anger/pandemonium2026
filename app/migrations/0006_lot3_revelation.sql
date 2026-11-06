-- LOT-3 (étape B) : instantané de la révélation (FEAT-009, RG-009-13).
-- Construit une seule fois par heure de révélation, avec les données d'avant cette heure, puis servi à tous.
CREATE TABLE revelations (
  revelation  TEXT PRIMARY KEY,   -- heure de la révélation (ISO UTC)
  donnees     TEXT NOT NULL,      -- JSON : nœuds, liens, image cachée, paliers franchis
  cree_le     TEXT NOT NULL
);
