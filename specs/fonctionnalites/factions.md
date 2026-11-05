# FEAT-011 : Factions

[← Fonctionnalités](README.md)

**Statut :** Confirmé · **Sources :** S3, S5, S7

## Objectif
Créer des **factions** pour faire jouer les joueurs **les uns contre les autres** (S3), en complément de la quête collective coopérative. Elles s'inspirent de **Donjons & Dragons**, avec une pointe **sarcastique et critique** sur la consommation, les soldes, les vêtements et le Black Friday (S7).

## Les cinq factions (Confirmé, S7, [DEC-060](../decisions.md#dec-060))
| Faction | Alignement | Esprit |
|---------|-----------|--------|
| 🛡️ **L'Ordre du Ticket de Caisse** | Loyal Bon | Paladins du retour avec reçu et de la garantie prolongée |
| 🔥 **Les Soldés Chaotiques** | Chaotique Neutre | Barbares de l'achat compulsif, tout à −70 % |
| 🌿 **Le Cercle de la Friperie** | Neutre Bon | Druides de la seconde main : tout a déjà été porté |
| 📸 **La Guilde des Influenceurs** | Neutre Mauvais | Bardes du placement de produit et du code promo |
| 💀 **Les Nécromanciens du Black Friday** | Loyal Mauvais | Ils ressuscitent les invendus et les files d'attente |

Chaque faction a une couleur d'interface. Ces couleurs ne sont pas celles des costumes ([DEC-059](../decisions.md#dec-059)).

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-011-1 | La faction est **choisie par le joueur pour chaque étiquette**, à sa réclamation. | Confirmé (S5) |
| RG-011-2 | Une faction qui dépasse les autres d'un certain pourcentage est **temporairement masquée** du choix. Seuil proposé : 15 % au-dessus de la moyenne. | Confirmé (S5) ; seuil : Proposition |
| RG-011-3 | Un personnage peut appartenir à **3 factions au maximum**. Au-delà de 3 étiquettes, les nouvelles reprennent une faction existante, avec les malus de surconsommation ([RG-003-10](personnage.md)). | Confirmé (S7) |
| RG-011-4 | Un joueur multi-factions **rapporte des points à chacune** de ses factions. | Confirmé (S7) |
| RG-011-5 | Il contribue **un peu plus** à l'œuvre collective : +25 % par faction supplémentaire (×1 ; ×1,25 ; ×1,5). | Confirmé (S7, [DEC-065](../decisions.md#dec-065)) |
| RG-011-6 | **Punition** : à la fin, il est rattaché à la faction où il a marqué **le moins** de points. Ses points restent acquis à chaque faction ; seul son personnage apparaît dans cette faction au classement final et à la révélation. | Confirmé (S7) |
| RG-011-7 | Il existe un **classement par faction**, et des **badges par faction** en fin de partie (par exemple « Célébrité de la Friperie »), en plus des badges globaux toutes factions confondues. | Confirmé (S7) |
| RG-011-8 | Score de faction : chaque scan d'un joueur rapporte des points à ses factions ; un scan entre deux factions différentes rapporte un bonus. | Proposition |

## Critères d'acceptation
- **CA-011-1 :** Toute étiquette réclamée appartient à une faction et une seule, visible sur la carte quand on la scanne.
- **CA-011-2 :** Étant donné une faction qui dépasse le seuil d'écart, alors elle n'est pas proposée au joueur suivant, et redevient disponible quand l'écart se résorbe.
- **CA-011-3 :** Étant donné un joueur dans 2 factions, quand il fait un scan, alors les deux factions gagnent des points et sa contribution à la quête vaut ×1,25.
- **CA-011-4 :** À la fin, un joueur multi-factions apparaît dans une seule faction, celle où il a marqué le moins, sans que les points des autres factions changent.
