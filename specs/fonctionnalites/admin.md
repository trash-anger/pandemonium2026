# FEAT-020 : Panneau du maître du jeu

[← Fonctionnalités](README.md)

**Statut :** Confirmé (« intelligent d'avoir un panneau d'admin », S3) ; contenu : Hypothèse et Proposition · **Sources :** S2, S3, S5, S6, S7

## Objectif
Permettre à Florian de **préparer** la soirée et de la **piloter en direct**. Le panneau existe en **interface mobile** (pendant la soirée, costumé) et en **interface web** pour ordinateur (Confirmé, S7, [DEC-069](../decisions.md#dec-069)).

## Fonctions
| ID | Fonction | Phase | Statut |
|----|----------|-------|--------|
| ADM-1 | Générer N étiquettes et exporter pour l'impression ([FEAT-001](etiquettes-impression.md)) | Avant | Hypothèse (nécessaire à FEAT-001) |
| ADM-2 | Régler les paramètres des rôles dynamiques (cible de jumeaux, seuil de départ, ratio de chats noirs), des séries, des factions, des légendaires et des pièges. Secrets saisis dans l'admin ou un fichier hors git | Avant | Confirmé (S5, [DEC-045](../decisions.md#dec-045)) |
| ADM-3 | Régler les heures (21 h, minuit, 2 h, révélation 5 h, fin 6 h), modifiables en direct ; bouton « déclencher la révélation » | Avant et pendant | Confirmé (S5, [DEC-018](../decisions.md#dec-018)) |
| ADM-4 | Tableau de bord en direct : joueurs, scans, paires, % corrompus, paliers | Pendant | Proposition (S2) |
| ADM-14 | **Frise d'activité** de 21 h à 6 h : scans par tranche de 5 min, nouveaux joueurs, % de corrompus, avec repères (minuit, 2 h, mélanges des légendaires, 5 h) | Pendant et après | Confirmé (S7) ; indicateurs : Proposition |
| ADM-5 | Déclencher un **glitch global** | Pendant | Proposition (S2) |
| ADM-6 | Diffuser un message à tous (bannière et push) | Pendant | Proposition (S2) |
| ADM-7 | Régler la contagion ([RG-008-7](chat-noir.md)) | Pendant | Proposition |
| ADM-8 | Lancer une mission éclair ([FEAT-013](missions-eclair.md)) | Pendant | Proposition |
| ADM-9 | Masquer une photo du mur ou un pseudo inapproprié | Pendant | Proposition ([REQ-013](../exigences-transversales.md#req-013)) |
| ADM-10 | Réinitialiser une étiquette, par exemple après un mauvais « Tué dans l'œuf » | Pendant | Proposition |
| ADM-11 | Afficher la vue projecteur (constellation en direct) | Pendant | **Abandonné** : pas d'écran ([DEC-046](../decisions.md#dec-046)) |
| ADM-12 | Mettre en rayon une étiquette de la réserve | Pendant | **Abandonné** : une étiquette est jouable dès qu'on la scanne ([DEC-063](../decisions.md#dec-063)) |
| ADM-13 | Réinitialiser le PIN d'un personnage ; détacher une étiquette d'un personnage | Pendant | Proposition |

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-020-1 | L'accès au panneau est **authentifié par Google OAuth** et réservé au MJ, sur un chemin protégé de `p.uyt.re` ([REQ-011](../exigences-transversales.md#req-011)). | Confirmé (S5, [DEC-047](../decisions.md#dec-047)) |
| RG-020-2 | Toute action du MJ est journalisée. | Proposition |
| RG-020-3 | Le panneau est utilisable sur téléphone, d'une seule main, et sur ordinateur. | Confirmé (S7) |

## Critères d'acceptation
- **CA-020-1 :** Une requête au panneau sans authentification est refusée.
- **CA-020-2 :** Étant donné un glitch global déclenché, alors tous les appareils ouverts le voient dans les N secondes ([REQ-007](../exigences-transversales.md#req-007)).
