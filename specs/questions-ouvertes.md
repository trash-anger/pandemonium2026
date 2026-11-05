# Questions ouvertes

[← Index](../README.md)

Les questions sont regroupées en **lots par priorité**. Chacune indique la **conséquence** de la décision et des **options**. La première option est la recommandation de l'assistant ; ce n'est pas une décision. Une fois tranchée, une question passe à « Résolue → DEC-xxx ».

## Lot 1 : bloquant pour le socle jouable

### Q-001
**Résolue → [DEC-018](decisions.md#dec-018)**

**Quelles sont les heures de la soirée (début, fin) et celle de la révélation ?** S1 évoque « 3 h ? ».
*Conséquence :* elles fixent l'annonce H−30, la révélation, le gel des classements et le passage au mode lendemain.
*Options :* (a) heures fixes saisies dans l'admin et modifiables en direct ; (b) révélation déclenchée à la main par le MJ.
*Affecte :* [FEAT-009](fonctionnalites/quete-collective.md), [FEAT-016](fonctionnalites/notifications.md), [FEAT-018](fonctionnalites/lendemain-partage.md).

### Q-002
**Résolue → [DEC-019](decisions.md#dec-019), [DEC-020](decisions.md#dec-020)**

**Combien d'étiquettes distribuer, et combien de participants sont attendus ?**
*Conséquence :* elle détermine les seuils des paliers, le nombre de jumeaux, de triplés et de chats noirs, la charge serveur et le temps d'impression. Environ 690 autocollants sont disponibles ([CT-002](contraintes-techniques.md#ct-002)).
*Affecte :* FEAT-001, 007, 008, 009, REQ-015.

### Q-005
**Résolue → [DEC-023](decisions.md#dec-023)**

**Que devient une étiquette « tuée dans l'œuf » ?**
*Conséquence :* sans garde-fou, un joueur actif peut « tuer » volontairement les étiquettes vierges des autres. La règle influence donc directement le comportement des joueurs.
*Options :* (a) **elle reste réclamable, le tueur gagne seulement le badge** (pas de perte d'étiquette) ; (b) mort définitive, irréversible sauf intervention du MJ ; (c) carte spéciale « œuf brisé », et le futur porteur naît avec un trait comique ; (d) le badge ne s'obtient qu'une fois par joueur, pour limiter l'intérêt de tuer en série.
*Affecte :* [FEAT-003](fonctionnalites/personnage.md), [données](donnees.md#3-cycles-de-vie).

### Q-010
**Résolue → [DEC-024](decisions.md#dec-024)**

**Les étiquettes que porte Florian sont-elles toutes liées à son personnage, ou sont-elles des étiquettes vierges à détacher et distribuer ?**
*Conséquence :* elle décide si le costume de Florian est « une carte » ou un « présentoir ».
*Options :* (a) un personnage « Florian » sur toutes les étiquettes cousues, plus un stock d'étiquettes vierges à distribuer ; (b) toutes vierges ; (c) le personnage du MJ est une carte légendaire.

### Q-013
**Résolue → [DEC-025](decisions.md#dec-025)**

**La collection est-elle réciproque ?** Quand A scanne B, B obtient-il automatiquement A ?
*Conséquence :* la réciprocité double la progression, mais elle retire l'intérêt de se faire scanner en retour, et elle est en tension avec la règle des retrouvailles par scan mutuel.
*Options :* (a) **non réciproque** : chacun doit scanner l'autre, ce qui crée l'interaction ; (b) réciproque.

### Q-004
**Résolue → [DEC-026](decisions.md#dec-026)**

**Quelles listes de catégories de costume, couleurs et attributs booléens ? Quel temps cible de création du personnage ?**
*Options :* 8 à 12 catégories en pictos, 8 couleurs, 4 à 6 booléens ; cible de moins de 30 s.
*Affecte :* [FEAT-003](fonctionnalites/personnage.md), [FEAT-006](fonctionnalites/faux-souvenirs.md), [FEAT-007](fonctionnalites/jumeaux.md).

### Q-028
**Résolue → [DEC-017](decisions.md#dec-017)**

**Que doit absolument contenir la version de samedi ?** Il y a 4 jours de délai et 21 fonctionnalités.
*Conséquence :* elle détermine le plan d'implémentation.
*Options :* voir le [plan](plan-implementation.md) : socle (LOT-0 à LOT-2), puis les lots suivants par ordre de priorité.

### Q-007
**Résolue → [DEC-028](decisions.md#dec-028)**

**L'app NIIMBOT pour macOS permet-elle d'imprimer en lot N QR différents (import CSV ou Excel) ?**
*Conséquence :* elle détermine si l'impression prend 1 h ou une soirée. Elle conditionne aussi les séries ([Q-019](#q-019)).
*Options :* (a) import en lot dans l'app ; (b) images PNG générées puis imprimées une par une ; (c) autre outil d'impression compatible B1, à évaluer.

## Lot 2 : mécaniques de jeu

### Q-012
**Résolue → [DEC-031](decisions.md#dec-031)**

**Que signifie « perdre » et « accumuler » des souvenirs ? Quels seuils pour la Boucle infinie, la Célébrité et le Fantôme ?**
*Options :* voir la proposition dans [FEAT-005](fonctionnalites/rescan-deja-vu.md) : une jauge de souvenirs et des faux souvenirs qui deviennent flous, sans suppression de cartes.

### Q-014
**Résolue → [DEC-027](decisions.md#dec-027)**

**Comment fonctionnent les factions ?** Nombre, attribution, score, lien avec la quête coopérative et avec les « clans » du graphe.
*Options :* voir [FEAT-011](fonctionnalites/factions.md).

### Q-015
**Résolue → [DEC-030](decisions.md#dec-030)**

**Quelle place pour D&D ?** Classes de personnage ? Caractéristiques tirées du costume ? Enjeu des duels (souvenirs, points de faction, rien) ?

### Q-016
**Résolue → [DEC-032](decisions.md#dec-032)**

**Un rescan fait-il avancer la quête collective ? Quel est le contenu des easter eggs (×3, ×6, ×13, et ceux propres à certaines étiquettes) ?**

### Q-018
**Résolue → [DEC-021](decisions.md#dec-021), [DEC-022](decisions.md#dec-022)**

**Combien de groupes de jumeaux et de triplés ? Quel rythme pour les indices ? La fenêtre de retrouvailles est-elle de 60 s ?**

### Q-020
**Résolue → [DEC-029](decisions.md#dec-029)**

**Comment fonctionne la contagion ?** Sens de transmission, probabilité, durée, guérison ou immunité, cible de prévalence. Combien de chats noirs ?

### Q-021
**Résolue → [DEC-033](decisions.md#dec-033)**

**Quels paliers collectifs et quels effets ? Quelle image pour la révélation ?** Constellation seule ou constellation formant un dessin, comme l'image ou la phrase de S1 ?

## Lot 3 : confidentialité et identité

### Q-023
**Résolue → [DEC-034](decisions.md#dec-034)**

**Mur de photos : quel consentement, qui voit les photos, et y a-t-il une projection ?**
*Conséquence :* des photos de personnes en fête, publiées sur un site public, posent un vrai enjeu de vie privée.
*Options :* (a) **consentement à l'activation de la caméra, mur visible seulement dans l'app, effet visuel déformant** ; (b) photos visibles du MJ seulement ; (c) projection en salle.

### Q-024
**Résolue → [DEC-035](decisions.md#dec-035)**

**Combien de temps conserver les données et le site après la fête ?**
*Options :* (a) 7 jours puis suppression des photos, anonymisation du reste ; (b) 30 jours.

### Q-025
**Résolue → [DEC-036](decisions.md#dec-036)**

**Retient-on la récupération par 3 mots ([FEAT-019](fonctionnalites/recuperation.md)) ?**
*Conséquence :* sans elle, un joueur qui change de navigateur perd son personnage.

### Q-022
**Résolue → [DEC-037](decisions.md#dec-037)**

**Le porteur voit-il qui a réagi à sa carte, ou seulement les totaux ?**

### Q-003
**Résolue → [DEC-038](decisions.md#dec-038)**

**Une personne sans étiquette peut-elle jouer en spectateur** (collectionner sans être collectionnable) ?

## Lot 4 : logistique et finitions

### Q-006
**Résolue → [DEC-039](decisions.md#dec-039)**

**L'interface doit-elle aussi exister en anglais ?**

### Q-008
**Résolue → [DEC-051](decisions.md#dec-051)**

**Quel protocole de test de scan ?** Téléphones, éclairage, distance.

### Q-009
**Résolue → [DEC-040](decisions.md#dec-040)**

**Comment inciter à installer l'app et à utiliser le scanner intégré ?** Badge, bonus de score, indices de jumeau plus rapides ?

### Q-011
**Résolue → [DEC-041](decisions.md#dec-041)**

**Un joueur peut-il modifier la description de son costume après sa création ?** Elle sert aux indices des jumeaux.

### Q-017
**Résolue → [DEC-042](decisions.md#dec-042)**

**Combien de gabarits de faux souvenirs, et qui les écrit ?**

### Q-019
**Résolue → [DEC-043](decisions.md#dec-043)**

**Comment rendre les séries reconnaissables et les imprimer efficacement ? Quel bonus ?** Voir [FEAT-012](fonctionnalites/series-rarete.md).

### Q-026
**Quelle variante d'imprimante a été achetée (B1 ou B1 Pro) et quelle est sa résolution ?**

### Q-027
**Résolue → [DEC-044](decisions.md#dec-044)**

**Que contiennent les étiquettes manille « pré-imprimées » ? Imprime-t-on aussi un verso humoristique ?**

### Q-029
**Résolue → [DEC-045](decisions.md#dec-045)**

**Où vit la configuration secrète** (jumeaux, chats noirs) puisque le dépôt est public ?
*Options :* (a) **saisie uniquement dans le panneau MJ ou dans un fichier ignoré par git** ; (b) dépôt privé séparé ; (c) publication après la fête.

### Q-030
**Résolue → [DEC-046](decisions.md#dec-046)**

**Les organisateurs de Pandémonium peuvent-ils fournir un écran ou projecteur, ou une annonce au micro ?**

### Q-031
**Résolue → [DEC-047](decisions.md#dec-047)**

**Quel sous-domaine définitif ?** `p.uyt.re` a été donné en exemple. Faut-il un sous-domaine séparé pour l'admin ?

### Q-032
**Résolue → [DEC-048](decisions.md#dec-048)**

**Quelle architecture et quelles technologies ?** Voir les options en [contraintes-techniques §4](contraintes-techniques.md#4-architecture-option-a-retenue-dec-048).

### Q-033
**Résolue → [DEC-049](decisions.md#dec-049)**

**Quelles limites précises pour le NSFW soft ? Faut-il une version familiale ?**

## Lot 5 : ajouts après la première version

### Q-034
**Résolue → [DEC-050](decisions.md#dec-050)**

**Que retient-on du jeu du Loup-garou ?** Le README présente le concept « comme au Loup-garou » : des rôles secrets, et personne ne sait qui est qui.
*Conséquence :* simple analogie de présentation, ou vraies mécaniques à spécifier.
*Options :* (a) **analogie seulement** : les rôles cachés existent déjà (jumeaux, triplés, chats noirs) ; (b) révélation des rôles à la fin de la soirée ; (c) mécaniques supplémentaires (phase « nuit » déclenchée par le MJ, vote, rôle d'enquêteur…), qui demandent une nouvelle FEAT.
*Affecte :* [FEAT-007](fonctionnalites/jumeaux.md), [FEAT-008](fonctionnalites/chat-noir.md), [FEAT-011](fonctionnalites/factions.md).

## Lot 6 : relecture du 5 novembre (S6, résolu en S7)

### Q-035
**Résolue → [DEC-062](decisions.md#dec-062)**

**Comment distinguer « j'ajoute ma deuxième étiquette » de « je tue un œuf » ?** Un joueur qui a déjà un personnage et reçoit une deuxième étiquette la scanne avec le même appareil : sans précaution, il obtient « Tueur de poussin » sur sa propre étiquette (S6).
*Options :* (a) **écran « Cette étiquette est-elle à toi ? »** ; « Non » donne le badge, « Oui » l'ajoute (limite : 3 étiquettes par personnage) ; (b) seul le MJ peut lier une étiquette supplémentaire, depuis l'admin, au moment de la distribution ; (c) on supprime le badge « Tueur de poussin ».
*Affecte :* [FEAT-003](fonctionnalites/personnage.md).

### Q-036
**Résolue → [DEC-059](decisions.md#dec-059)**

**Que devient la « couleur dominante » du costume ?** DEC-005 en fait un attribut de costume, et les indices des jumeaux devaient commencer par elle. En S5, couleur et faction ont été associées. Or un joueur à plusieurs étiquettes peut avoir plusieurs factions mais garde le même costume.
*Options :* (a) **la couleur de faction est seulement celle de l'étiquette ; on retire la couleur du costume** (les 12 attributs suffisent aux indices) ; (b) on garde une couleur dominante de costume, distincte des couleurs de faction.
*Affecte :* [FEAT-003](fonctionnalites/personnage.md), [FEAT-007](fonctionnalites/jumeaux.md), [FEAT-011](fonctionnalites/factions.md).

### Q-037
**Résolue → [DEC-067](decisions.md#dec-067)**

**Un chat noir est-il un joueur ou une étiquette ?** S1 parle de 2 ou 3 *étiquettes* légendaires ; S5 fixe 1 chat noir pour 50 *joueurs*, soit 6 à 8.
*Options :* (a) **rôle secret attribué dynamiquement à des joueurs**, comme les jumeaux : se faire scanner par eux ou les scanner contamine ; (b) étiquettes du costume du MJ, en nombre fixe ; (c) les deux : un chat noir « patient zéro » sur le MJ, puis des joueurs désignés.
*Affecte :* [FEAT-008](fonctionnalites/chat-noir.md), [FEAT-022](fonctionnalites/costume-mj.md).

### Q-038
**Résolue → [DEC-061](decisions.md#dec-061)**

**Qui consent pour la photo ?** Le scanneur consent à l'activation de sa caméra, mais la photo montre surtout **la personne scannée**. Les photos doivent aussi apparaître à la révélation.
*Options :* (a) **double consentement** : une photo n'est publiée que si la personne scannée a coché « J'accepte d'apparaître sur le mur » à sa création ; (b) consentement du scanneur seulement, avec un effet déformant fort ; (c) les photos ne montrent que l'étiquette (cadrage serré).
*Affecte :* [FEAT-017](fonctionnalites/mur-deja-vu.md), [FEAT-009](fonctionnalites/quete-collective.md), [REQ-010](exigences-transversales.md#req-010).

### Q-039
**Résolue → [DEC-060](decisions.md#dec-060), [DEC-064](decisions.md#dec-064), [DEC-065](decisions.md#dec-065)**

**Quelle faction marque des points quand un joueur a plusieurs factions ?**
*Options :* (a) **la faction de l'étiquette scannée** (pour le scanné) et celle de la dernière étiquette activée (pour le scanneur) ; (b) les points sont partagés entre ses factions ; (c) le joueur choisit une faction « active ».
*Affecte :* [FEAT-011](fonctionnalites/factions.md).

### Q-040
**Résolue → [DEC-063](decisions.md#dec-063)**

**Comment le MJ met-il une étiquette « en rayon » au moment de la distribuer ?** Les étiquettes de la banane ne doivent pas être jouables avant distribution (S5).
*Options :* (a) **le MJ la scanne en « mode distribution » dans l'admin juste avant de la donner** ; (b) le MJ active un lot entier (par exemple 20 étiquettes) avant de partir distribuer ; (c) aucune activation : on accepte le risque.
*Affecte :* [FEAT-001](fonctionnalites/etiquettes-impression.md), [FEAT-020](fonctionnalites/admin.md), [FEAT-022](fonctionnalites/costume-mj.md).

### Q-041
**Résolue → [DEC-058](decisions.md#dec-058), [DEC-070](decisions.md#dec-070)**

**Quelles cartes légendaires et quels pièges retenir, et combien de pièges ?** Propositions : 10 légendaires et 5 pièges dans [FEAT-022](fonctionnalites/costume-mj.md).

### Q-042
**Résolue → [DEC-068](decisions.md#dec-068)**

**L'annonce H−30 précède-t-elle la révélation (4 h 30) ou la fin du jeu (5 h 30) ?**
*Options :* (a) **avant la révélation**, c'est le moment fort ; (b) les deux.
*Affecte :* [FEAT-016](fonctionnalites/notifications.md).

### Q-043
**Résolue → [DEC-071](decisions.md#dec-071)**

**Algorithme d'attribution progressive des jumeaux.** Peut-on jumeler un nouveau joueur avec un joueur déjà actif, et comment étaler l'attribution entre la 60e activation (ou minuit) et 2 h ?
*Options :* voir la proposition de courbe linéaire dans [FEAT-007](fonctionnalites/jumeaux.md).
