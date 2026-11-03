# Parcours utilisateur

[← Index](../README.md)

Ce document décrit **l'enchaînement** des fonctionnalités. Les règles détaillées se trouvent dans les fiches `FEAT-xxx`.

## 1. Vue d'ensemble : la soirée d'un joueur

```mermaid
flowchart TD
    A[Florian donne une étiquette<br/>ou un joueur voit un QR] --> B{Scan<br/>FEAT-002}
    B -->|Appareil sans personnage<br/>+ étiquette vierge| C[Création du personnage<br/>FEAT-003]
    B -->|Appareil avec personnage<br/>+ étiquette vierge| D[Tué dans l'œuf<br/>FEAT-003]
    B -->|Étiquette réclamée<br/>jamais scannée par moi| E[Nouvelle carte<br/>FEAT-004]
    B -->|Étiquette réclamée<br/>déjà dans ma collection| F[Déjà vu ×N<br/>FEAT-005]
    B -->|Chat noir| G[Glitch<br/>FEAT-008]
    B -->|Ma propre étiquette| H[Ma fiche + indice jumeau<br/>FEAT-007]
    B -->|Appareil sans personnage<br/>+ étiquette réclamée| S[Spectateur ?<br/>Q-003]
    C --> I[Écran d'accueil du jeu]
    E --> J[Faux souvenir FEAT-006<br/>Comparaison FEAT-010<br/>Réaction FEAT-014]
    F --> J
    G --> J
    J --> K[Mise à jour : quête collective FEAT-009,<br/>badges et classements FEAT-015,<br/>missions FEAT-013]
    K --> I
    I -->|Notification, palier, mission| B
    I -->|Heure de fin| L[Révélation finale<br/>FEAT-009]
    L --> M[Lendemain et partage<br/>FEAT-018]
```

*Figure 1 : parcours principal. Statut : Proposition de synthèse, construite à partir des fonctionnalités confirmées.*

## 2. Parcours détaillés

### P-1 : Recevoir une étiquette et créer son personnage
1. Florian remet une étiquette à quelqu'un. Il peut l'attacher au costume avec le pistolet à étiquettes ([CT-003](contraintes-techniques.md#ct-003)). C'est une Hypothèse.
2. La personne scanne l'étiquette **tout de suite** : c'est le rituel de remise (Proposition, S2). Voir le risque décrit dans [FEAT-003](fonctionnalites/personnage.md).
3. L'app détecte une étiquette vierge et un appareil sans personnage, et lance la création du personnage sans clavier ([FEAT-003](fonctionnalites/personnage.md)).
4. Elle explique ensuite le jeu en un écran, propose d'installer l'app ([FEAT-021](fonctionnalites/pwa-hors-ligne.md)) puis d'activer le scanner intégré ([FEAT-002](fonctionnalites/scan.md)).

### P-2 : Collectionner quelqu'un
1. Le joueur A scanne l'étiquette du joueur B, depuis l'app ou depuis l'appareil photo.
2. La carte de B s'ajoute à la collection de A ([FEAT-004](fonctionnalites/collection.md)).
3. A voit le faux souvenir A×B ([FEAT-006](fonctionnalites/faux-souvenirs.md)) et la comparaison A vs B ([FEAT-010](fonctionnalites/duel.md)). Il peut laisser une réaction emoji ([FEAT-014](fonctionnalites/reactions.md)).
4. Si le scan est fait dans l'app, une photo basse qualité part sur le mur ([FEAT-017](fonctionnalites/mur-deja-vu.md)).
5. La quête collective, les badges et les missions sont mis à jour.

### P-3 : Retrouver son jumeau
Voir le diagramme de séquence dans [FEAT-007](fonctionnalites/jumeaux.md).

### P-4 : Être contaminé par un chat noir
Voir le diagramme d'états dans [FEAT-008](fonctionnalites/chat-noir.md).

### P-5 : Fin de soirée
1. À H−30 min, une notification et une bannière annoncent la fin ([FEAT-016](fonctionnalites/notifications.md)).
2. À l'heure de la révélation, tout le monde voit l'image collective et sa position dans le graphe ([FEAT-009](fonctionnalites/quete-collective.md)).
3. Les classements finaux sont figés ([FEAT-015](fonctionnalites/badges-classements.md)).

### P-6 : Le lendemain
Le joueur rouvre l'app. Il trouve un message du lendemain, sa carte souvenir et un bouton de partage ([FEAT-018](fonctionnalites/lendemain-partage.md)).

### P-7 : Maître du jeu
Avant la fête, Florian génère les étiquettes, configure les jumeaux, triplés, chats noirs et séries, puis imprime ([FEAT-001](fonctionnalites/etiquettes-impression.md)). Pendant la soirée, il suit tout et déclenche des événements ([FEAT-020](fonctionnalites/admin.md)).

## 3. Matrice d'interactions entre fonctionnalités

| Déclencheur ↓ / Effet → | Collection | Souvenirs | Quête coll. | Badges | Glitch | Factions | Mur |
|---|---|---|---|---|---|---|---|
| Nouveau scan | ajoute | crée | +1 | évalue | propage si porteur | points ([Q-014](questions-ouvertes.md#q-014)) | photo |
| Rescan | compteur | — | ? ([Q-016](questions-ouvertes.md#q-016)) | évalue | propage si porteur | ? | photo |
| Retrouvailles jumeaux | — | souvenir spécial | +bonus ? | badge | — | ? | — |
| Chat noir | ajoute | — | +1 | badge | infecte | ? | photo |
| Tué dans l'œuf | — | — | — | badge | — | ? | — |

Les « ? » sont regroupés dans [questions-ouvertes.md](questions-ouvertes.md).
