# FEAT-009 : Quête collective, paliers et révélation finale

[← Fonctionnalités](README.md)

**Statut :** Confirmé · **Sources :** S1, S3 (« c'est génial !!! »), S5, S6, S7

## Objectif
Chaque scan fait avancer une **quête commune**. Tout le monde **a conscience de l'avancement global** (S1). Des **paliers** débloquent des événements pour tous, et une **révélation finale** à heure fixe montre l'image collective de la soirée.

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-009-1 | La progression globale est **visible par tous, en temps réel** ou presque. | Confirmé (S1) |
| RG-009-2 | Unité de progression : nombre de **paires uniques** (connexions) de la soirée ; un rescan compté vaut environ un quart de connexion. La contribution d'un joueur est multipliée par 1,25 par faction supplémentaire ([RG-011-5](factions.md)), et divisée par 2 en surconsommation ([RG-003-10](personnage.md)). | Proposition ; rescans : Confirmé (S5, [DEC-032](../decisions.md#dec-032)) |
| RG-009-3 | Des **paliers collectifs** débloquent des événements pour tous. Les effets ne doivent pas contredire le calendrier fixe des jumeaux (indices toutes les 10 min, groupes complets à 2 h) ni le nombre de chats noirs (1 pour 50 joueurs). Exemples proposés : mission éclair, glitch global, souvenir spécial pour tous, nouvelle légendaire « en rayon ». | Confirmé (principe, S2 → S3) ; seuils et effets : Proposition, à calibrer sur 300 à 400 joueurs |
| RG-009-4 | À une **heure fixe**, la révélation apparaît chez **tout le monde** : **5 h**, fin du jeu à 6 h. Le MJ peut la déclencher ou la décaler depuis l'admin. | Confirmé (S5, [DEC-018](../decisions.md#dec-018)) |
| RG-009-5 | L'image révélée est la **constellation de toutes les connexions** de la soirée, avec le nœud du joueur en surbrillance. | Confirmé (S2 → S3 « génial ») |
| RG-009-6 | La constellation se **réorganise pour former un dessin ou une phrase cachée** (variante S1). | Confirmé (S5, [DEC-033](../decisions.md#dec-033)) ; image : à définir |
| RG-009-7 | Affichage sur un écran ou projecteur de la salle. | **Abandonné** : pas d'écran ([DEC-046](../decisions.md#dec-046)) |
| RG-009-9 | La révélation montre aussi, si possible, une mosaïque des **photos autorisées** par leurs auteurs ([FEAT-017](mur-deja-vu.md)), dans les limites du free tier ou d'un coût estimé à l'avance. | Confirmé (S5, S7) |
| RG-009-11 | **Compte à rebours** : 30 min avant la révélation, une annonce et un compteur apparaissent dans le jeu. Une fois la révélation passée, la fin du jeu est annoncée avec un compteur jusqu'à 6 h. | Confirmé (S7, [DEC-068](../decisions.md#dec-068)) |
| RG-009-12 | La révélation montre chaque joueur multi-factions dans sa faction de rattachement ([RG-011-6](factions.md)). | Confirmé (S7) |
| RG-009-10 | La révélation affiche à chacun son **temps d'écran** de la soirée ([RG-015-5](badges-classements.md)). | Confirmé (S6) |
| RG-009-8 | Les degrés de séparation et les « clans » visibles dans le graphe ([FEAT-010](duel.md)) peuvent colorer la constellation par faction. | Proposition |

## Interface
- Barre de progression globale toujours visible, en en-tête de l'app.
- Toast « Palier atteint ! » chez tout le monde, avec sa description.
- Révélation : plein écran, animation de construction de la constellation, puis zoom sur son propre nœud ; ensuite, vue explorable.

## Critères d'acceptation
- **CA-009-1 :** Étant donné deux appareils ouverts, quand un scan crée une nouvelle paire, alors la barre se met à jour sur les deux appareils en moins de N secondes (N : [REQ-007](../exigences-transversales.md#req-007)).
- **CA-009-2 :** Étant donné qu'un palier est franchi, alors son effet est actif pour tous les joueurs et annoncé une seule fois à chacun.
- **CA-009-3 :** Étant donné l'heure de révélation, alors tout appareil ouvert affiche la révélation, et tout appareil qui rouvre l'app ensuite l'affiche à l'ouverture.
