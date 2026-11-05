-- Étiquettes du banc d'essai : créées par « Stock de test », jamais imprimées ni exportées.
-- En production, le banc ne touche qu'à elles.
ALTER TABLE etiquettes ADD COLUMN banc INTEGER NOT NULL DEFAULT 0;
