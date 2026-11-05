# FEAT-018 : Le lendemain et le partage

[← Fonctionnalités](README.md)

**Statut :** Confirmé · **Sources :** S2, S3

## Objectif
Prolonger l'expérience : **le lendemain matin**, le site change de ton (« Déjà vu. Tu étais là hier soir. »), et les participants peuvent **partager leurs succès sur les réseaux sociaux** (S3).

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-018-1 | Après l'heure de fin, l'app passe en mode « lendemain » : lecture seule, sans nouveaux scans. | Confirmé (idée, S3) ; lecture seule : Proposition |
| RG-018-2 | Le joueur obtient une **carte souvenir** : collection, badges, faux souvenir préféré, position dans la constellation, **temps d'écran de la soirée**. | Proposition ; temps d'écran : Confirmé (S6) |
| RG-018-3 | Un bouton de partage utilise la feuille de partage native (Web Share API) quand elle existe, et propose sinon le téléchargement d'une image. | Proposition ([CT-011](../contraintes-techniques.md#ct-011)) |
| RG-018-4 | Le visuel partagé ne contient que des pseudos, jamais de photo du mur sans consentement. | Proposition ([REQ-010](../exigences-transversales.md#req-010)) |
| RG-018-5 | Le site reste disponible 7 jours après la fête, puis les données sont supprimées ou anonymisées. | Confirmé (S5, [DEC-035](../decisions.md#dec-035)) |

## Critères d'acceptation
- **CA-018-1 :** Étant donné l'heure de fin passée, quand un joueur scanne une étiquette, alors il voit le message du lendemain et non un nouveau scan.
- **CA-018-2 :** Le partage produit une image lisible au format carré et vertical.
