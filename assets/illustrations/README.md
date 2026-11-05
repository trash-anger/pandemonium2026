# Illustrations

Ces visuels illustrent le concept en tête du [README](../../README.md).

**Statut : proposition graphique** (S11). Ils ont été générés pour ce dépôt par l'assistant de spécification, en HTML, CSS et SVG rendus en images. Ce ne sont **pas** des photos réelles, des captures d'une application existante ni des maquettes validées. Les QR codes sont factices. La direction graphique définitive sera travaillée dans une phase ultérieure.

## Direction graphique proposée

Inspirée du [teaser](../../teaser/README.md) :

- **Couleurs** : fond presque noir (`#0b0a0f`), crème (`#efe9df`), rose soldes (`#ff4f8b`), vert Matrice (`#3dff8a`), manille (`#d9b98a`) et doré (`#ffd166`) pour les légendaires et le jumeau.
- **Glitch** : titres en Arial Black décalés de rose et de vert, tranches découpées, lignes de balayage.
- **Surveillance de magasin** : cadre « REC · CAM 07 », boîtes de détection, horodatage.
- **Avatars** : un avatar brillant par type de costume, emballé comme un jouet en blister avec un prix soldé.
- **Consommation, Halloween et D&D** : bandeaux de soldes, tickets de caisse, factions à alignement.

## Fichiers

| Fichier | Illustre | Source |
|---------|----------|--------|
| `banniere.webp` | [Vision](../../specs/vision.md), [Univers et ton](../../specs/univers-et-ton.md) | `src/banniere.html` |
| `scene-scan.webp` | [FEAT-002](../../specs/fonctionnalites/scan.md), [FEAT-004](../../specs/fonctionnalites/collection.md), [FEAT-006](../../specs/fonctionnalites/faux-souvenirs.md) : le geste, scanner l'étiquette portée par quelqu'un d'autre | `src/scene-scan.html` |
| `avatars.webp` | [FEAT-003](../../specs/fonctionnalites/personnage.md), [textes §1.1](../../specs/textes.md#11-types-de-costume-feat-003) | `src/avatars.html` |
| `etiquettes.webp` | [FEAT-001](../../specs/fonctionnalites/etiquettes-impression.md), [FEAT-022](../../specs/fonctionnalites/costume-mj.md) | `src/etiquettes.html` |
| `ecrans-jeu.webp` | [FEAT-003](../../specs/fonctionnalites/personnage.md), [Interface §2bis](../../specs/interface.md#2bis-accueil-et-tutoriel), [FEAT-006](../../specs/fonctionnalites/faux-souvenirs.md), [FEAT-008](../../specs/fonctionnalites/chat-noir.md) | `src/ecrans-jeu.html` |
| `roles-factions.webp` | [FEAT-007](../../specs/fonctionnalites/jumeaux.md), [FEAT-008](../../specs/fonctionnalites/chat-noir.md), [FEAT-011](../../specs/fonctionnalites/factions.md), [FEAT-015](../../specs/fonctionnalites/badges-classements.md), [FEAT-022](../../specs/fonctionnalites/costume-mj.md) | `src/roles-factions.html` |
| `revelation.webp` | [FEAT-009](../../specs/fonctionnalites/quete-collective.md) (RG-009-13 à RG-009-16) | `src/revelation.html` |

Licence : Apache 2.0, comme le dépôt. Les emoji sont rendus avec la police du système. Les noms, chiffres et pseudos sont fictifs. La silhouette d'étiquette dans `revelation.webp` remplace le dessin caché, que Florian définira plus tard.

## Régénérer

Il faut Google Chrome et `cwebp` (`brew install webp`). Depuis `src/` :

```sh
./render.sh banniere 1360 640
./render.sh scene-scan 1360 700
./render.sh avatars 1360 870
./render.sh etiquettes 1360 700
./render.sh ecrans-jeu 1360 760
./render.sh roles-factions 1360 790
./render.sh revelation 1360 780
```

`kit.css` contient la palette et les effets communs ; `kit.js` dessine les 8 avatars (`avatar(type)`) et les QR factices.
