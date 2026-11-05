# FEAT-019 : Récupération du personnage

[← Fonctionnalités](README.md)

**Statut :** Confirmé · **Sources :** S2, S3, S5, S6

## Problème
Le navigateur peut perdre le lien avec le personnage :
- sur iOS, la **PWA installée** n'a pas le même stockage que Safari ;
- le QR est ouvert par le **navigateur intégré** d'Instagram ou de Snapchat, puis par Safari ou Chrome ;
- la navigation est privée, ou le joueur change de téléphone.

## Principes (Confirmé, S6, [DEC-052](../decisions.md#dec-052))
- **Toutes les données sont stockées dans le cloud**, dès que le réseau le permet. Le serveur est la source de vérité.
- Les cookies et le localStorage servent seulement de **cache**, pour fonctionner malgré un mauvais réseau ([FEAT-021](pwa-hors-ligne.md)). Le jeu suggère fortement de les accepter.
- Pas de récupération par 3 mots (Abandonné, [DEC-036](../decisions.md#dec-036)).

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-019-1 | À la création, le joueur choisit un **code PIN à 4 chiffres** ([FEAT-003](personnage.md)). | Confirmé (S5) |
| RG-019-2 | Depuis un navigateur sans personnage, le joueur **rescanne une de ses étiquettes** et saisit son PIN : le navigateur récupère le personnage et sa collection depuis le cloud. | Confirmé (S5, S6) |
| RG-019-3 | Quand un navigateur sans personnage scanne une étiquette réclamée, l'écran propose **d'abord et en grand** d'aller trouver le MJ pour obtenir une étiquette ; **plus discrètement, en bas**, le lien « Réintégrer le jeu avec mon PIN » ([DEC-054](../decisions.md#dec-054)). | Confirmé (S6) |
| RG-019-4 | Les tentatives de PIN sont limitées : 5 erreurs par étiquette bloquent la récupération 15 min. Un PIN à 4 chiffres n'a que 10 000 combinaisons, et il faut en plus avoir l'étiquette physique sous la main. | Proposition ([REQ-011](../exigences-transversales.md#req-011)) |
| RG-019-5 | Plusieurs navigateurs peuvent partager le même personnage : l'ancien n'est pas déconnecté. | Proposition |
| RG-019-6 | Détection d'un navigateur intégré, avec un bandeau « Ouvre dans Safari/Chrome ». | Proposition |
| RG-019-7 | Le MJ peut réinitialiser le PIN d'un personnage depuis l'admin, en cas d'oubli. | Proposition |

## Critères d'acceptation
- **CA-019-1 :** Étant donné un personnage créé dans Safari, quand son étiquette est rescannée dans la PWA et le bon PIN saisi, alors la PWA affiche le même personnage et la même collection.
- **CA-019-2 :** Après 5 PIN erronés sur une étiquette, la récupération est bloquée 15 minutes.
- **CA-019-3 :** Étant donné un navigateur sans personnage qui scanne une étiquette réclamée, alors l'invitation à trouver le MJ est l'élément principal de l'écran et le lien de réintégration est secondaire.
- **CA-019-4 :** Étant donné un téléphone dont on vide le stockage du navigateur, alors aucune donnée de jeu n'est perdue côté serveur.
