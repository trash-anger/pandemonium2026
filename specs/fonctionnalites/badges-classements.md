# FEAT-015 : Badges et classements

[← Fonctionnalités](README.md)

**Statut :** Confirmé · **Sources :** S1, S2, S3, S5, S6, S7, S8, S10

## Objectif
Récompenser des styles de jeu variés, pas seulement le volume de scans, et permettre de **se comparer** (S1 : « avoir un leaderboard »).

## Classements
| ID | Classement | Définition | Statut |
|----|-----------|------------|--------|
| LB-1 | **Collectionneu.r.se** | Nombre de personnages distincts scannés | Confirmé (S1) |
| LB-2 | **Célébrité.e** | Nombre de scanneurs distincts | Confirmé (S3 la nomme) |
| LB-3 | **Fantôme** | Très scanné, mais scanne peu lui-même | Confirmé (S3, S5) ; formule réglable dans l'admin |
| LB-4 | **Boucle infinie** | Nombre de rescans comptés | Confirmé (S3) |
| LB-5 | **Business.wo.man** | Durée cumulée, application ouverte au premier plan, mesurée côté client et envoyée régulièrement au cloud | Confirmé (S3, S6) |
| LB-6 | **Pont** | Joueur qui relie le plus de groupes (centralité) | Confirmé (S10) |
| LB-7 | **Premier jumeau réuni** | Horodatage des retrouvailles | Confirmé (S10) |
| LB-8 | **Faction** | Score par faction | Confirmé (S7) ; [FEAT-011](factions.md) |
| LB-9 | **Classements par faction** | Les classements LB-1 à LB-5, restreints à chaque faction | Confirmé (S7) |

## Badges
| ID | Badge | Condition | Statut |
|----|-------|-----------|--------|
| BDG-1 | Tueur de poussin | [RG-003-6](personnage.md) | Confirmé |
| BDG-2 | Jumeaux retrouvés | [RG-007-10](jumeaux.md) | Confirmé |
| BDG-3 | Boucle détectée / Jour de la marmotte / ×13 secret | [RG-005-2](rescan-deja-vu.md) | Confirmé |
| BDG-4 | Installé le Portail | App installée sur l'écran d'accueil ([FEAT-021](pwa-hors-ligne.md)) | Confirmé (S5, S10) |
| BDG-5 | Fermer la boucle | [RG-005-7](rescan-deja-vu.md) | Confirmé |
| BDG-6 | Patient zéro | Premier joueur corrompu par un chat noir | Confirmé (S10) |
| BDG-6b | Dernier survivant | Joueur jamais corrompu qui a fait le plus de nouvelles cartes au moment de la révélation (départage des derniers non corrompus) | Confirmé (S10) |
| BDG-7 | Série complète | [RG-012-2](series-rarete.md) | Confirmé (principe) |
| BDG-8 | Installé | Fusionné avec BDG-4 « Installé le Portail » | Abandonné (doublon, S10) |
| BDG-9 | Garde-robe du MJ | [RG-022-3](costume-mj.md) | Confirmé (S10) |
| BDG-10 | Anticapitaliste | Légendaire L-5 ([FEAT-022](costume-mj.md)) | Confirmé (S7) |
| BDG-11 | Achat compulsif | Ajouter une étiquette à son personnage ([RG-003-6](personnage.md)) | Confirmé (S7) |
| BDG-12 | Surconsommation | Plus de 3 étiquettes ([RG-003-10](personnage.md)) | Confirmé (S7) |
| BDG-14 | Trans-classe | Changer de classe D&D ([RG-003-12](personnage.md)) | Confirmé (S8) |
| BDG-15 | Amnésie | Jauge de souvenirs à 0 ([barème §3](../bareme.md#3-mémoire-et-rôles-gagnés)) | Confirmé (S10) |
| BDG-16 | Employé du mois | Réussir une mission confiée par le MJ ([ADM-19](admin.md)) | Proposition |
| BDG-17 | Client difficile | Sanction de niveau 1 ([ADM-18](admin.md)) | Confirmé (S9) |
| BDG-13 | Badges de faction | En fin de partie, un badge par faction pour chaque classement pertinent (par exemple « Célébrité de la Friperie »), en plus du badge global | Confirmé (S7, [RG-011-7](factions.md)) |

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-015-1 | Le temps passé ne compte que lorsque la page est **visible** (`visibilitychange`) | Confirmé (mesure côté client, S3) ; plafond : Proposition |
| RG-015-4 | Le temps d'écran est **enregistré et envoyé régulièrement au cloud** (proposition : toutes les 60 s quand l'app est visible, et au passage en arrière-plan). Hors ligne, il est cumulé localement et envoyé au retour du réseau. Le serveur refuse un cumul supérieur au temps réellement écoulé. | Confirmé (S6) ; fréquence : Proposition |
| RG-015-5 | À la **révélation finale**, chaque joueur découvre le **temps qu'il a passé sur l'app**, en valeur et en part de la soirée (« 2 h 13, soit 41 % de ta soirée à regarder ton écran »). C'est le propos critique du jeu sur les écrans et la consommation. | Confirmé (S6) ; formulation : Proposition |
| RG-015-6 | Le badge « Tueur de poussin » n'est pas attribué au joueur qui ajoute sa propre étiquette à son personnage ([RG-003-6](personnage.md)). | Confirmé (S6) |
| RG-015-2 | Les classements sont figés à la révélation (5 h) ; le temps d'écran continue d'être compté jusqu'à la fin (6 h). | Proposition ([DEC-018](../decisions.md#dec-018)) |
| RG-015-3 | Chaque classement montre le top 10 et la position du joueur. | Proposition |

## Critères d'acceptation
- **CA-015-1 :** Étant donné un joueur qui garde l'app ouverte 10 min au premier plan, puis 10 min en arrière-plan, alors 10 min (±5 %) lui sont créditées.
- **CA-015-2 :** Chaque badge n'est attribué qu'une fois par joueur, sauf indication contraire.
- **CA-015-3 :** Étant donné un joueur qui vide le stockage de son navigateur puis réintègre le jeu, alors son temps d'écran déjà envoyé est conservé.
