# FEAT-014 : Réactions emoji (livre d'or)

[← Fonctionnalités](README.md)

**Statut :** Confirmé · **Sources :** S2, S3

## Objectif
Laisser une trace sur la carte de quelqu'un, **rapidement, avec des emoji**, à la manière des réactions Facebook. Les emoji sont **d'Halloween** (S3).

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-014-1 | Les réactions sont choisies dans une **liste fermée d'emoji d'Halloween** ; il n'y a pas de texte libre. | Confirmé (S3) pour l'emoji ; l'exclusion du texte libre est une Hypothèse cohérente avec « rapide » |
| RG-014-2 | Elles se posent en **un toucher** depuis l'écran de résultat du scan. | Confirmé (« rapide », S3) |
| RG-014-3 | Liste proposée : 🎃 👻 💀 🦇 🕷️ 🧛 🔮 🖤 (8 au maximum). | Proposition |
| RG-014-4 | Une réaction par emoji et par scanneur sur une carte donnée ; elle peut être retirée. | Proposition |
| RG-014-5 | Le porteur voit le total des réactions reçues par emoji, ainsi que leurs auteurs. | Proposition ; visibilité des auteurs : [Q-022](../questions-ouvertes.md#q-022) |

## Critères d'acceptation
- **CA-014-1 :** Étant donné l'écran de résultat, quand le joueur touche un emoji, alors la réaction est enregistrée sans autre confirmation.
- **CA-014-2 :** Aucune saisie de texte n'est possible dans les réactions.
