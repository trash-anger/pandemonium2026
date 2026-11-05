# Interface

[← Index](../README.md)

## 1. Principes

| ID | Principe | Statut | Source |
|----|----------|--------|--------|
| UI-1 | **Mobile d'abord**, utilisable d'une main, dans une salle **sombre** | Hypothèse (contexte) | S1 |
| UI-2 | **Pas de clavier** dans les parcours principaux, sauf le PIN sur pavé numérique | Confirmé | S3, S5 |
| UI-3 | Tout est **rapide** : un toucher par action quand c'est possible | Confirmé (réactions, création) | S3 |
| UI-4 | Le thème « Déjà vu » se voit : échos, répétitions, boucles, glitchs | Confirmé (thème) ; traitement graphique : Proposition | S1, S3 |
| UI-5 | Esthétique d'**étiquette de vêtement et de soldes**, avec des touches D&D | Confirmé (univers) ; direction artistique : Proposition | S3 |
| UI-6 | Thème sombre par défaut, contraste élevé | Proposition ([REQ-002](exigences-transversales.md#req-002)) | — |

## 2. Inventaire des écrans

| ID | Écran | Fonctionnalités | Statut |
|----|-------|-----------------|--------|
| E-01 | Accueil du jeu : voir §2bis | [FEAT-009](fonctionnalites/quete-collective.md) | Confirmé (S8) ; contenu : Proposition |
| E-02 | Scanner : caméra, lampe, saisie de code | [FEAT-002](fonctionnalites/scan.md) | Confirmé |
| E-03 | Création du personnage en 4 écrans : avertissement, type, détails (couleur et attributs), carte (pseudo, faction, classe, photo, PIN) ; retour arrière possible | [FEAT-003](fonctionnalites/personnage.md) | Confirmé (S7, S8) |
| E-19 | Tutoriel : un seul écran, 4 lignes | [textes §5](textes.md#5-tutoriel-et-accueil) | Confirmé (S8) |
| E-04 | Résultat de scan : nouvelle carte, Déjà vu, chat noir, Tué dans l'œuf, retrouvailles | FEAT-003 à 008, 010, 014 | Confirmé |
| E-05 | Ma fiche et mon double : indices du jumeau | [FEAT-007](fonctionnalites/jumeaux.md) | Confirmé |
| E-06 | Collection : grille, séries | [FEAT-004](fonctionnalites/collection.md), [FEAT-012](fonctionnalites/series-rarete.md) | Confirmé |
| E-07 | Classements | [FEAT-015](fonctionnalites/badges-classements.md) | Confirmé |
| E-08 | Duel | [FEAT-010](fonctionnalites/duel.md) | Confirmé (sous consentement) |
| E-09 | Mur « Déjà vu ! » | [FEAT-017](fonctionnalites/mur-deja-vu.md) | Confirmé |
| E-10 | Révélation finale | [FEAT-009](fonctionnalites/quete-collective.md) | Confirmé |
| E-11 | Lendemain et carte souvenir | [FEAT-018](fonctionnalites/lendemain-partage.md) | Confirmé |
| E-12 | Panneau MJ | [FEAT-020](fonctionnalites/admin.md) | Confirmé |
| E-17 | Compte à rebours avant la révélation et avant la fin | [FEAT-009](fonctionnalites/quete-collective.md) | Confirmé (S7) |
| E-18 | Frise d'activité 21 h → 6 h (admin, mobile et web) | [FEAT-020](fonctionnalites/admin.md) | Confirmé (S7) |
| E-13 | Vue projecteur | [FEAT-009](fonctionnalites/quete-collective.md) | **Abandonné** ([DEC-046](decisions.md#dec-046)) |
| E-14 | Avertissement avant création : jeu punk, données supprimées, installation recommandée | [FEAT-003](fonctionnalites/personnage.md) | Confirmé (S5) |
| E-15 | Spectateur : « Va trouver le MJ », carte en lecture seule, lien discret vers le PIN | [FEAT-019](fonctionnalites/recuperation.md) | Confirmé (S6) |
| E-16 | Écrans de pièges | [FEAT-022](fonctionnalites/costume-mj.md) | Proposition |

## 2bis. Accueil et tutoriel

**Principe (Confirmé, S8) :** très simple, rapide, compréhensible sans explication. Un joueur doit savoir quoi faire en moins de 5 secondes. La partie graphique sera travaillée plus tard : ici, seul le contenu compte.

**Tutoriel :** un seul écran, quatre lignes (scanner, revoir, jumeau, révélation à 5 h), un bouton « C'est parti ». Textes : [textes §5.1](textes.md#5-tutoriel-et-accueil).

**Écran d'accueil (E-01), de haut en bas :**
1. Barre de progression de la quête collective, avec le prochain palier ([barème](bareme.md)).
2. Compte à rebours, seulement quand il y en a un (révélation, fin, blocage).
3. **Une seule ligne « Et maintenant ? »**, qui suggère l'action la plus utile du moment ([textes §5.2](textes.md#5-tutoriel-et-accueil)).
4. Un très gros bouton **Scanner**.
5. En dessous, discrètement : ma carte, ma collection (nombre de cartes), mon jumeau (si attribué).

Les classements, le mur et les badges sont dans la barre d'onglets, pas sur l'accueil. Jusqu'au LOT-3, l'onglet 🏅 « Badges » occupe la place des classements ; une pastille rose signale un badge pas encore vu ([textes §1.6](textes.md#16-badges-feat-015)).

**Écran de nouvelle carte (E-04) :** le **faux souvenir** est l'élément principal, affiché en premier et en grand. C'est le moment drôle qui donne envie de continuer (S8).

## 3. Navigation

```mermaid
flowchart LR
    QR([QR externe]) --> E04
    E01[E-01 Accueil] --> E02[E-02 Scanner] --> E04[E-04 Résultat]
    E04 --> E01
    E04 --> E08[E-08 Duel]
    E01 --> E06[E-06 Collection]
    E01 --> E07[E-07 Classements]
    E01 --> E05[E-05 Ma fiche]
    E01 --> E09[E-09 Mur]
    E04 -.première fois.-> E03[E-03 Création] --> E01
```
*Figure : navigation principale. Statut : Proposition. On suppose une barre d'onglets en bas (Accueil, Collection, **Scanner** au centre, Classements, Moi).*

## 4. États communs
| État | Comportement attendu (Proposition) |
|------|-------------------------------------|
| Chargement | Squelettes, plus un texte d'ambiance (« On cherche ta taille en réserve… ») ; jamais d'écran blanc |
| Vide | Texte humoristique et action suggérée (« Va scanner du monde ») |
| Hors ligne | Bandeau discret avec le nombre de scans en attente ([RG-021-6](fonctionnalites/pwa-hors-ligne.md)) |
| Erreur | Message dans le ton du jeu, plus une action de reprise (« Réessayer », « Saisir le code ») |
| Succès | Retour haptique (si disponible) et animation courte |

## 5. Maquettes filaires

> **Statut : propositions à valider.** Ce sont des maquettes textuelles indicatives, pas des références existantes.

**E-04 : Résultat d'une nouvelle carte**
```
┌──────────────────────────────┐
│ ▓▓▓▓▓▓▓░░░  Quête : 312/500  │  ← progression globale (RG-009-1)
├──────────────────────────────┤
│   NOUVELLE PIÈCE AJOUTÉE     │
│   ┌────────────────────┐     │
│   │ 🧛  Vampire Bordeaux│     │  ← carte (FEAT-004)
│   │     −40 % · RARE    │     │
│   │ Masque ✓ Maquill. ✓ │     │
│   └────────────────────┘     │
│ « Vous vous êtes rencontrés  │  ← faux souvenir (FEAT-006)
│  en 1997 dans un lave-auto…» │
│ ─ Toi vs Vampire ─────────── │  ← comparaison (FEAT-010)
│  23 cartes   |   41 cartes   │
│  Déjà vu les mêmes 4 : 👻🦇🎃🧙│
│ 🎃 👻 💀 🦇 🕷️ 🧛 🔮 🖤       │  ← réactions (FEAT-014)
│ [ ⚔️ Défier en duel ]        │  ← duel (FEAT-010)
└──────────────────────────────┘
```

**E-04 : Déjà vu**
```
┌──────────────────────────────┐
│      DÉJÀ VU ×3              │
│      DÉJÀ VU ×3              │  ← texte en écho
│      DÉJÀ VU ×3              │
│  🏅 Boucle détectée          │  ← RG-005-2
│  « Article déjà dans ton     │
│    panier. »                 │
└──────────────────────────────┘
```

**E-03 : Création du personnage, étape costume**
```
┌──────────────────────────────┐
│ ← Retour        Étape 2/4    │
│ Ton costume :                │
│ choisis ce qui te ressemble  │
│ [🧟][🧛][🧙][🤖]              │  ← 8 types (FEAT-003)
│ [🦄][💋][🦸][🤡]              │
│              [ Suivant → ]   │
└──────────────────────────────┘
┌──────────────────────────────┐
│ ← Retour        Étape 3/4    │
│ Couleur dominante :          │
│ ●●●●●●●●●●●●                 │  ← 12 couleurs
│ Coche ce qu'on voit de loin :│
│ 🎭 💄 💇 😈 🪽 🎩            │  ← 12 attributs
│ 💡 🩸 🪄 🧥 ✨ 🐾            │
│              [ Suivant → ]   │
└──────────────────────────────┘
```

## 6. Références visuelles

Des **illustrations générées** (statut : proposition) présentent le concept dans le [README](../README.md) ; leur fiche est dans [`assets/illustrations/`](../assets/illustrations/README.md). Elles proposent une **direction graphique** inspirée du teaser : glitch rose et vert, caméra de surveillance de magasin, avatars brillants en blister pour les 8 types de costume (Proposition, S11). Florian n'a fourni **aucun visuel** réel. Aucune image externe n'a été intégrée : les photos des fiches Amazon sont protégées et ne doivent pas être réutilisées. Visuels à constituer, à déposer dans [`assets/references/`](../assets/references/README.md) :

| Visuel à ajouter | Type | Illustre | Statut attendu |
|------------------|------|----------|----------------|
| Photo d'une étiquette assemblée : autocollant QR sur l'étiquette manille, attachée au pistolet | Photo | [FEAT-001](fonctionnalites/etiquettes-impression.md), [CT-003](contraintes-techniques.md#ct-003) | Référence |
| Photo du costume complet de Florian | Photo | [Vision](vision.md) | Référence |
| Photo d'un test de scan en lumière faible | Photo | [CA-001-2](fonctionnalites/etiquettes-impression.md) | Référence |
| Capture du gabarit d'étiquette dans l'app Niimbot macOS | Capture | [CT-004](contraintes-techniques.md#ct-004) | Référence |
| Planche d'inspiration : vraies étiquettes de vêtements, consignes d'entretien, affiches de soldes | Photo | [Univers et ton](univers-et-ton.md) | Inspiration (droits à vérifier) |
| Maquettes haute fidélité des écrans E-01 à E-06 | Maquette | §2 | Proposition à valider |
