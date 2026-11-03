# FEAT-017 : Mur de photos « Déjà vu ! »

[← Fonctionnalités](README.md)

**Statut :** Confirmé (idée) ; consentement et visibilité À préciser · **Sources :** S3

## Objectif
Chaque scan fait avec le scanner intégré envoie **une photo en basse qualité**. L'ensemble forme une mosaïque appelée **« Déjà vu ! »** (S3).

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-017-1 | Seuls les scans faits **dans l'app** produisent une photo. | Confirmé (S3) |
| RG-017-2 | Les photos sont envoyées en **basse qualité**. Résolution cible : [REQ-008](../exigences-transversales.md#req-008). | Confirmé (principe) |
| RG-017-3 | La mosaïque s'intitule « Déjà vu ! ». | Confirmé (S3) |
| RG-017-4 | Les photos peuvent montrer des visages et des corps. Il faut donc un **consentement** explicite et visible. | Proposition, requise ([REQ-010](../exigences-transversales.md#req-010)) ; [Q-023](../questions-ouvertes.md#q-023) |
| RG-017-5 | Visibilité : publique dans l'app, réservée au MJ, ou projetée ? | À préciser ([Q-023](../questions-ouvertes.md#q-023)) |
| RG-017-6 | Le MJ peut masquer une photo ; une personne qui se reconnaît peut demander qu'on la retire. | Proposition |
| RG-017-7 | Effet visuel « déjà vu » appliqué aux photos (duplication, décalage RGB), qui réduit aussi l'identifiabilité. | Proposition |
| RG-017-8 | Durée de conservation des photos. | À préciser ([Q-024](../questions-ouvertes.md#q-024)) |

## Critères d'acceptation
- **CA-017-1 :** Étant donné un scan dans l'app avec le consentement donné, alors une image d'au plus X Ko est envoyée et apparaît sur le mur.
- **CA-017-2 :** Étant donné le consentement refusé, alors aucune image ne quitte l'appareil et le scan fonctionne normalement.
