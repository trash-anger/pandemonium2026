# Page de fin « Déjà vu ! · 242 nouvelles amitiés !!! »

Après la fête, tout le trafic de `https://p.uyt.re/` (n'importe quel chemin, y compris les QR des étiquettes) et de `https://pandemonium2026.uyt.re/` (l'ancien teaser) arrive sur cette page. Seuls l'admin (`/admin`, connexion Google) et les routes `/fin/…` restent actifs ; l'API du jeu répond `410`.

| Fichier | Rôle |
|---------|------|
| `index.html` | La page : HTML, CSS et JS intégrés, polices système. Servie par le Worker de `app/` (`src/fin.ts`), qui l'importe comme texte |
| `og.png` | Image d'aperçu des réseaux sociaux (1200×630), servie à `/og.png` sur les deux domaines |

## Ce que fait la page

- **Mosaïque en fond** : les photos de la révélation (`/fin/photos.json` : joueurs qui ont accepté les photos, sans celles écartées dans l'admin → 📷 Photos ; cache de 5 min), complétées par de fausses étiquettes QR dessinées dans le navigateur. Une vignette change toutes les 160 ms, avec le même effet « déjà vu » que la révélation. Écartée dans l'admin, une photo disparaît de la page en 5 min au plus.
- **Glitch** : courts sursauts sur « DÉJÀ VU ! » et « 242 », jamais plus de 3 par seconde ; rien si le téléphone demande de réduire les animations.
- **242** compté depuis 0. Le chiffre est fixe : `NOMBRE` en tête du script, et les textes `T.fr` / `T.en`.
- **Bilingue** : langue du navigateur, bouton en pied de page, ou `?lang=fr` / `?lang=en`.
- **Partager** : partage natif sur mobile, copie du lien sur ordinateur.
- **Ancienne app installée** : la page désinscrit son service worker et vide ses caches.

## Analytics

Sans cookie. Au chargement, la page envoie `/fin/v` (chemin, référent, utm, langue, écran, app installée) ; le serveur ajoute pays, région et ville (Cloudflare), appareil et navigateur (User-Agent) et une empreinte du jour (hachage IP + navigateur + date + secret ; l'IP n'est pas stockée). Le temps passé page visible et le défilement partent en `sendBeacon` (`/fin/f`), les clics en `/fin/e`. Rien n'est envoyé si le navigateur demande « ne pas suivre » (DNT ou GPC), ni quand le MJ est connecté à l'admin. Résultats : admin → 📈 Stats (`/admin/analytics`), export CSV.

## Modifier l'image d'aperçu

`index.html?og=1&lang=fr` affiche la composition 1200×630 (fausses étiquettes seulement, aucune photo de la soirée). Pour régénérer `og.png` :

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1200,630 --virtual-time-budget=1500 --screenshot=fin/og.png "file://$PWD/fin/index.html?og=1&lang=fr"
```

Les réseaux gardent l'ancien aperçu en cache : le débogueur de partage de Facebook (« Scrape Again ») le rafraîchit.
