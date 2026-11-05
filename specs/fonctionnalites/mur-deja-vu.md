# FEAT-017 : Mur de photos « Déjà vu ! »

[← Fonctionnalités](README.md)

**Statut :** Confirmé · **Sources :** S3, S5, S7

## Objectif
Chaque scan fait avec le scanner intégré envoie **une photo en basse qualité**. L'ensemble forme une mosaïque appelée **« Déjà vu ! »** (S3).

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-017-1 | Seuls les scans faits **dans l'app** produisent une photo. | Confirmé (S3) |
| RG-017-2 | Les photos sont envoyées en **basse qualité**. Résolution cible : [REQ-008](../exigences-transversales.md#req-008). | Confirmé (principe) |
| RG-017-3 | La mosaïque s'intitule « Déjà vu ! ». | Confirmé (S3) |
| RG-017-4 | **C'est le scanneur qui consent**, à l'activation de la caméra ; à la création de son personnage, il autorise aussi (ou non) l'usage de ses photos à la révélation. | Confirmé (S5, S7, [DEC-061](../decisions.md#dec-061)) |
| RG-017-4b | Le scanner intégré demande de **cadrer l'étiquette sans que la personne scannée soit reconnaissable**. | Confirmé (S7) |
| RG-017-5 | Le mur est visible **seulement dans l'app**, pas de projection. Les photos consenties apparaissent aussi à la révélation ([RG-009-9](quete-collective.md)). | Confirmé (S5) |
| RG-017-6 | Le MJ peut masquer une photo ; une personne qui se reconnaît peut demander qu'on la retire. | Proposition |
| RG-017-7 | Effet visuel **déformant** « déjà vu » appliqué aux photos (duplication, décalage RGB), qui réduit aussi l'identifiabilité. | Confirmé (S5) |
| RG-017-8 | Les photos sont supprimées 7 jours après la fête, comme le reste des données. | Confirmé (S5, S7, [DEC-035](../decisions.md#dec-035)) |
| RG-017-9 | Le volume de stockage reste dans le free tier de R2, ou son coût est estimé avant la fête. | Confirmé (S5) |

## Critères d'acceptation
- **CA-017-1 :** Étant donné un scan dans l'app avec le consentement donné, alors une image d'au plus X Ko est envoyée et apparaît sur le mur.
- **CA-017-2 :** Étant donné le consentement refusé, alors aucune image ne quitte l'appareil et le scan fonctionne normalement.
