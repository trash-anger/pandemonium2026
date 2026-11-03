# FEAT-020 : Panneau du maître du jeu

[← Fonctionnalités](README.md)

**Statut :** Confirmé (« intelligent d'avoir un panneau d'admin », S3) ; contenu : Hypothèse et Proposition · **Sources :** S2, S3

## Objectif
Permettre à Florian de **préparer** la soirée et de la **piloter en direct** depuis son téléphone.

## Fonctions
| ID | Fonction | Phase | Statut |
|----|----------|-------|--------|
| ADM-1 | Générer N étiquettes et exporter pour l'impression ([FEAT-001](etiquettes-impression.md)) | Avant | Hypothèse (nécessaire à FEAT-001) |
| ADM-2 | Configurer jumeaux, triplés, chats noirs, séries et factions | Avant | Confirmé pour les jumeaux « as code » (S1) ; reste : Hypothèse |
| ADM-3 | Régler les heures : début, H−30, révélation, fin | Avant | Hypothèse |
| ADM-4 | Tableau de bord en direct : joueurs, scans, paires, % corrompus, paliers | Pendant | Proposition (S2) |
| ADM-5 | Déclencher un **glitch global** | Pendant | Proposition (S2) |
| ADM-6 | Diffuser un message à tous (bannière et push) | Pendant | Proposition (S2) |
| ADM-7 | Régler la contagion ([RG-008-7](chat-noir.md)) | Pendant | Proposition |
| ADM-8 | Lancer une mission éclair ([FEAT-013](missions-eclair.md)) | Pendant | Proposition |
| ADM-9 | Masquer une photo du mur ou un pseudo inapproprié | Pendant | Proposition ([REQ-013](../exigences-transversales.md#req-013)) |
| ADM-10 | Réinitialiser une étiquette, par exemple après un mauvais « Tué dans l'œuf » | Pendant | Proposition |
| ADM-11 | Afficher la vue projecteur (constellation en direct) | Pendant | Proposition ([Q-030](../questions-ouvertes.md#q-030)) |

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-020-1 | L'accès au panneau est **authentifié** et réservé au MJ ([REQ-011](../exigences-transversales.md#req-011)). | Proposition, requise |
| RG-020-2 | Toute action du MJ est journalisée. | Proposition |
| RG-020-3 | Le panneau est utilisable sur téléphone, d'une seule main. | Hypothèse (Florian est costumé, sur place) |

## Critères d'acceptation
- **CA-020-1 :** Une requête au panneau sans authentification est refusée.
- **CA-020-2 :** Étant donné un glitch global déclenché, alors tous les appareils ouverts le voient dans les N secondes ([REQ-007](../exigences-transversales.md#req-007)).
