# FEAT-004 : Collection et cartes

[← Fonctionnalités](README.md)

**Statut :** Confirmé · **Sources :** S1

## Objectif
Le but premier du jeu : **collectionner les personnes scannées** pendant la soirée (S1).

## Parcours nominal
1. A scanne l'étiquette réclamée de B pour la première fois.
2. La carte de B est ajoutée à la collection de A, avec son pseudo, son emoji, ses attributs de costume, sa rareté et sa série ([FEAT-012](series-rarete.md)), ainsi que l'heure du premier scan.
3. L'écran de résultat montre la nouvelle carte, le faux souvenir ([FEAT-006](faux-souvenirs.md)) et la comparaison ([FEAT-010](duel.md)).

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-004-1 | La collection contient des **personnages distincts** ; un rescan n'ajoute pas de carte ([FEAT-005](rescan-deja-vu.md)). | Confirmé (S1, S3) |
| RG-004-2 | Se scanner soi-même n'ajoute pas de carte : on voit sa propre fiche et l'indice de son jumeau ([FEAT-007](jumeaux.md)). | Confirmé (S1 : scanner sa propre étiquette donne le message « Ton double existe… ») |
| RG-004-3 | La collection se classe par ordre d'ajout ; un filtre par série ou rareté est possible. | Proposition |
| RG-004-4 | La collection **n'est pas réciproque** : quand A scanne B, B n'obtient pas la carte de A. | Confirmé (S5, [DEC-025](../decisions.md#dec-025)) |
| RG-004-5 | « Perdre des souvenirs » ([RG-005-5](rescan-deja-vu.md)) ne supprime pas de carte. | Confirmé (S5, [DEC-031](../decisions.md#dec-031)) |
| RG-004-6 | La collection contient des **personnages**, pas des étiquettes : scanner une autre étiquette d'un personnage déjà collectionné est un « Déjà vu ». | Confirmé (S5, S6) |
| RG-004-7 | Les légendaires et les pièges du MJ apparaissent dans une section à part, « Légendes » ([FEAT-022](costume-mj.md)). | Proposition |

## Interface
- **Vide :** « Ton placard est vide. Va scanner du monde. »
- **Liste :** grille de cartes (emoji, pseudo, rareté) ; le compteur « Déjà vu ×N » apparaît sur les cartes concernées.
- **Détail d'une carte :** attributs, faux souvenir, réactions reçues et laissées, compteur de rescans.

## Critères d'acceptation
- **CA-004-1 :** Étant donné A qui scanne B pour la première fois, alors la collection de A compte une carte de plus et contient B.
- **CA-004-2 :** Étant donné A qui scanne sa propre étiquette, alors sa collection ne change pas.
- **CA-004-3 :** La collection reste consultable hors ligne, à partir de la dernière version synchronisée.
