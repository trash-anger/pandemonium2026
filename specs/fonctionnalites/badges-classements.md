# FEAT-015 : Badges et classements

[← Fonctionnalités](README.md)

**Statut :** Confirmé · **Sources :** S1, S2, S3

## Objectif
Récompenser des styles de jeu variés, pas seulement le volume de scans, et permettre de **se comparer** (S1 : « avoir un leaderboard »).

## Classements
| ID | Classement | Définition | Statut |
|----|-----------|------------|--------|
| LB-1 | **Collectionneu.r.se** | Nombre de personnages distincts scannés | Confirmé (S1) |
| LB-2 | **Célébrité.e** | Nombre de scanneurs distincts | Confirmé (S3 la nomme) |
| LB-3 | **Fantôme** | Très scanné, mais scanne peu lui-même | Confirmé (S3) ; formule : [Q-012](../questions-ouvertes.md#q-012) |
| LB-4 | **Boucle infinie** | Nombre de rescans comptés | Confirmé (S3) |
| LB-5 | **Business.wo.man** | Durée cumulée, application ouverte au premier plan, mesurée côté client | Confirmé (S3) |
| LB-6 | **Pont** | Joueur qui relie le plus de groupes (centralité) | Proposition (S2) |
| LB-7 | **Premier jumeau réuni** | Horodatage des retrouvailles | Proposition (S2) |
| LB-8 | **Faction** | Score par faction | Confirmé (principe) ; [Q-014](../questions-ouvertes.md#q-014) |

## Badges
| ID | Badge | Condition | Statut |
|----|-------|-----------|--------|
| BDG-1 | Tueur de poussin | [RG-003-6](personnage.md) | Confirmé |
| BDG-2 | Jumeaux retrouvés | [RG-007-10](jumeaux.md) | Confirmé |
| BDG-3 | Boucle détectée / Jour de la marmotte / ×13 secret | [RG-005-2](rescan-deja-vu.md) | Confirmé |
| BDG-4 | Installé le Portail | App installée sur l'écran d'accueil ([FEAT-021](pwa-hors-ligne.md)) | Proposition (S2) |
| BDG-5 | Fermer la boucle | [RG-005-7](rescan-deja-vu.md) | Confirmé |
| BDG-6 | Patient zéro | Premier joueur corrompu par un chat noir | Proposition |
| BDG-6 | Dernier survivant | Dernier joueur corrompu par un chat noir | Proposition |
| BDG-7 | Série complète | [RG-012-2](series-rarete.md) | Confirmé (principe) |

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-015-1 | Le temps passé ne compte que lorsque la page est **visible** (`visibilitychange`) | Confirmé (mesure côté client, S3) ; plafond : Proposition |
| RG-015-2 | Les classements sont figés à l'heure de fin ([Q-001](../questions-ouvertes.md#q-001)). | Proposition |
| RG-015-3 | Chaque classement montre le top 10 et la position du joueur. | Proposition |

## Critères d'acceptation
- **CA-015-1 :** Étant donné un joueur qui garde l'app ouverte 10 min au premier plan, puis 10 min en arrière-plan, alors 10 min (±5 %) lui sont créditées.
- **CA-015-2 :** Chaque badge n'est attribué qu'une fois par joueur, sauf indication contraire.
