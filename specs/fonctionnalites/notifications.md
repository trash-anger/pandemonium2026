# FEAT-016 : Notifications

[← Fonctionnalités](README.md)

**Statut :** Confirmé, **dans le périmètre de samedi** ([DEC-076](../decisions.md#dec-076)) ; faisabilité selon la plateforme · **Sources :** S1, S2, S8

## Objectif
Prévenir les joueurs d'événements globaux même quand ils ne regardent pas l'app. Le cas premier est **l'annonce de la fin, 30 minutes avant, à tout le monde** (S1).

## Événements candidats
| Événement | Statut |
|-----------|--------|
| Révélation dans 30 min (4 h 30), avec compteur dans le jeu | Confirmé (S1, S7) |
| Révélation terminée : fin du jeu à 6 h, avec compteur | Confirmé (S7) |
| Palier collectif atteint ([FEAT-009](quete-collective.md)) | Proposition |
| Mission éclair ([FEAT-013](missions-eclair.md)) | Hypothèse |
| Attribution d'un jumeau et nouvel indice ([FEAT-007](jumeaux.md)) | Proposition |
| « Tu es un chat noir » ([FEAT-008](chat-noir.md)) | Confirmé (S7) |
| Remise en rayon du « Dernier exemplaire » à 21 h, minuit et 3 h ([FEAT-022](costume-mj.md)) | Proposition |
| Message du MJ ([FEAT-020](admin.md)) | Proposition |
| **Au MJ** : suggestion de réglage ([ADM-16](admin.md)) | Confirmé (S9) |
| Sanction reçue ([ADM-18](admin.md)) | Confirmé (S9) |
| Défi en duel ([FEAT-010](duel.md)) | Proposition |
| Message du lendemain ([FEAT-018](lendemain-partage.md)) | Proposition |

## Contraintes de plateforme
Elles sont détaillées dans [CT-008](../contraintes-techniques.md#ct-008). En résumé : un minuteur JavaScript ne s'exécute pas sur un téléphone verrouillé, il faut du **Web Push** côté serveur. Sur **iOS**, Web Push ne fonctionne **que si l'app est installée** sur l'écran d'accueil.

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-016-1 | La permission de notification est demandée **après un premier moment de valeur**, avec une raison, et jamais au chargement. | Proposition |
| RG-016-2 | Tout événement notifié est **aussi** affiché en bannière au retour dans l'app (repli universel). | Proposition |
| RG-016-3 | Fréquence maximale : 1 notification toutes les 10 min, sauf l'annonce de fin et l'attribution d'un jumeau. | Proposition |
| RG-016-4 | Plan B hors app : annonce par le DJ ou au micro. | **Abandonné** : on ne compte pas sur l'organisation ([DEC-046](../decisions.md#dec-046)) |
| RG-016-5 | Les notifications font partie des incitations à installer l'app ([DEC-040](../decisions.md#dec-040)). Sur Android, Web Push fonctionne aussi sans installation ; on ne le bride pas. | Proposition |

## Critères d'acceptation
- **CA-016-1 :** Étant donné un Android avec la permission accordée et l'écran verrouillé, quand l'heure H−30 arrive, alors la notification s'affiche.
- **CA-016-2 :** Étant donné un iPhone avec l'app installée et la permission accordée, alors même résultat.
- **CA-016-3 :** Étant donné un appareil sans permission, quand l'app revient au premier plan après H−30, alors une bannière l'annonce.
