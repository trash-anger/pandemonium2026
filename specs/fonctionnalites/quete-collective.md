# FEAT-009 : Quête collective, paliers et révélation finale

[← Fonctionnalités](README.md)

**Statut :** Confirmé · **Sources :** S1, S3 (« c'est génial !!! »)

## Objectif
Chaque scan fait avancer une **quête commune**. Tout le monde **a conscience de l'avancement global** (S1). Des **paliers** débloquent des événements pour tous, et une **révélation finale** à heure fixe montre l'image collective de la soirée.

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-009-1 | La progression globale est **visible par tous, en temps réel** ou presque. | Confirmé (S1) |
| RG-009-2 | Unité de progression : nombre de **paires uniques** (connexions) de la soirée. | Proposition ; rescans : [Q-016](../questions-ouvertes.md#q-016) |
| RG-009-3 | Des **paliers collectifs** débloquent des événements pour tous. Exemples proposés : 100 → indices jumeaux accélérés, 250 → chats noirs actifs, 500 → nouvelle mécanique. | Confirmé (principe, S2 → S3) ; seuils et effets : [Q-021](../questions-ouvertes.md#q-021), car ils dépendent de [Q-002](../questions-ouvertes.md#q-002) |
| RG-009-4 | À une **heure fixe**, la révélation apparaît chez **tout le monde**. L'heure « 3 h ? » est évoquée en S1. | Confirmé (principe) ; heure : [Q-001](../questions-ouvertes.md#q-001) |
| RG-009-5 | L'image révélée est la **constellation de toutes les connexions** de la soirée, avec le nœud du joueur en surbrillance. | Confirmé (S2 → S3 « génial ») |
| RG-009-6 | Variante S1 : chaque scan révèle un fragment d'une image ou d'une phrase. Elle est compatible avec RG-009-5, par exemple une constellation qui dessine une forme. | À préciser ([Q-021](../questions-ouvertes.md#q-021)) |
| RG-009-7 | Affichage en direct sur un **écran ou projecteur** de la salle, si les organisateurs l'acceptent. | Proposition ; [Q-030](../questions-ouvertes.md#q-030) |
| RG-009-8 | Les degrés de séparation et les « clans » visibles dans le graphe ([FEAT-010](duel.md)) peuvent colorer la constellation par faction. | Proposition |

## Interface
- Barre de progression globale toujours visible, en en-tête de l'app.
- Toast « Palier atteint ! » chez tout le monde, avec sa description.
- Révélation : plein écran, animation de construction de la constellation, puis zoom sur son propre nœud ; ensuite, vue explorable.

## Critères d'acceptation
- **CA-009-1 :** Étant donné deux appareils ouverts, quand un scan crée une nouvelle paire, alors la barre se met à jour sur les deux appareils en moins de N secondes (N : [REQ-007](../exigences-transversales.md#req-007)).
- **CA-009-2 :** Étant donné qu'un palier est franchi, alors son effet est actif pour tous les joueurs et annoncé une seule fois à chacun.
- **CA-009-3 :** Étant donné l'heure de révélation, alors tout appareil ouvert affiche la révélation, et tout appareil qui rouvre l'app ensuite l'affiche à l'ouverture.
