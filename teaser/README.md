# Page teaser « Déjà vu ! »

Page autonome servie à `https://pandemonium2026.uyt.re/`. Elle a été générée à partir de [`prompts/teaser-index.md`](../prompts/teaser-index.md).

| Fichier | Rôle |
|---------|------|
| `index.html` | La page : HTML, CSS et JS intégrés, environ 27 Ko, aucune requête réseau, polices système |
| `og.png` | Image d'aperçu des réseaux sociaux (1200×630), à publier à la racine : `https://pandemonium2026.uyt.re/og.png` |
| `ruee.mp4` | « Caméra 07 » : les 45 premières images de `black-friday-gif.webp` (la ruée), en boucle, 220 Ko. Sur mobile, elle sert de fond très sombre derrière le titre. Sur grand écran (1100 px et plus), elle devient un petit moniteur fixe dans la marge de gauche |
| `ruee-fixe.webp` | Image fixe de la caméra, affichée avec `prefers-reduced-motion`, sans JavaScript ou si la lecture automatique est bloquée |
| `black-friday-gif.webp` | Source d'origine (9,5 Mo). Elle n'est pas utilisée par la page, inutile de la déployer |

## Modifier les dates

En tête du `<script>` :

```js
var TZ = "America/Toronto";
var DEBUT = [2026, 11, 7, 21, 0];  // année, mois, jour, heure, minute (heure de Montréal)
var FIN   = [2026, 11, 8, 6, 0];
```

Les dates affichées en toutes lettres (`when`, `infoWhen`, `timerSr`) sont dans le dictionnaire : mets-les à jour aussi.

## Modifier les textes

Tous les textes se trouvent dans l'objet `T` du script : `T.fr` et `T.en`.

- `commun` contient les valeurs par défaut.
- `avant`, `pendant` et `apres` remplacent ces valeurs selon la phase.
- Une valeur `null` masque l'élément. Par exemple, `timerLabel: null` en phase « après » masque la minuterie.

Le mot « étiquette » n'apparaît qu'une fois, dans `fine` (« Lire l'étiquette avant de vous perdre »).

## Tester

| URL | Effet |
|-----|-------|
| `?phase=avant` / `?phase=pendant` / `?phase=apres` | Force une phase |
| `?now=2026-11-07T20:59` | Simule l'heure de Montréal. L'horloge avance ensuite normalement : à 21 h, la page passe d'elle-même à « pendant » |
| Recharger la page | Fait apparaître un grand « Déjà vu ! » en filigrane |
| Revenir une deuxième fois, puis une troisième | Affiche « Tu étais déjà ici », puis le numéro de visite (si le stockage local est disponible) |

Le compte à rebours recule d'une à trois secondes à intervalles irréguliers (4 à 32 s), puis se recale sur l'heure exacte.

Les glitchs arrivent de façon irrégulière, seuls ou en rafales de 2 ou 3, avec parfois de longs silences. Il y en a cinq sortes : titre découpé en tranches, lettres corrompues, ligne du titre en écho, mot qui bégaie dans le texte, secousse de la page. Leurs proportions se règlent dans `POIDS`, et le rythme dans `crise()`. Pour limiter les flashs, deux effets sont toujours espacés d'au moins 0,6 s. Avec `prefers-reduced-motion`, les glitchs, le bandeau défilant et la vidéo sont désactivés.

La vidéo de la caméra 07 tourne en boucle, et son horodatage revient à 21:00:00 à chaque tour. Les légendes (`camCap`) changent selon la phase.

Pour vérifier l'aperçu du lien après le déploiement : [opengraph.xyz](https://www.opengraph.xyz/) ou le [débogueur de partage de Facebook](https://developers.facebook.com/tools/debug/).
