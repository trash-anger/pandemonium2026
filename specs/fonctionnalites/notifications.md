# FEAT-016 : Notifications

[← Fonctionnalités](README.md)

**Statut :** Confirmé (besoin) ; faisabilité selon la plateforme · **Sources :** S1, S2

## Objectif
Prévenir les joueurs d'événements globaux même quand ils ne regardent pas l'app. Le cas premier est **l'annonce de la fin, 30 minutes avant, à tout le monde** (S1).

## Événements candidats
| Événement | Statut |
|-----------|--------|
| Fin dans 30 min | Confirmé (S1) |
| Palier collectif atteint ([FEAT-009](quete-collective.md)) | Proposition |
| Mission éclair ([FEAT-013](missions-eclair.md)) | Hypothèse |
| Nouvel indice de jumeau ([FEAT-007](jumeaux.md)) | Proposition |
| Message du MJ ([FEAT-020](admin.md)) | Proposition |
| Défi en duel ([FEAT-010](duel.md)) | Proposition |
| Message du lendemain ([FEAT-018](lendemain-partage.md)) | Proposition |

## Contraintes de plateforme
Elles sont détaillées dans [CT-008](../contraintes-techniques.md#ct-008). En résumé : un minuteur JavaScript ne s'exécute pas sur un téléphone verrouillé, il faut du **Web Push** côté serveur. Sur **iOS**, Web Push ne fonctionne **que si l'app est installée** sur l'écran d'accueil.

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-016-1 | La permission de notification est demandée **après un premier moment de valeur**, avec une raison, et jamais au chargement. | Proposition |
| RG-016-2 | Tout événement notifié est **aussi** affiché en bannière au retour dans l'app (repli universel). | Proposition |
| RG-016-3 | Fréquence maximale : 1 notification toutes les 15 min, sauf l'annonce de fin. | Proposition |
| RG-016-4 | Plan B hors app : annonce par le DJ ou au micro. | Proposition ; [Q-030](../questions-ouvertes.md#q-030) |

## Critères d'acceptation
- **CA-016-1 :** Étant donné un Android avec la permission accordée et l'écran verrouillé, quand l'heure H−30 arrive, alors la notification s'affiche.
- **CA-016-2 :** Étant donné un iPhone avec l'app installée et la permission accordée, alors même résultat.
- **CA-016-3 :** Étant donné un appareil sans permission, quand l'app revient au premier plan après H−30, alors une bannière l'annonce.
