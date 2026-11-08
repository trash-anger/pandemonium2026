-- Duel D&D (FEAT-010 §10.3) : A défie B après l'avoir scanné ; B accepte ou refuse dans les 60 s (RG-010-9).
-- Les jets ne sont tirés qu'à l'acceptation (CA-010-3, CA-010-4).
CREATE TABLE duels (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  a_id         TEXT NOT NULL,              -- qui défie
  b_id         TEXT NOT NULL,              -- qui est défié
  etat         TEXT NOT NULL,              -- attente, accepte, refuse (l'expiration se lit sur expire_le)
  cree_le      TEXT NOT NULL,
  expire_le    TEXT NOT NULL,
  resolu_le    TEXT,
  resultat     TEXT                        -- JSON : épreuve, jets, gagnant
);
CREATE INDEX duels_a ON duels (a_id, cree_le);
CREATE INDEX duels_b ON duels (b_id, cree_le);
