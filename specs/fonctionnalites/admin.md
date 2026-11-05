# FEAT-020 : Panneau du maître du jeu

[← Fonctionnalités](README.md)

**Statut :** Confirmé (« intelligent d'avoir un panneau d'admin », S3) ; contenu : Hypothèse et Proposition · **Sources :** S2, S3, S5, S6, S7, S9, S10

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
| ADM-15 | **Préréglages** du barème (Lent, Normal, Rapide, Très rapide), changeables en un toucher, et **champ libre** pour chaque valeur en dernier recours ([barème §0](../bareme.md#0-préréglages-confirmé-s9)) | Avant et pendant | Confirmé (S9) |
| ADM-16 | **Suggestions de réglage par notification push** au MJ, applicables en un toucher ([barème §6](../bareme.md#6-signaux-et-suggestions-au-mj-confirmé-s9)) | Pendant | Confirmé (S9) |
| ADM-17 | **Mode pause « Fermé pour inventaire »** : toutes les étiquettes du MJ deviennent des pièges, par exemple pendant une pause cigarette (voir ci-dessous) | Pendant | Confirmé (S9) |
| ADM-18 | **Page « Derniers clients »** et **sanctions graduées** (voir ci-dessous) | Pendant | Confirmé (S9) |
| ADM-19 | **Missions personnelles** : depuis « Derniers clients », confier une mission éclair à un joueur qui vient de scanner le MJ (voir ci-dessous) | Pendant | Confirmé (S10) |

## Mode pause « Fermé pour inventaire » (ADM-17, Confirmé, S9)
| ID | Règle | Statut |
|----|-------|--------|
| RG-020-4 | Un bouton active la pause pour 5, 10 ou 15 min, ou jusqu'à désactivation manuelle. | Confirmé (principe, S9) ; durées : Proposition |
| RG-020-5 | Pendant la pause, **toutes** les étiquettes du MJ (personnelle, légendaires, pièges) se comportent comme un piège spécial « Fermé pour inventaire » : le scanner du joueur est bloqué 2 min, à chaque scan. Ce piège ne compte pas dans la règle « un piège ne piège qu'une fois » ([RG-022-5](costume-mj.md)). | Proposition |
| RG-020-6 | Le mélange des légendaires est suspendu pendant la pause, puis reprend. Les « Derniers exemplaires » ne sont pas remis en rayon pendant la pause : ils le sont à la fin de celle-ci. | Proposition |
| RG-020-7 | L'écran du piège indique le temps restant avant la fin de la pause ([textes §6](../textes.md#6-textes-du-mj)). | Proposition |

## Derniers clients et sanctions graduées (ADM-18, Confirmé, S9)
La page **« Derniers clients »** liste les personnages qui ont scanné une étiquette du MJ dans les 30 dernières minutes, du plus récent au plus ancien : emoji, pseudo, heure, étiquette scannée. Toucher un personnage ouvre le choix d'une sanction, au cas où la personne aurait fait quelque chose malgré les avertissements.

| Niveau | Sanction | Effet | Confirmation |
|--------|----------|-------|--------------|
| 1 | **Avertissement** | Message « Le MJ t'a à l'œil » ; badge « Client difficile » | Aucune |
| 2 | **Retour en caisse** | Scanner bloqué 5 min | Aucune |
| 3 | **Article défectueux** | Corruption immédiate de 10 min, sans immunité ; jauge de souvenirs −5 | Confirmation simple |
| 4 | **Rappel de produit** | Scanner bloqué 30 min ; points de faction du joueur −100 ; jauge de souvenirs à 0 | Confirmation simple |
| 5 | **Interdit de magasin** | Personnage désactivé : ses étiquettes ne répondent plus, il disparaît des classements, jusqu'à réactivation par le MJ | Confirmation renforcée : confirmer, puis maintenir le bouton 2 s |

| ID | Règle | Statut |
|----|-------|--------|
| RG-020-8 | Les sanctions sont graduées ; les niveaux 3 et plus exigent une confirmation, le niveau 5 une confirmation renforcée. | Confirmé (S9) ; contenu des niveaux : Proposition |
| RG-020-9 | La personne sanctionnée reçoit le message de sa sanction dans l'app et par notification ([textes §6](../textes.md#6-textes-du-mj)). Les autres joueurs ne voient rien : pas d'humiliation publique. | Proposition |
| RG-020-10 | Toute sanction est **annulable** depuis l'admin et **journalisée** (RG-020-2). | Proposition |
| RG-020-11 | Une sanction peut aussi être appliquée depuis la fiche de n'importe quel personnage, pas seulement depuis « Derniers clients ». | Proposition |

## Missions personnelles (ADM-19, Confirmé, S10)
Depuis la page « Derniers clients », toucher un personnage propose deux choix : **Confier une mission** ou **Sanctionner**. Une mission est une mission éclair ([FEAT-013](missions-eclair.md)) réservée à ce joueur, annoncée par bannière et notification, avec un compte à rebours. Le serveur vérifie la réussite automatiquement, sauf pour la mission libre.

| # | Mission | Condition | Durée | Récompense |
|---|---------|-----------|-------|------------|
| M-1 | **Ramène-moi des clients** | Scanner 3 personnes jamais scannées | 10 min | +20 points de faction |
| M-2 | **Tournée des factions** | Scanner un membre de chaque faction (5) | 20 min | +30 points de faction, badge « Employé du mois » |
| M-3 | **Service après-vente** | Rescanner sa toute première rencontre de la soirée | 10 min | +3 souvenirs |
| M-4 | **Contrôle qualité** | Scanner quelqu'un qui porte deux attributs tirés au hasard (par exemple masque **et** cape) | 15 min | +20 points de faction |
| M-5 | **Livraison express** | Faire scanner une étiquette du MJ par 2 personnes qui ne l'ont jamais fait | 10 min | Un indice bonus sur son jumeau, ou +20 points s'il n'en a pas |
| M-6 | **Solde privée** | Aucune : c'est un cadeau | — | Ses 5 prochaines nouvelles cartes comptent double pour la quête |
| M-7 | **Mission libre** | Décrite de vive voix par le MJ ; validée à la main par un bouton « Réussie » | Au choix | Au choix parmi les récompenses ci-dessus |

| ID | Règle | Statut |
|----|-------|--------|
| RG-020-12 | Un joueur n'a qu'**une mission personnelle active** à la fois. | Proposition |
| RG-020-13 | Une mission échouée n'entraîne aucune pénalité. | Proposition |
| RG-020-14 | Les missions personnelles et les sanctions sont journalisées et visibles dans la frise d'activité. | Proposition |

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-020-1 | L'accès au panneau est **authentifié par Google OAuth** et réservé au MJ, sur un chemin protégé de `p.uyt.re` ([REQ-011](../exigences-transversales.md#req-011)). | Confirmé (S5, [DEC-047](../decisions.md#dec-047)) |
| RG-020-2 | Toute action du MJ est journalisée. | Proposition |
| RG-020-3 | Le panneau est utilisable sur téléphone, d'une seule main, et sur ordinateur. | Confirmé (S7) |

## Critères d'acceptation
- **CA-020-1 :** Une requête au panneau sans authentification est refusée.
- **CA-020-3 :** Étant donné la pause activée, quand un joueur scanne n'importe quelle étiquette du MJ, alors il voit « Fermé pour inventaire » et son scanner est bloqué 2 min.
- **CA-020-4 :** Une sanction de niveau 3, 4 ou 5 n'est jamais appliquée sans confirmation ; le niveau 5 exige un appui maintenu.
- **CA-020-5 :** Une sanction annulée rétablit l'état du joueur d'avant la sanction (sauf le temps de blocage déjà écoulé).
- **CA-020-6 :** Une suggestion de réglage n'est jamais appliquée sans action du MJ.
- **CA-020-2 :** Étant donné un glitch global déclenché, alors tous les appareils ouverts le voient dans les N secondes ([REQ-007](../exigences-transversales.md#req-007)).
