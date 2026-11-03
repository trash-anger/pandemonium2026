# Pandémonium 2026 — « Déjà vu ! »

Jeu de collection grandeur nature joué avec des **étiquettes de vêtements à QR code** pendant **Pandémonium**, une fête costumée montréalaise organisée autour d'Halloween. Le thème 2026 est **« Déjà vu »**.

Le costume de Florian est fait de fausses étiquettes de vêtements. Il les porte et en distribue aux autres fêtards. Scanner une étiquette ouvre une application web : on y crée son personnage, puis on « collectionne » les personnes croisées dans la soirée. S'y ajoutent des jumeaux à retrouver, des souvenirs absurdes, des glitchs contagieux et une quête collective.

> **Statut du dépôt : phase de spécification (spec-driven development).**
> Il ne contient pas encore de code. Les spécifications décrivent le comportement attendu. Les choix d'implémentation y figurent seulement à titre de propositions, clairement séparées des besoins validés.

## Ordre de lecture

| # | Document | Rôle |
|---|----------|------|
| 1 | [Vision](specs/vision.md) | Problème, utilisateurs, objectifs, périmètre |
| 2 | [Glossaire](specs/glossaire.md) | Vocabulaire du jeu (personnage, étiquette, déjà vu…) |
| 3 | [Univers et ton](specs/univers-et-ton.md) | Thème, humour, références (mode, D&D, Matrix) |
| 4 | [Parcours](specs/parcours.md) | Parcours utilisateur et interactions entre fonctionnalités |
| 5 | [Fonctionnalités](specs/fonctionnalites/README.md) | Une spécification par fonctionnalité (`FEAT-xxx`) |
| 6 | [Données](specs/donnees.md) | Entités, relations, validations, cycle de vie |
| 7 | [Interface](specs/interface.md) | Écrans, navigation, comportements, références visuelles |
| 8 | [Exigences transversales](specs/exigences-transversales.md) | Accessibilité, sécurité, confidentialité, performance (`REQ-xxx`) |
| 9 | [Contraintes techniques](specs/contraintes-techniques.md) | Matériel, hébergement, intégrations connues |
| 10 | [Décisions](specs/decisions.md) | Journal des décisions (`DEC-xxx`) |
| 11 | [Questions ouvertes](specs/questions-ouvertes.md) | Arbitrages nécessaires (`Q-xxx`) |
| 12 | [Plan d'implémentation](specs/plan-implementation.md) | Lots progressifs et traçabilité |

## Conventions

### Statuts

Chaque élément porte un statut explicite :

| Statut | Signification |
|--------|---------------|
| **Confirmé** | Demandé ou validé explicitement par Florian |
| **Hypothèse** | Interprétation de ses propos, à confirmer |
| **Proposition** | Recommandation de l'assistant de spécification, non validée |
| **À préciser** | Information manquante ou contradictoire. Renvoie vers une question `Q-xxx` |

Une proposition ne devient une exigence qu'après validation, consignée dans [decisions.md](specs/decisions.md).

### Identifiants

| Préfixe | Objet | Défini dans |
|---------|-------|-------------|
| `FEAT-xxx` | Fonctionnalité | `specs/fonctionnalites/` |
| `RG-xxx-n` | Règle métier de la fonctionnalité `xxx` | fichier de la fonctionnalité |
| `CA-xxx-n` | Critère d'acceptation de la fonctionnalité `xxx` | fichier de la fonctionnalité |
| `REQ-xxx` | Exigence transversale | [exigences-transversales.md](specs/exigences-transversales.md) |
| `CT-xxx` | Contrainte technique | [contraintes-techniques.md](specs/contraintes-techniques.md) |
| `DEC-xxx` | Décision | [decisions.md](specs/decisions.md) |
| `Q-xxx` | Question ouverte | [questions-ouvertes.md](specs/questions-ouvertes.md) |
| `LOT-x` | Lot d'implémentation | [plan-implementation.md](specs/plan-implementation.md) |

Les identifiants sont **stables** : une exigence abandonnée passe au statut « Abandonné » et son numéro n'est jamais réutilisé. Chaque règle n'est définie qu'à un seul endroit. Les autres documents y renvoient par lien.

### Sources

| Code | Source |
|------|--------|
| **S1** | Premier message de Florian : description du projet, achats, six idées commentées, notifications, leaderboard |
| **S2** | Réponse de l'assistant : banque d'idées. Tout ce qui en vient reste une proposition tant que S3 ne le valide pas |
| **S3** | Second message de Florian : retours détaillés sur S2 et nouvelles idées (factions, D&D, mode, photos…) |
| **S4** | Fiches produits Amazon.ca des achats, consultées le 2026-11-03 |

## Résumé en une phrase

*Tu scannes quelqu'un, tu l'ajoutes à ta collection, l'app t'invente un souvenir commun absurde. Plus tu revois les mêmes personnes, plus la Matrice glitche.*

## Licence

[Apache 2.0](LICENSE).
