# Questions ouvertes

[← Index](../README.md)

Les questions sont regroupées en **lots par priorité**. Chacune indique la **conséquence** de la décision et des **options**. La première option est la recommandation de l'assistant ; ce n'est pas une décision. Une fois tranchée, une question passe à « Résolue → DEC-xxx ».

## Lot 1 : bloquant pour le socle jouable

### Q-001
**Quelles sont les heures de la soirée (début, fin) et celle de la révélation ?** S1 évoque « 3 h ? ».
*Conséquence :* elles fixent l'annonce H−30, la révélation, le gel des classements et le passage au mode lendemain.
*Options :* (a) heures fixes saisies dans l'admin et modifiables en direct ; (b) révélation déclenchée à la main par le MJ.
*Affecte :* [FEAT-009](fonctionnalites/quete-collective.md), [FEAT-016](fonctionnalites/notifications.md), [FEAT-018](fonctionnalites/lendemain-partage.md).

### Q-002
**Combien d'étiquettes distribuer, et combien de participants sont attendus ?**
*Conséquence :* elle détermine les seuils des paliers, le nombre de jumeaux, de triplés et de chats noirs, la charge serveur et le temps d'impression. Environ 690 autocollants sont disponibles ([CT-002](contraintes-techniques.md#ct-002)).
*Affecte :* FEAT-001, 007, 008, 009, REQ-015.

### Q-005
**Que devient une étiquette « tuée dans l'œuf » ?**
*Conséquence :* sans garde-fou, un joueur actif peut « tuer » volontairement les étiquettes vierges des autres. La règle influence donc directement le comportement des joueurs.
*Options :* (a) **elle reste réclamable, le tueur gagne seulement le badge** (pas de perte d'étiquette) ; (b) mort définitive, irréversible sauf intervention du MJ ; (c) carte spéciale « œuf brisé », et le futur porteur naît avec un trait comique ; (d) le badge ne s'obtient qu'une fois par joueur, pour limiter l'intérêt de tuer en série.
*Affecte :* [FEAT-003](fonctionnalites/personnage.md), [données](donnees.md#3-cycles-de-vie).

### Q-010
**Les étiquettes que porte Florian sont-elles toutes liées à son personnage, ou sont-elles des étiquettes vierges à détacher et distribuer ?**
*Conséquence :* elle décide si le costume de Florian est « une carte » ou un « présentoir ».
*Options :* (a) un personnage « Florian » sur toutes les étiquettes cousues, plus un stock d'étiquettes vierges à distribuer ; (b) toutes vierges ; (c) le personnage du MJ est une carte légendaire.

### Q-013
**La collection est-elle réciproque ?** Quand A scanne B, B obtient-il automatiquement A ?
*Conséquence :* la réciprocité double la progression, mais elle retire l'intérêt de se faire scanner en retour, et elle est en tension avec la règle des retrouvailles par scan mutuel.
*Options :* (a) **non réciproque** : chacun doit scanner l'autre, ce qui crée l'interaction ; (b) réciproque.

### Q-004
**Quelles listes de catégories de costume, couleurs et attributs booléens ? Quel temps cible de création du personnage ?**
*Options :* 8 à 12 catégories en pictos, 8 couleurs, 4 à 6 booléens ; cible de moins de 30 s.
*Affecte :* [FEAT-003](fonctionnalites/personnage.md), [FEAT-006](fonctionnalites/faux-souvenirs.md), [FEAT-007](fonctionnalites/jumeaux.md).

### Q-028
**Que doit absolument contenir la version de samedi ?** Il y a 4 jours de délai et 21 fonctionnalités.
*Conséquence :* elle détermine le plan d'implémentation.
*Options :* voir le [plan](plan-implementation.md) : socle (LOT-0 à LOT-2), puis les lots suivants par ordre de priorité.

### Q-007
**L'app NIIMBOT pour macOS permet-elle d'imprimer en lot N QR différents (import CSV ou Excel) ?**
*Conséquence :* elle détermine si l'impression prend 1 h ou une soirée. Elle conditionne aussi les séries ([Q-019](#q-019)).
*Options :* (a) import en lot dans l'app ; (b) images PNG générées puis imprimées une par une ; (c) autre outil d'impression compatible B1, à évaluer.

## Lot 2 : mécaniques de jeu

### Q-012
**Que signifie « perdre » et « accumuler » des souvenirs ? Quels seuils pour la Boucle infinie, la Célébrité et le Fantôme ?**
*Options :* voir la proposition dans [FEAT-005](fonctionnalites/rescan-deja-vu.md) : une jauge de souvenirs et des faux souvenirs qui deviennent flous, sans suppression de cartes.

### Q-014
**Comment fonctionnent les factions ?** Nombre, attribution, score, lien avec la quête coopérative et avec les « clans » du graphe.
*Options :* voir [FEAT-011](fonctionnalites/factions.md).

### Q-015
**Quelle place pour D&D ?** Classes de personnage ? Caractéristiques tirées du costume ? Enjeu des duels (souvenirs, points de faction, rien) ?

### Q-016
**Un rescan fait-il avancer la quête collective ? Quel est le contenu des easter eggs (×3, ×6, ×13, et ceux propres à certaines étiquettes) ?**

### Q-018
**Combien de groupes de jumeaux et de triplés ? Quel rythme pour les indices ? La fenêtre de retrouvailles est-elle de 60 s ?**

### Q-020
**Comment fonctionne la contagion ?** Sens de transmission, probabilité, durée, guérison ou immunité, cible de prévalence. Combien de chats noirs ?

### Q-021
**Quels paliers collectifs et quels effets ? Quelle image pour la révélation ?** Constellation seule ou constellation formant un dessin, comme l'image ou la phrase de S1 ?

## Lot 3 : confidentialité et identité

### Q-023
**Mur de photos : quel consentement, qui voit les photos, et y a-t-il une projection ?**
*Conséquence :* des photos de personnes en fête, publiées sur un site public, posent un vrai enjeu de vie privée.
*Options :* (a) **consentement à l'activation de la caméra, mur visible seulement dans l'app, effet visuel déformant** ; (b) photos visibles du MJ seulement ; (c) projection en salle.

### Q-024
**Combien de temps conserver les données et le site après la fête ?**
*Options :* (a) 7 jours puis suppression des photos, anonymisation du reste ; (b) 30 jours.

### Q-025
**Retient-on la récupération par 3 mots ([FEAT-019](fonctionnalites/recuperation.md)) ?**
*Conséquence :* sans elle, un joueur qui change de navigateur perd son personnage.

### Q-022
**Le porteur voit-il qui a réagi à sa carte, ou seulement les totaux ?**

### Q-003
**Une personne sans étiquette peut-elle jouer en spectateur** (collectionner sans être collectionnable) ?

## Lot 4 : logistique et finitions

### Q-006
**L'interface doit-elle aussi exister en anglais ?**

### Q-008
**Quel protocole de test de scan ?** Téléphones, éclairage, distance.

### Q-009
**Comment inciter à installer l'app et à utiliser le scanner intégré ?** Badge, bonus de score, indices de jumeau plus rapides ?

### Q-011
**Un joueur peut-il modifier la description de son costume après sa création ?** Elle sert aux indices des jumeaux.

### Q-017
**Combien de gabarits de faux souvenirs, et qui les écrit ?**

### Q-019
**Comment rendre les séries reconnaissables et les imprimer efficacement ? Quel bonus ?** Voir [FEAT-012](fonctionnalites/series-rarete.md).

### Q-026
**Quelle variante d'imprimante a été achetée (B1 ou B1 Pro) et quelle est sa résolution ?**

### Q-027
**Que contiennent les étiquettes manille « pré-imprimées » ? Imprime-t-on aussi un verso humoristique ?**

### Q-029
**Où vit la configuration secrète** (jumeaux, chats noirs) puisque le dépôt est public ?
*Options :* (a) **saisie uniquement dans le panneau MJ ou dans un fichier ignoré par git** ; (b) dépôt privé séparé ; (c) publication après la fête.

### Q-030
**Les organisateurs de Pandémonium peuvent-ils fournir un écran ou projecteur, ou une annonce au micro ?**

### Q-031
**Quel sous-domaine définitif ?** `p.uyt.re` a été donné en exemple. Faut-il un sous-domaine séparé pour l'admin ?

### Q-032
**Quelle architecture et quelles technologies ?** Voir les options en [contraintes-techniques §4](contraintes-techniques.md#4-options-darchitecture-propositions-non-décidées).

### Q-033
**Quelles limites précises pour le NSFW soft ? Faut-il une version familiale ?**

## Lot 5 : ajouts après la première version

### Q-034
**Que retient-on du jeu du Loup-garou ?** Le README présente le concept « comme au Loup-garou » : des rôles secrets, et personne ne sait qui est qui.
*Conséquence :* simple analogie de présentation, ou vraies mécaniques à spécifier.
*Options :* (a) **analogie seulement** : les rôles cachés existent déjà (jumeaux, triplés, chats noirs) ; (b) révélation des rôles à la fin de la soirée ; (c) mécaniques supplémentaires (phase « nuit » déclenchée par le MJ, vote, rôle d'enquêteur…), qui demandent une nouvelle FEAT.
*Affecte :* [FEAT-007](fonctionnalites/jumeaux.md), [FEAT-008](fonctionnalites/chat-noir.md), [FEAT-011](fonctionnalites/factions.md).
