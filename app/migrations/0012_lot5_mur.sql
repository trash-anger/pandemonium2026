-- LOT-5 : mur « Déjà vu ! » (FEAT-017). Une photo basse qualité par scan fait dans l'app, si le scanneur y consent.
-- L'image est gardée en data URL JPEG (quelques Ko, REQ-008) : pas de bucket R2 à créer le jour de la fête.
CREATE TABLE photos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  scan_id        INTEGER NOT NULL UNIQUE,       -- une photo par scan
  personnage_id  TEXT NOT NULL,                 -- le scanneur, qui a consenti (RG-017-4)
  image          TEXT NOT NULL,                 -- data:image/jpeg;base64,…
  masquee        INTEGER NOT NULL DEFAULT 0,    -- masquée par le MJ (RG-017-6)
  le             TEXT NOT NULL
);
CREATE INDEX photos_personnage ON photos (personnage_id);
