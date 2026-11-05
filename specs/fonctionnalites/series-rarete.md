# FEAT-012 : Séries de cartes et rareté

[← Fonctionnalités](README.md)

**Statut :** Confirmé · **Sources :** S2, S3 (« excellente idée »), S5

## Objectif
Ajouter une couche de collection façon cartes à échanger : des **séries** à compléter et des niveaux de **rareté**.

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-012-1 | Chaque étiquette appartient au plus à une **série**. | Hypothèse |
| RG-012-2 | Compléter une série (avoir scanné tous ses membres) donne un **bonus** : badge, souvenirs ou points de faction. | Confirmé (principe) ; nature du bonus : Proposition (badge + souvenirs) |
| RG-012-3 | Niveaux de rareté : commune, rare, légendaire. Les légendaires sont les cartes du MJ ([FEAT-022](costume-mj.md)). | Proposition |
| RG-012-4 | Les séries sont **invisibles jusqu'au scan** : rien n'est imprimé, la série se découvre dans l'app. | Confirmé (S5, [DEC-043](../decisions.md#dec-043)) |
| RG-012-5 | Il faut trouver **un moyen efficace d'imprimer** toutes les étiquettes de séries. | Sans objet : séries invisibles (S5) |

## Contrainte d'impression (historique)
Option retenue : séries cachées ([DEC-043](../decisions.md#dec-043)). Les autres options sont gardées pour mémoire.
L'imprimante est **monochrome** et les autocollants sont **blancs** (S4, [CT-001](../contraintes-techniques.md#ct-001)). Les séries ne peuvent donc pas reposer sur la couleur d'impression. Options (Proposition) :
- un **symbole imprimé** (pictogramme de série) sur le gabarit, différent par lot d'impression ;
- une **inscription de « collection »** (« Collection Automne-Hiver 1997 », « Collection Croisière ») ;
- un **feutre** de couleur sur l'étiquette manille, au moment de l'assemblage ;
- des séries **cachées** (non visibles), découvertes seulement dans l'app.

## Critères d'acceptation
- **CA-012-1 :** Étant donné une série de K étiquettes, quand le joueur scanne la K-ième, alors le bonus est attribué une seule fois.
- **CA-012-2 :** La collection affiche la progression par série (« 3/5 »).
