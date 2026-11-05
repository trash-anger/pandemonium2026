# Vision

[← Index](../README.md)

## 1. Contexte

| Élément | Valeur | Statut | Source |
|---------|--------|--------|--------|
| Événement | **Pandémonium**, fête costumée à Montréal, généralement autour d'Halloween | Confirmé | S1 |
| Importance du costume | Les déguisements y sont très importants et la créativité est primordiale | Confirmé | S1 |
| Thème 2026 | **« Déjà vu »**. Ne jamais le perdre de vue | Confirmé | S1, S3 |
| Date | Samedi 7 novembre 2026. Florian a écrit « le samedi », ce qui donne cette date | Hypothèse | S1 |
| Heures | Ouverture 21 h ; jeu effectif à partir de minuit ; jumeaux complets à 2 h ; révélation 5 h ; fin 6 h | Confirmé | S5, S6 |
| Nombre de joueurs | 300 à 400 espérés, avec une marge ; environ 800 autocollants | Confirmé (estimation) | S5 |
| Auteur, organisateur du jeu | Florian, participant costumé. Il n'organise pas la fête | Hypothèse | S1 |

## 2. Problème à résoudre

Florian veut un costume qui **incarne le thème « Déjà vu »** et qui **fait interagir les fêtards entre eux**, plutôt qu'un costume qu'on se contente de regarder. Le costume doit être exceptionnel et créatif (S1).

## 3. Proposition de valeur

Le costume est une **collection de fausses étiquettes de vêtements à QR code**. Florian en porte et en **distribue** : les QR codes se retrouvent ainsi sur lui et sur d'autres personnes (S1, Confirmé).

Scanner une étiquette avec son téléphone ouvre un **jeu web**. Son but premier est de **collectionner les personnes scannées pendant la soirée** (S1, Confirmé).

Le thème « Déjà vu » traverse toutes les mécaniques :
- revoir quelqu'un est récompensé, pas traité comme une erreur ([FEAT-005](fonctionnalites/rescan-deja-vu.md)) ;
- on se découvre de faux souvenirs communs ([FEAT-006](fonctionnalites/faux-souvenirs.md)) ;
- quelqu'un porte une étiquette jumelle de la tienne ([FEAT-007](fonctionnalites/jumeaux.md)) ;
- la Matrice glitche, comme dans *Matrix* où un déjà vu signale un bug ([FEAT-008](fonctionnalites/chat-noir.md)).

## 4. Utilisateurs

| Rôle | Description | Besoins clés | Statut |
|------|-------------|--------------|--------|
| **Porteur** | Fêtard qui a reçu une étiquette et l'a réclamée en créant son personnage | Créer son personnage vite, sans clavier ; être trouvable ; collectionner | Confirmé (S1, S3) |
| **Scanneur** | Toute personne qui scanne une étiquette. Un porteur est aussi un scanneur | Comprendre le jeu en quelques secondes ; voir sa collection et se comparer | Confirmé (S1) |
| **Spectateur** | Personne qui scanne sans avoir d'étiquette | Voir les cartes ; être orientée vers le MJ pour obtenir une étiquette | Confirmé (S5, S6) |
| **Florian (maître du jeu)** | Créateur. Porte des étiquettes, les distribue, pilote la soirée | Préparer et imprimer les étiquettes ; configurer jumeaux, triplés et chats noirs ; suivre en direct ; déclencher des événements | Confirmé (S1, S3 : panneau admin) |
| **Organisateurs de Pandémonium** | Aucun rôle : pas d'écran ni d'annonce attendus | — | Confirmé (S5) |

Contexte d'usage, toujours vrai : téléphone personnel, **salle sombre et bruyante**, personnes **costumées** (masques, maquillage, gants), souvent **sous l'effet de l'alcool**, avec une attention fragmentée. L'humour doit rester **accessible à tous** (S3).

## 5. Objectifs

| ID | Objectif | Mesure | Statut |
|----|----------|--------|--------|
| OBJ-1 | Briser la glace : faire se parler des inconnus | Nombre de paires uniques de scans | Confirmé (S1) |
| OBJ-2 | Incarner le thème « Déjà vu » dans chaque mécanique | Revue qualitative de chaque FEAT | Confirmé (S1, S3) |
| OBJ-3 | Créer un sentiment d'aventure collective | Tout le monde voit la progression globale | Confirmé (S1 : « que le monde ait conscience de l'avancement global ») |
| OBJ-4 | Faire rire, avec un humour accessible et un NSFW soft toléré | Revue des textes | Confirmé (S3) |
| OBJ-5 | Créer des souvenirs partageables le lendemain | Partages sur les réseaux sociaux | Confirmé (S3) |
| OBJ-6 | Ne rien demander de lourd au joueur : pas de clavier, pas de compte | Création du personnage en moins de 30 s | Confirmé (S3, S5) |
| OBJ-7 | Porter une **critique punk et anticapitaliste** de la société de consommation et du temps passé sur les écrans | Temps d'écran révélé à chacun ; aucune donnée exploitée commercialement | Confirmé (S5, S6) |

## 6. Périmètre

### Inclus (Confirmé, S1/S3)
Étiquettes uniques et impression, scan, création de personnage au premier scan, collection, rescan « Déjà vu », faux souvenirs, jumeaux et triplés, chats noirs et glitch contagieux, quête collective avec révélation finale, comparaison et duel, factions, séries de cartes, missions éclair, réactions emoji, badges et classements (dont le temps passé dans l'app), notifications, mur de photos « Déjà vu ! », lendemain et partage, panneau d'administration.

L'index complet se trouve dans [fonctionnalites/README.md](fonctionnalites/README.md).

### Exclu ou différé
| Élément | Statut | Raison |
|---------|--------|--------|
| Création de compte (courriel, mot de passe) | Hypothèse | Contraire à l'objectif OBJ-6 |
| Génération de texte par IA | Confirmé (S1 : « gabarits combinés, sans IA ») | Les souvenirs sont produits par gabarits |
| Jumeaux partageant le même identifiant | Confirmé exclu (S1) | Voir [DEC-002](decisions.md#dec-002) et [DEC-021](decisions.md#dec-021) |
| Projection en salle, annonce au micro | Confirmé exclu (S5) | Pas d'écran ([DEC-046](decisions.md#dec-046)) |
| Mécaniques de Loup-garou (nuit, vote) | Confirmé exclu (S5) | Simple analogie ([DEC-050](decisions.md#dec-050)) |
| Messagerie libre entre joueurs | Proposition | Évite la modération ; réactions emoji seulement ([FEAT-014](fonctionnalites/reactions.md)) |
| Réutilisation pour d'autres événements | Hypothèse | Hors objectif ; dépôt public néanmoins |

## 7. Échéance

La fête a lieu samedi, soit **environ 4 jours après la rédaction de ces specs** (le 2026-11-03). Il faut donc **prioriser fortement**. Le [plan d'implémentation](plan-implementation.md) propose un socle jouable et des lots optionnels.
