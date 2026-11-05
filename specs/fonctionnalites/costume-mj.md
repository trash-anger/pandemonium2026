# FEAT-022 : Costume du MJ, cartes légendaires et pièges

[← Fonctionnalités](README.md)

**Statut :** Confirmé · **Sources :** S5, S6, S7

## Objectif
Faire de Florian une **cible de chasse**. Son costume porte trois sortes d'étiquettes ([DEC-024](../decisions.md#dec-024)) :
1. son **étiquette personnelle** (le personnage « Florian ») ;
2. **10 cartes légendaires** qui n'existent que sur lui (Confirmé, S6, S7) ;
3. **5 pièges** qui bloquent le scanner de celui qui les scanne pendant 1 à 5 min, au hasard (Confirmé, S5, S7). Ils sont distincts du chat noir.

Les étiquettes du costume sont imprimées sur le **grand format** d'étiquettes, plus visible ([DEC-066](../decisions.md#dec-066)). Les étiquettes vierges qu'il distribue restent dans une banane, hors d'atteinte : elles deviennent jouables dès qu'on les scanne ([DEC-063](../decisions.md#dec-063)).

## Mélange toutes les 20 minutes (Confirmé, S7, [DEC-058](../decisions.md#dec-058))
Pour que les joueurs ne se passent pas l'information « telle étiquette est un piège », **les effets sont redistribués au hasard entre les 15 étiquettes spéciales toutes les 20 minutes**. L'étiquette personnelle du MJ ne participe pas au mélange.

On collectionne **l'effet**, pas l'étiquette. Rescanner une même étiquette après un mélange peut donc donner une nouvelle légendaire… ou un piège.

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-022-1 | Une carte légendaire ou un piège est une **carte spéciale**, pas un personnage : elle rejoint une section « Légendes » de la collection, elle n'ouvre ni faux souvenir ni comparaison. | Proposition |
| RG-022-2 | Chaque joueur obtient chaque légendaire **une fois**. Si l'étiquette porte un effet déjà obtenu, l'écran affiche « Déjà vu » sans rejouer l'effet. | Confirmé (S7 : collection par effet) |
| RG-022-3 | Collectionner les 10 légendaires donne le badge **« Garde-robe du MJ »**. | Proposition |
| RG-022-4 | Un piège bloque les **nouveaux scans** du joueur pendant une durée tirée entre 1 et 5 min. Le blocage est appliqué **côté serveur** : il vaut aussi pour les scans faits avec l'appareil photo natif. Pendant le blocage, l'app reste consultable. | Confirmé (durée, S5) ; mise en œuvre : Proposition |
| RG-022-5 | Un même piège (effet) ne piège un joueur qu'**une fois** ; ensuite il affiche « Tu t'es déjà fait avoir. Déjà vu. » | Proposition |
| RG-022-6 | Rien ne distingue visuellement une légendaire d'un piège sur le costume. | Proposition |
| RG-022-7 | Le MJ n'a pas de jumeau et n'est pas chat noir. | Proposition |
| RG-022-8 | Les écrans de piège respectent [REQ-003](../exigences-transversales.md#req-003) (pas de flash dangereux). | Proposition, requise |
| RG-022-9 | Les effets sont **redistribués au hasard toutes les 20 min** entre les 15 étiquettes spéciales. | Confirmé (S7) |

## Cartes légendaires (10, Confirmé, S7)
| # | Carte | Effet |
|---|-------|-------|
| L-1 | **Cape de Déjà-vu +2** | Immunité au glitch du chat noir pendant 30 min |
| L-2 | **Retour sans reçu** | Annule une fois une corruption en cours, ou protège du prochain piège |
| L-3 | **La Pilule rouge** | Pendant 10 min, affiche le pourcentage de corrompus en direct et le nombre de chats noirs actifs |
| L-4 | **Miroir de la cabine d'essayage** | Révèle immédiatement le prochain indice sur ton jumeau |
| L-5 | **Bon de réduction −100 %** | Badge « Anticapitaliste » ; tes 3 prochaines nouvelles cartes comptent double pour la quête collective |
| L-6 | **Boucle temporelle** | Pendant 10 min, chaque rescan compte, sans le délai de 5 min ([RG-005-3](rescan-deja-vu.md)) |
| L-7 | **Dernier exemplaire** | Mis en rayon **trois fois** : à 21 h, à minuit et à 3 h. Chaque exemplaire revient au premier joueur qui l'obtient ; ensuite, l'effet devient « Rupture de stock » jusqu'à la remise en rayon suivante. Critique de la rareté artificielle |
| L-8 | **Dé à 20 faces doré** | Avantage au prochain duel (si les duels sont livrés) ; sinon, des souvenirs en plus |
| L-9 | **Ticket de caisse infini** | Faux souvenir unique avec le MJ, très long, qui raconte toutes vos vies antérieures |
| L-10 | **Mannequin de vitrine** | Pendant 15 min, ta carte est mise en avant (« Vu en vitrine ») sur l'écran d'accueil de tous les joueurs, sans photo |

## Pièges (5, Confirmé, S7)
Chaque piège parodie une frustration de la consommation ou du numérique. Durée : 1 à 5 min, au hasard.

| # | Piège | Écran pendant le blocage |
|---|-------|--------------------------|
| T-1 | **File d'attente du Black Friday** | « Tu es le 4 812e dans la file. » Le numéro descend lentement |
| T-2 | **Paiement refusé** | « Carte refusée. Veuillez patienter avant de réessayer. » |
| T-3 | **Mise à jour obligatoire** | Fausse barre de progression qui recule de temps en temps, avec « Ne pas éteindre votre téléphone » |
| T-4 | **Abonnement premium** | « Débloque le scan pour 9,99 $/mois. » Le bouton « Refuser » rapetisse à chaque toucher |
| T-5 | **CAPTCHA infini** | « Prouve que tu n'es pas un robot. » Toutes les images contiennent des étiquettes |

## Données
`Etiquette.role` : `personnelle_mj` ou `speciale_mj`. `AttributionEffet` : étiquette, effet (L-x ou T-x), début, fin (une ligne par mélange). `EffetObtenu` : personnage, effet, date. `BlocageScan` : personnage, cause (piège ou surconsommation), début, fin ([données](../donnees.md)).

## Critères d'acceptation
- **CA-022-1 :** Étant donné un joueur qui scanne un piège, alors tout nouveau scan de sa part est refusé, avec l'écran du piège, jusqu'à la fin de la durée tirée (entre 1 et 5 min).
- **CA-022-2 :** Étant donné un joueur qui a déjà obtenu L-3, quand il scanne l'étiquette qui porte L-3 après un mélange, alors l'effet ne s'applique pas une seconde fois.
- **CA-022-3 :** Toutes les 20 min, l'association entre étiquettes spéciales et effets change ; chaque effet reste porté par exactement une étiquette.
- **CA-022-4 :** Étant donné le « Dernier exemplaire » de minuit obtenu par A, quand B scanne l'étiquette qui le porte, alors B reçoit « Rupture de stock » ; à 3 h, un nouvel exemplaire est disponible.
