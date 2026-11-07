-- LOT-3 D : notifications Web Push (FEAT-016, CT-008).
-- Un abonnement par appareil. L'adresse (endpoint) est longue et aléatoire : le service worker s'en sert
-- comme clé pour lire le contenu à afficher, car les pushs partent sans contenu chiffré.
CREATE TABLE abonnements_push (
  endpoint       TEXT PRIMARY KEY,
  personnage_id  TEXT NOT NULL,
  cree_le        TEXT NOT NULL,
  dernier_envoi  TEXT,                       -- RG-016-3 : au plus un push toutes les 10 min, sauf urgences
  vu_notif       INTEGER NOT NULL DEFAULT 0, -- dernier notifs.id déjà poussé
  vu_evt         INTEGER NOT NULL DEFAULT 0, -- dernier evenements.id déjà poussé
  contenu        TEXT,                       -- ce que le service worker affiche au prochain push (JSON)
  echecs         INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX abonnements_push_perso ON abonnements_push (personnage_id);
