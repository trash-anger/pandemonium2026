# Textes du jeu

[← Index](../README.md)

> **Statut : Proposition, à relire par Florian** ([DEC-032](decisions.md#dec-032), [DEC-042](decisions.md#dec-042)). Tous les textes existent en français et en anglais ([DEC-039](decisions.md#dec-039)). Ton : [univers-et-ton](univers-et-ton.md) ; NSFW soft limité aux allusions ([DEC-049](decisions.md#dec-049)).

**Règle d'écriture.** Les textes ne doivent jamais dépendre du genre d'un joueur : on désigne les joueurs par leur pseudo, on évite les participes et adjectifs accordés à une personne (« arrivé·e », « habillé·e »), et on n'accorde rien avec un attribut de costume dont le genre varie (« un masque », « une cape »). Ainsi, le même gabarit reste correct quelle que soit la combinaison ([CA-006-3](fonctionnalites/faux-souvenirs.md)).

## 1. Libellés de la création du personnage

### 1.1 Types de costume ([FEAT-003](fonctionnalites/personnage.md))
La colonne « forme » sert dans les gabarits (`{type_A}`), après « en » en français et après « as » en anglais.

| Emoji | Libellé FR | Forme FR | Libellé EN | Forme EN |
|-------|-----------|----------|------------|----------|
| 🧟 | Mort-vivant | mort-vivant | Undead | an undead |
| 🧛 | Vampire et créature de la nuit | créature de la nuit | Vampires & night creatures | a night creature |
| 🧙 | Magie et fantasy | mage | Magic & fantasy | a mage |
| 🤖 | Robot et sci-fi | robot | Robots & sci-fi | a robot |
| 🦄 | Animal et créature | bestiole | Animals & creatures | a critter |
| 💋 | Sexy et uniforme | uniforme sexy | Sexy & uniforms | a sexy uniform |
| 🦸 | Pop culture | héros de film | Pop culture | a movie hero |
| 🤡 | Inclassable | OVNI vestimentaire | Unclassifiable | a fashion UFO |

### 1.2 Couleurs dominantes (12)
Forme utilisée dans les gabarits : « tout en {couleur} » / « all in {color} ».

| FR | EN | FR | EN |
|----|----|----|----|
| noir | black | vert | green |
| blanc | white | bleu | blue |
| argent | silver | violet | purple |
| rouge | red | rose | pink |
| orange | orange | brun | brown |
| doré | gold | arc-en-ciel | rainbow |

### 1.3 Attributs (12)
Consigne en haut de l'écran : **« Coche tout ce qu'on peut voir de loin sur ton costume. »** / **« Tick everything people can see from across the room. »**

La colonne « forme » sert dans les gabarits (`{attr_A}`) ; elle porte son propre article.

| # | Libellé FR | Forme FR | Libellé EN | Forme EN |
|---|-----------|----------|------------|----------|
| 1 | Masque | un masque | Mask | a mask |
| 2 | Maquillage sur le visage | du maquillage | Face paint | face paint |
| 3 | Perruque ou cheveux colorés | une perruque | Wig or coloured hair | a wig |
| 4 | Cornes ou oreilles | des cornes | Horns or ears | horns |
| 5 | Ailes | des ailes | Wings | wings |
| 6 | Chapeau ou couvre-chef | un chapeau | Hat or headpiece | a hat |
| 7 | Lumières ou électronique | des LED | Lights or electronics | LEDs |
| 8 | Faux sang | du faux sang | Fake blood | fake blood |
| 9 | Accessoire à la main ou à la ceinture | un accessoire louche | Handheld or belt accessory | a suspicious accessory |
| 10 | Cape ou manteau long | une cape | Cape or long coat | a cape |
| 11 | Paillettes ou tissu brillant | des paillettes | Glitter or shiny fabric | glitter |
| 12 | Queue | une queue | Tail | a tail |

Si le joueur n'a coché aucun attribut, la forme vaut **« un costume qui n'avait pas encore été inventé »** / **« an outfit that hadn't been invented yet »**.

### 1.4 Factions ([FEAT-011](fonctionnalites/factions.md))
| FR | EN | Devise FR | Motto EN |
|----|----|-----------|----------|
| 🛡️ L'Ordre du Ticket de Caisse | The Order of the Receipt | « Sans reçu, point de salut. » | "No receipt, no salvation." |
| 🔥 Les Soldés Chaotiques | The Chaotic Clearance | « Tout doit disparaître. Nous aussi. » | "Everything must go. Us included." |
| 🌿 Le Cercle de la Friperie | The Thrift Circle | « Déjà porté, jamais dépassé. » | "Pre-worn, never outworn." |
| 📸 La Guilde des Influenceurs | The Influencer Guild | « Utilise mon code promo. » | "Use my promo code." |
| 💀 Les Nécromanciens du Black Friday | The Black Friday Necromancers | « Les invendus se relèveront. » | "The unsold shall rise." |

### 1.5 Classes D&D (8, proposition)
Pour l'instant, ce n'est que de la saveur ; la caractéristique favorite servira aux duels ([DEC-030](decisions.md#dec-030)).

| FR | EN | Caractéristique favorite |
|----|----|--------------------------|
| Barbare du Black Friday | Black Friday Barbarian | Force (de bousculade) |
| Barde de la Cabine d'essayage | Fitting-Room Bard | Charisme vestimentaire |
| Clerc du Retour gratuit | Cleric of Free Returns | Sagesse (lire les petits caractères) |
| Druide du Zéro déchet | Zero-Waste Druid | Constitution |
| Magicien du Code promo | Promo-Code Wizard | Intelligence |
| Paladin du Service après-vente | After-Sales Paladin | Patience (au téléphone) |
| Rôdeur de Friperie | Thrift-Store Ranger | Perception (des bonnes affaires) |
| Voleur d'Étiquettes | Tag Thief | Dextérité |

## 2. Easter eggs de rescan ([RG-005-2](fonctionnalites/rescan-deja-vu.md))

### ×3 : « Boucle détectée » / "Loop detected"
- **FR :** « DÉJÀ VU ×3. Boucle détectée. Cet article est déjà dans ton panier. Trois fois. La Matrice prend des notes. »
- **EN :** "DÉJÀ VU ×3. Loop detected. This item is already in your cart. Three times. The Matrix is taking notes."
- **Effet :** le texte s'affiche trois fois en écho, avec un léger décalage. Badge **Boucle détectée**.

### ×6 : « Jour de la marmotte » / "Groundhog Day"
- **FR :** « DÉJÀ VU ×6. Il est {heure}. Il était déjà {heure}. Il sera encore {heure}. Rien ne change, sauf ton score. »
- **EN :** "DÉJÀ VU ×6. It's {time}. It was already {time}. It will still be {time}. Nothing changes except your score."
- **Effet :** l'animation de la carte se rejoue trois fois avant de s'arrêter. Badge **Jour de la marmotte**.

### ×13 : secret, « Client maudit » / "Cursed Customer"
- **FR :** « DÉJÀ VU ×13. Félicitations : tu atteins le statut Client fidèle, niveau Malédiction. Ce badge n'existe pas. Tu ne l'as jamais eu. Tu ne t'en souviendras pas. »
- **EN :** "DÉJÀ VU ×13. Congratulations: you've reached Loyal Customer status, Curse tier. This badge doesn't exist. You never got it. You won't remember it."
- **Effet :** glitch court (dans les limites de [REQ-003](exigences-transversales.md#req-003)), puis la liste des 13 heures de scan, comme un ticket de caisse. Badge secret **Client maudit**, visible seulement par son détenteur.

## 3. Faux souvenirs ([FEAT-006](fonctionnalites/faux-souvenirs.md))

### 3.1 Variables
| Variable | Contenu | Source |
|----------|---------|--------|
| `{A}`, `{B}` | Pseudos des deux personnages, dans l'ordre de leurs identifiants triés, pour que le texte soit le même des deux côtés ([RG-006-4](fonctionnalites/faux-souvenirs.md)) | Personnages |
| `{attr_A}`, `{attr_B}` | Forme d'un attribut coché, tiré par le hash de la paire (§1.3) | Costume |
| `{type_A}`, `{type_B}` | Forme du type de costume (§1.1) | Costume |
| `{couleur_A}`, `{couleur_B}` | Couleur dominante (§1.2) | Costume |
| `{annee}` | 1987 à 2019 | Hash de la paire |
| `{lieu}` | Lieu, §3.2 | Hash de la paire |
| `{chute}` | Phrase de fin, §3.3 | Hash de la paire |

### 3.2 Lieux (16)
| # | FR | EN |
|---|----|----|
| 1 | dans un lave-auto à Laval | in a car wash in Laval |
| 2 | dans la file du Boxing Day aux Galeries d'Anjou | in the Boxing Day line at Galeries d'Anjou |
| 3 | dans une taverne de Baldur's Gate | in a Baldur's Gate tavern |
| 4 | dans la cabine d'essayage d'un magasin de liquidation | in the fitting room of a clearance store |
| 5 | au comptoir des retours d'un Costco | at a Costco returns desk |
| 6 | dans le métro, ligne orange, entre deux stations | on the orange line, between two stations |
| 7 | dans un dépanneur ouvert 24 heures sur 24 | in a 24-hour dépanneur |
| 8 | dans une friperie du Plateau | in a thrift shop on the Plateau |
| 9 | dans un entrepôt d'invendus | in a warehouse full of unsold stock |
| 10 | au troisième niveau d'un donjon | on the third level of a dungeon |
| 11 | dans la Matrice, version bêta | in the Matrix, beta version |
| 12 | au défilé d'une marque de fast fashion disparue | at a runway show for a defunct fast-fashion brand |
| 13 | au vestiaire de Pandémonium, il y a exactement un an | at the Pandémonium coat check, exactly one year ago |
| 14 | dans une file d'attente qui n'avançait jamais | in a line that never moved |
| 15 | dans un centre commercial abandonné | in an abandoned mall |
| 16 | sur le toit d'un Dollarama | on the roof of a Dollarama |

### 3.3 Chutes (12)
| # | FR | EN |
|---|----|----|
| 1 | Personne n'en a jamais reparlé. | Nobody ever mentioned it again. |
| 2 | Le reçu a été perdu. | The receipt was lost. |
| 3 | Vous avez juré de ne jamais recommencer. Vous avez recommencé. | You swore never to do it again. You did it again. |
| 4 | Ni repris, ni échangé. | No returns, no exchanges. |
| 5 | La Matrice a corrigé le bug, mais pas complètement. | The Matrix patched the bug, but not entirely. |
| 6 | Ça vous a coûté 3 points de vie et 49,99 $. | It cost you 3 hit points and $49.99. |
| 7 | C'était en solde, donc ça ne compte pas. | It was on sale, so it doesn't count. |
| 8 | Vous aviez promis d'en reparler. C'est maintenant. | You promised to talk about it. That's now. |
| 9 | Quelqu'un a pris une photo. Elle a disparu. | Someone took a photo. It's gone. |
| 10 | Le DJ s'en souvient encore. | The DJ still remembers. |
| 11 | Un jet de dé plus tard, tout était pardonné. | One dice roll later, all was forgiven. |
| 12 | Vous l'aviez déjà vécu. Vous ne vous en souvenez pas, c'est normal. | You'd lived it before. You don't remember, that's normal. |

### 3.4 Gabarits (40)
| # | FR | EN |
|---|----|----|
| 1 | En {annee}, {lieu}, {A} portait déjà {attr_A}. {B} a fait semblant de ne rien remarquer. {chute} | In {annee}, {lieu}, {A} was already wearing {attr_A}. {B} pretended not to notice. {chute} |
| 2 | Votre rencontre date de {annee}, {lieu}. {B} voulait échanger {attr_B} contre {attr_A}. {chute} | You met in {annee}, {lieu}. {B} wanted to trade {attr_B} for {attr_A}. {chute} |
| 3 | {A} et {B} ont fait la file ensemble {lieu} pendant 11 heures, pour un article qui n'existait plus. {chute} | {A} and {B} queued together {lieu} for 11 hours, for an item that no longer existed. {chute} |
| 4 | En {annee}, vous avez partagé une cabine d'essayage. {A}, tout en {couleur_A}, a dit : « Ça te va bien. » C'était faux. {chute} | In {annee}, you shared a fitting room. {A}, all in {couleur_A}, said: "That looks good on you." It didn't. {chute} |
| 5 | {B} a sauvé {A} d'un gobelin {lieu}, avec seulement {attr_B}. {chute} | {B} saved {A} from a goblin {lieu}, armed only with {attr_B}. {chute} |
| 6 | En {annee}, vous travailliez à la même caisse. Vous avez volé un rouleau d'étiquettes. Ce soir, la boucle se referme. | In {annee}, you worked the same checkout. You stole a roll of price tags. Tonight, the loop closes. |
| 7 | Il existe une vidéo de {A} et {B}, {lieu}, en {annee}. On y voit {attr_A}, {attr_B} et beaucoup trop de confiance. {chute} | There's a video of {A} and {B}, {lieu}, in {annee}. It shows {attr_A}, {attr_B} and far too much confidence. {chute} |
| 8 | {A} a déjà rapporté un costume au magasin après l'avoir porté une seule soirée. {B} était là. {B} a fait pareil. {chute} | {A} once returned a costume after wearing it for a single night. {B} was there. {B} did the same. {chute} |
| 9 | Dans une autre timeline, {A} et {B} tiennent une friperie ensemble. Ici, vous venez juste de vous scanner. | In another timeline, {A} and {B} run a thrift shop together. Here, you've just scanned each other. |
| 10 | En {annee}, {lieu}, {B} a prêté {attr_B} à {A}. Ça n'a jamais été rendu. {chute} | In {annee}, {lieu}, {B} lent {attr_B} to {A}. It was never returned. {chute} |
| 11 | Vous vous êtes disputé le dernier article en taille unique, {lieu}. Score final : {A} 1, {B} 1, capitalisme 2. | You fought over the last one-size-fits-all item {lieu}. Final score: {A} 1, {B} 1, capitalism 2. |
| 12 | {A} jure avoir vu {B} en {type_B} en {annee}. {B} jure que c'était une autre version de la Matrice. {chute} | {A} swears they saw {B} as {type_B} in {annee}. {B} swears it was another version of the Matrix. {chute} |
| 13 | Au troisième niveau d'un donjon, en {annee}, {A} a lancé un sort de −70 % sur {B}. Effet secondaire : ce soir. {chute} | On the third level of a dungeon, in {annee}, {A} cast a −70% spell on {B}. Side effect: tonight. {chute} |
| 14 | {A} et {B} ont passé la même commande en ligne en {annee}. Un seul colis est arrivé. L'autre est toujours dans un entrepôt. {chute} | {A} and {B} placed the same online order in {annee}. Only one parcel arrived. The other is still in a warehouse. {chute} |
| 15 | Vous avez suivi le même atelier de couture {lieu}. {A} a cousu {attr_A}. {B} a cousu la manche de {A} à sa chaise. {chute} | You took the same sewing class {lieu}. {A} sewed {attr_A}. {B} sewed {A}'s sleeve to the chair. {chute} |
| 16 | En {annee}, {B} a gagné un concours de costumes {lieu}. {A} faisait partie du jury. Rien n'a jamais été prouvé. | In {annee}, {B} won a costume contest {lieu}. {A} was on the jury. Nothing was ever proven. |
| 17 | {A} a déjà vu {B} trois fois ce soir. Ou c'était hier. Ou en {annee}. Le déjà vu est formel. {chute} | {A} has already seen {B} three times tonight. Or yesterday. Or in {annee}. The déjà vu is certain. {chute} |
| 18 | Vous étiez sur la même photo de groupe, {lieu}, en {annee}. {A} au fond avec {attr_A}, {B} devant avec {attr_B}. Personne d'autre ne se souvient de cette fête. | You were in the same group photo, {lieu}, in {annee}. {A} in the back with {attr_A}, {B} up front with {attr_B}. Nobody else remembers that party. |
| 19 | {B} a vendu {attr_B} à {A} sur Marketplace en {annee}. « Comme neuf. » Ce n'était pas neuf. {chute} | {B} sold {attr_B} to {A} on Marketplace in {annee}. "Like new." It was not new. {chute} |
| 20 | Une nuit de Black Friday, {A} et {B} ont dormi sur un tas d'invendus {lieu}. Au réveil, tout était à −90 %, même vous. | One Black Friday night, {A} and {B} slept on a pile of unsold stock {lieu}. By morning, everything was 90% off, including you. |
| 21 | {A} a déjà lancé un jet de Charisme vestimentaire contre {B}. Résultat : 1 naturel. {B} en parle encore. {chute} | {A} once rolled Fashion Charisma against {B}. Result: natural 1. {B} still talks about it. {chute} |
| 22 | En {annee}, {lieu}, vous avez failli vous embrasser. Puis l'alarme antivol a sonné. {chute} | In {annee}, {lieu}, you almost kissed. Then the anti-theft alarm went off. {chute} |
| 23 | {A} a prêté sa carte de fidélité à {B} en {annee}. Les points n'ont jamais été retrouvés. {chute} | {A} lent their loyalty card to {B} in {annee}. The points were never found. {chute} |
| 24 | Vous avez été mannequins de vitrine dans le même magasin, {lieu}. Vous avez bougé une seule fois. Une cliente s'en souvient encore. | You were window mannequins in the same store, {lieu}. You moved only once. A customer still remembers. |
| 25 | Un jour, {B} a dit à {A} : « On se connaît, non ? » C'était en {annee}, {lieu}. Ce soir, c'est la deuxième fois. Ou la quatorzième. | One day, {B} said to {A}: "Don't we know each other?" It was {annee}, {lieu}. Tonight is the second time. Or the fourteenth. |
| 26 | Selon la Matrice, {A} et {B} partagent 37 % de leur garde-robe. Le reste a été acheté à crédit. {chute} | According to the Matrix, {A} and {B} share 37% of their wardrobe. The rest was bought on credit. {chute} |
| 27 | En {annee}, {A} a perdu {attr_A} {lieu}. Le service des objets trouvés cherche encore. {chute} | In {annee}, {A} lost {attr_A} {lieu}. Lost and found is still looking. {chute} |
| 28 | Vous avez rompu avec la même marque de fast fashion, la même semaine de {annee}. Elle n'a jamais rappelé. {chute} | You both broke up with the same fast-fashion brand, the same week of {annee}. It never called back. {chute} |
| 29 | En {annee}, {A} et {B} ont fait une quête secondaire ensemble : rapporter un jean sans reçu. Récompense : 0 XP. {chute} | In {annee}, {A} and {B} did a side quest together: return jeans without a receipt. Reward: 0 XP. {chute} |
| 30 | {A}, tout en {couleur_A}, et {B}, tout en {couleur_B} : la même palette qu'en {annee}, {lieu}. Coïncidence ? La Matrice ne croit pas aux coïncidences. | {A}, all in {couleur_A}, and {B}, all in {couleur_B}: the same palette as in {annee}, {lieu}. Coincidence? The Matrix doesn't believe in coincidences. |
| 31 | Vous êtes persona non grata {lieu} depuis {annee}. Personne ne sait pourquoi, mais {attr_A} y est pour quelque chose. | You've been persona non grata {lieu} since {annee}. Nobody knows why, but {attr_A} had something to do with it. |
| 32 | En {annee}, {A} a essayé de retourner {B} au service à la clientèle. Refusé : article personnalisé. {chute} | In {annee}, {A} tried to return {B} to customer service. Refused: personalised item. {chute} |
| 33 | En {annee}, vous avez lancé une tendance {lieu} : {attr_A} avec {attr_B}. Elle a duré onze minutes. {chute} | In {annee}, you started a trend {lieu}: {attr_A} with {attr_B}. It lasted eleven minutes. {chute} |
| 34 | {B} a déjà lu l'avenir de {A} dans une étiquette d'entretien : « Laver à froid. Ne pas revivre. » Vous l'avez revécu quand même. | {B} once read {A}'s future in a care label: "Wash cold. Do not relive." You relived it anyway. |
| 35 | Vos chemins se sont croisés exactement 14 fois {lieu}. La quinzième, c'est ce soir. {chute} | Your paths crossed exactly 14 times {lieu}. The fifteenth is tonight. {chute} |
| 36 | {A} et {B} faisaient partie de la même guilde en {annee}. Spécialité : les soldes de fin de saison. {chute} | {A} and {B} were in the same guild in {annee}. Speciality: end-of-season sales. {chute} |
| 37 | En {annee}, {lieu}, {A} a crié « C'est mon dernier ! » et {B} a répondu « Moi aussi ! ». Vous parliez de verres. Ou de jeans. {chute} | In {annee}, {lieu}, {A} yelled "This is my last one!" and {B} answered "Mine too!". You were talking about drinks. Or jeans. {chute} |
| 38 | Ce n'est pas la première fois que vous vous scannez. En {annee}, c'était avec un code-barres, {lieu}. {chute} | This isn't the first time you've scanned each other. In {annee}, it was with a barcode, {lieu}. {chute} |
| 39 | {A} a offert {attr_A} à {B} en {annee}. Le cadeau a été revendu le lendemain, avec profit. {chute} | {A} gave {attr_A} to {B} in {annee}. The gift was resold the next day, at a profit. {chute} |
| 40 | Votre première rencontre a eu lieu {lieu}, en {annee}. La deuxième, ce soir. Entre les deux : {attr_A}, {attr_B} et une boucle temporelle. {chute} | Your first meeting was {lieu}, in {annee}. The second, tonight. In between: {attr_A}, {attr_B} and a time loop. {chute} |

### 3.5 Souvenirs d'origine des jumeaux ([RG-006-7](fonctionnalites/faux-souvenirs.md))
Ils sont plus longs et s'affichent au moment des retrouvailles. `{C}` désigne le troisième membre des triplés.

| # | FR | EN |
|---|----|----|
| J-1 | Vous venez du même rouleau d'étiquettes, imprimé en {annee}, {lieu}. Même taille, même prix, même code-barres à un chiffre près. La Matrice a coupé le rouleau en deux pour voir ce qui arriverait. Ce qui arrive, c'est ce soir. | You came off the same roll of tags, in {annee}, {lieu}. Same size, same price, same barcode give or take a digit. The Matrix split you up to see what would happen. What happens is tonight. |
| J-2 | {A} et {B} faisaient partie d'un lot de deux, −50 % sur le second article. Depuis, la question reste ouverte : qui était en solde ? Vous pouvez enfin la régler. | {A} and {B} were sold as a two-pack, 50% off the second one. Since then, each of you has believed you were the discounted one. You can finally settle it. |
| J-3 (triplés) | {A}, {B} et {C} : trois articles identiques, trois rayons différents, une seule étiquette d'origine. Le lot est complet. Ni repris, ni échangé. | {A}, {B} and {C}: three identical items, three different aisles, one original tag. The set is complete. No returns, no exchanges. |

## 4. Vérifications à faire avant la fête
- Relire un échantillon de 50 souvenirs générés, dans les deux langues ([CA-006-3](fonctionnalites/faux-souvenirs.md)).
- Vérifier qu'aucun gabarit n'accorde un mot avec le genre d'un joueur ou d'un attribut.
- Vérifier que les noms de lieux réels (Laval, Galeries d'Anjou, Costco, Dollarama) restent utilisés sur le ton de la blague, sans rien de dénigrant.
