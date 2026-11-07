-- LOT-6 : missions éclair globales (FEAT-013). La mission elle-même est un événement (type 'mission') ;
-- cette table garantit qu'un joueur n'est récompensé qu'une fois par mission (CA-013-1).
CREATE TABLE eclair_reussites (
  evenement_id   INTEGER NOT NULL,
  personnage_id  TEXT NOT NULL,
  le             TEXT NOT NULL,
  PRIMARY KEY (evenement_id, personnage_id)
);
