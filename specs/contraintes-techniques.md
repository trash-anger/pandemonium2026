# Contraintes techniques et intégrations

[← Index](../README.md)

Ce document liste ce qui est **connu et imposé**. Les options d'architecture sont listées en §4 : ce sont des **propositions**, rien n'y est décidé.

## 1. Matériel (S4, fiches Amazon.ca consultées le 2026-11-03)

### CT-001
**Imprimante NIIMBOT B1** : thermique (sans encre), **monochrome**, Bluetooth, largeur d'impression de **20 à 48 mm**, batterie de 1500 mAh, reconnaissance RFID des consommables. Elle est livrée avec un rouleau échantillon de 50×30 mm. *Statut : Confirmé (achat).* La fiche propose une variante **B1** et une variante **B1 Pro** ; celle achetée et sa résolution (dpi) restent à vérifier ([Q-026](questions-ouvertes.md#q-026)).

### CT-002
**Autocollants NIIMBOT 40×30 mm, blancs, 230 par rouleau**, vendus par lot de 3 rouleaux, compatibles B1, B21 et B3S. Si le lot complet a été reçu, cela fait environ **690 étiquettes**, plus le rouleau échantillon de 50×30. *Statut : Confirmé (achat) ; le fini mat ou brillant reste à vérifier* : la règle [RG-001-6](fonctionnalites/etiquettes-impression.md) exige du mat.

### CT-003
**Étiquettes manille SatsoniK, 1,85 × 1,25 po (environ 47 × 32 mm), lot de 1000, sans attache, « pré-imprimées »** (le titre de la fiche mentionne « Green Manila »). **Pistolet à étiquettes Mr. Pen**, avec 5 aiguilles et 2000 attaches. *Statut : Confirmé (achat).* **Hypothèse** sur l'usage : l'autocollant QR de 40×30 est collé sur l'étiquette manille de 47×32, puis attaché aux vêtements avec le pistolet, comme une étiquette de prix. Le contenu pré-imprimé est à vérifier ([Q-027](questions-ouvertes.md#q-027)).

### CT-004
**Application NIIMBOT pour macOS**, déjà téléchargée par Florian (S1). Sa capacité à importer des données en lot (CSV ou Excel) pour générer N QR différents est **à vérifier** ([Q-007](questions-ouvertes.md#q-007)). Sinon, il faudra imprimer des images générées une par une. La fiche indique : « fonctions complètes avec abonnement premium ».

### CT-007
**Format du QR.** Les règles se trouvent dans [FEAT-001](fonctionnalites/etiquettes-impression.md) (RG-001-2 à RG-001-7). Note technique (Proposition) : `HTTPS://P.UYT.RE/7KC3` en **majuscules** permet le mode alphanumérique du QR. Le domaine n'est pas sensible à la casse et le code est déjà en majuscules. On obtient ainsi un QR de version 2 (25×25 modules), soit des modules d'environ 0,8 mm à 25 mm de large. Cette taille est compatible avec une imprimante thermique d'environ 200 dpi, sous réserve de [Q-026](questions-ouvertes.md#q-026).

## 2. Hébergement et domaine

### CT-005
Florian a un **compte Cloudflare** (S1). *Statut : Confirmé.* Les services Cloudflare précis à utiliser **ne sont pas décidés** ([Q-032](questions-ouvertes.md#q-032)).

### CT-006
Le **domaine** sera un sous-domaine de **`uyt.re`** (S1). Florian a donné l'exemple `p.uyt.re` (S3). *Statut : Confirmé pour `uyt.re` ; sous-domaine final : [Q-031](questions-ouvertes.md#q-031).*

### CT-009
**CDN et cache sur le téléphone** pour un maximum de ressources (S3). *Statut : Confirmé.* Voir [FEAT-021](fonctionnalites/pwa-hors-ligne.md).

## 3. Plateformes web

### CT-008
**Notifications.** *Statut : contrainte de plateforme. Comportement à valider sur de vrais appareils avant la fête.*
| Situation | Possible ? |
|-----------|-----------|
| Ordinateur, onglet ouvert, navigateur en arrière-plan | Oui, avec l'API Notification et la permission accordée |
| Téléphone, page ouverte au premier plan | Oui (bannière dans l'app) |
| Téléphone verrouillé ou app en arrière-plan, minuteur JavaScript | **Non** : le JavaScript est suspendu |
| Android + Chrome, Web Push (service worker et VAPID) | Oui, même onglet fermé, si la permission est accordée |
| iOS + Safari dans un onglet | **Non** |
| iOS, app **ajoutée à l'écran d'accueil** (iOS 16.4 et plus) + Web Push | Oui, si la permission est accordée |

### CT-010
**Scanner intégré et lampe.** L'API native `BarcodeDetector` n'est pas disponible partout (notamment Safari iOS, à vérifier) : prévoir une bibliothèque de décodage JavaScript. Le contrôle de la lampe (contrainte `torch` de `MediaStreamTrack`) est pris en charge par Chrome Android ; **sur iOS, son support n'est pas garanti**. L'accès à la caméra exige HTTPS.

### CT-011
**Partage.** La Web Share API est disponible sur iOS et Android, mais de façon inégale sur ordinateur : prévoir le téléchargement d'image en repli.

### CT-014
**Navigateurs intégrés** (Instagram, Snapchat, Messenger…) : stockage isolé et capacités réduites. Voir [FEAT-019](fonctionnalites/recuperation.md).

## 4. Options d'architecture (Propositions, non décidées)

Elles sont présentées pour éclairer [Q-032](questions-ouvertes.md#q-032). Aucune n'est retenue.

| Besoin | Option A (tout Cloudflare) | Remarques |
|--------|----------------------------|-----------|
| Statique et CDN | Workers Static Assets ou Pages | Répond à CT-009 |
| API | Workers | Proche des joueurs, sans serveur à gérer |
| État temps réel de la soirée (progression, contagion, paliers) | **Un Durable Object** qui tient l'état et des WebSockets | Une seule instance cohérente, adaptée à un seul événement |
| Données persistantes (étiquettes, personnages, scans) | D1 (SQLite) ou le stockage intégré au Durable Object | |
| Photos du mur | R2 | [FEAT-017](fonctionnalites/mur-deja-vu.md) |
| Web Push | Implémentation VAPID compatible WebCrypto dans un Worker | [CT-008](#ct-008) |
| Tâches planifiées (H−30, révélation) | Alarmes de Durable Object ou Cron Triggers | |

Les choix de framework front et de bibliothèque QR restent libres. Ils sont à décider en [Q-032](questions-ouvertes.md#q-032).

## 5. Contraintes de projet

### CT-012
Le code et cette documentation vivent dans un **dépôt GitHub public** (`trash-anger/pandemonium2026`, licence Apache 2.0). *Statut : Confirmé (S3).* Voir [REQ-017](exigences-transversales.md#req-017).

### CT-013
**Échéance** : samedi 7 novembre 2026 (Hypothèse sur la date, voir la [vision](vision.md#1-contexte)). Il y a environ 4 jours entre ces specs et la fête. Impression et assemblage physique compris.

### CT-015
La spécification sert de base à un **développement piloté par les specs (SDD)**, réalisé en partie par un agent de développement. *Statut : Confirmé (S3).*
