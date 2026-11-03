# FEAT-012 : Séries de cartes et rareté

[← Fonctionnalités](README.md)

**Statut :** Confirmé · **Sources :** S2, S3 (« excellente idée »)

## Objectif
Ajouter une couche de collection façon cartes à échanger : des **séries** à compléter et des niveaux de **rareté**.

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-012-1 | Chaque étiquette appartient au plus à une **série**. | Hypothèse |
| RG-012-2 | Compléter une série (avoir scanné tous ses membres) donne un **bonus** : badge, souvenirs ou points de faction. | Confirmé (principe) ; nature du bonus : [Q-019](../questions-ouvertes.md#q-019) |
| RG-012-3 | Niveaux de rareté : commune, rare, légendaire. Les chats noirs sont légendaires. | Proposition (S2) |
| RG-012-4 | La série doit être **reconnaissable** à l'œil nu, sinon les joueurs ne peuvent pas la chercher. | Hypothèse ([Q-019](../questions-ouvertes.md#q-019)) |
| RG-012-5 | Il faut trouver **un moyen efficace d'imprimer** toutes les étiquettes de séries. | Confirmé (contrainte, S3) |

## Contrainte d'impression
L'imprimante est **monochrome** et les autocollants sont **blancs** (S4, [CT-001](../contraintes-techniques.md#ct-001)). Les séries ne peuvent donc pas reposer sur la couleur d'impression. Options (Proposition) :
- un **symbole imprimé** (pictogramme de série) sur le gabarit, différent par lot d'impression ;
- une **inscription de « collection »** (« Collection Automne-Hiver 1997 », « Collection Croisière ») ;
- un **feutre** de couleur sur l'étiquette manille, au moment de l'assemblage ;
- des séries **cachées** (non visibles), découvertes seulement dans l'app.

## Critères d'acceptation
- **CA-012-1 :** Étant donné une série de K étiquettes, quand le joueur scanne la K-ième, alors le bonus est attribué une seule fois.
- **CA-012-2 :** La collection affiche la progression par série (« 3/5 »).
