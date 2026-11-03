# FEAT-019 : Récupération du personnage

[← Fonctionnalités](README.md)

**Statut :** Proposition (S2) ; le problème est reconnu par Florian (S3) · **Sources :** S2, S3

## Problème
Le personnage est lié au **stockage local du navigateur**. On risque de le perdre dans plusieurs cas :
- le QR est ouvert par le **navigateur intégré** d'Instagram ou de Snapchat, puis par Safari ou Chrome ;
- la navigation est privée ;
- le joueur change de téléphone ou recharge celui d'un ami.

En réponse, Florian a proposé (S3) le **scanner intégré** ([FEAT-002](scan.md)), qui garde le joueur dans le même navigateur. Il serait aussi judicieux d'uploader le localstorage progressivement au travers de l'API en asynchrone.

## Solution proposée (non validée, [Q-025](../questions-ouvertes.md#q-025))
| ID | Règle | Statut |
|----|-------|--------|
| RG-019-1 | À la création, l'app affiche **3 mots de récupération** thématiques (« lave-auto cape 1997 »). | Proposition |
| RG-019-2 | Saisir ces 3 mots sur un autre appareil y transfère le personnage. L'ancien appareil perd l'accès. | Proposition |
| RG-019-3 | Autre voie : rescanner **sa propre étiquette** et prouver qu'on en est propriétaire en saisissant les 3 mots. | Proposition |
| RG-019-4 | Les tentatives de récupération sont limitées pour empêcher le vol de personnage ([REQ-011](../exigences-transversales.md#req-011)). | Proposition |
| RG-019-5 | Détection d'un navigateur intégré, avec un bandeau « Ouvre dans Safari/Chrome ». | Proposition |

## Critères d'acceptation (si validée)
- **CA-019-1 :** Étant donné un personnage créé sur l'appareil 1, quand ses 3 mots sont saisis sur l'appareil 2, alors l'appareil 2 a le même personnage et la même collection.
- **CA-019-2 :** Après 5 tentatives erronées, la récupération est bloquée 5 minutes.
