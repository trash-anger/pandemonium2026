# Glossaire

[← Index](../README.md)

Ces termes sont définis ici et nulle part ailleurs.

| Terme | Définition | Statut |
|-------|------------|--------|
| **Étiquette** | Objet physique : fausse étiquette de vêtement qui porte un QR code et un code court. Chaque étiquette a un **identifiant unique**. | Confirmé (S1, S3) |
| **Code court** | Identifiant lisible imprimé sous le QR, par exemple `7KC3`. Il sert de secours si le scan échoue. | Confirmé (S3) |
| **URL d'étiquette** | URL encodée dans le QR, de la forme `https://p.uyt.re/<code>`. Le sous-domaine `p` est l'exemple donné par Florian. | Confirmé (S3, S5 : `p.uyt.re`) |
| **Étiquette vierge** | Étiquette qui n'a encore jamais été réclamée ; elle devient jouable dès qu'on la scanne. | Confirmé (S1, S7) |
| **Réclamer** | Lier une étiquette vierge à un nouveau personnage, au premier scan. | Confirmé (S1) |
| **Personnage** | Identité de jeu d'un joueur : pseudo, emoji, description de costume, classe… Il est lié à **une ou plusieurs** étiquettes, chacune avec sa faction. | Confirmé (S3, S5) |
| **Spectateur** | Personne sans étiquette qui scanne : elle voit les cartes, sans score ni faction, et est invitée à trouver le MJ. | Confirmé (S5) |
| **PIN** | Code à 4 chiffres choisi à la création, qui permet de réintégrer le jeu depuis un autre navigateur. | Confirmé (S5) |
| **Joueur actif** | Personne qui possède déjà un personnage sur son appareil. | Hypothèse |
| **Appareil** | Navigateur ou PWA d'un téléphone, identifié par un jeton local. | Proposition |
| **Scan** | Lecture d'une étiquette par un joueur, depuis l'appareil photo du téléphone ou depuis le scanner intégré à l'app. | Confirmé (S1, S3) |
| **Collection** | Ensemble des personnages distincts qu'un joueur a scannés. | Confirmé (S1) |
| **Carte** | Fiche d'un personnage telle qu'elle apparaît dans la collection d'un autre joueur. | Confirmé (S1 : « carte de collection ») |
| **Rescan / Déjà vu** | Scan d'un personnage déjà présent dans sa collection. Il incrémente un compteur et peut donner des badges. | Confirmé (S1, S3) |
| **Faux souvenir** | Phrase absurde, déterministe pour une paire de personnages, générée par gabarits. | Confirmé (S1, S3) |
| **Jumeaux / Triplés** | Groupe de 2 ou 3 **joueurs** (pas d'étiquettes) formé par le serveur pendant la soirée. Ils doivent se retrouver. | Confirmé (S5, S6) |
| **Retrouvailles** | Scan **mutuel** de deux membres d'un même groupe de jumeaux dans une fenêtre de temps courte. | Confirmé (S3) |
| **Chat noir** | Rôle secret d'un joueur, qui en est prévenu : il fait glitcher et contamine ceux qu'il croise par un scan ; 1 pour 50 joueurs. | Confirmé (S1, S5, S7) |
| **Achat compulsif** | Badge obtenu en ajoutant une étiquette à son personnage. | Confirmé (S7) |
| **Surconsommation** | État d'un personnage à plus de 3 étiquettes, avec de lourds malus. | Confirmé (S7) |
| **Mélange** | Redistribution au hasard, toutes les 20 min, des effets légendaires et pièges entre les étiquettes du MJ. | Confirmé (S7) |
| **Carte légendaire** | Effet spécial porté par une étiquette du MJ (10 effets) ; on collectionne l'effet. | Confirmé (S5, S6, S7) |
| **Piège** | Effet porté par une étiquette du MJ qui bloque le scanner pendant 1 à 5 min (5 effets). | Confirmé (S5, S7) |
| **Temps d'écran** | Temps passé sur l'app au premier plan, révélé à chacun à la fin. | Confirmé (S3, S6) |
| **Glitch contagieux** | État « corrompu » transmis par les scans à partir d'un chat noir. | Confirmé (S3) |
| **Tué dans l'œuf** | Scan d'une étiquette vierge, qui n'est pas la sienne, par un joueur actif. Le scanneur gagne le badge « Tueur de poussin » ; l'étiquette reste réclamable. | Confirmé (S3, S5) |
| **Boucle infinie** | Joueur qui rescanne beaucoup. Il perd des souvenirs. | Confirmé (S3, S5) |
| **Célébrité** | Joueur très scanné par les autres. Il accumule des souvenirs. | Confirmé (S3) |
| **Fantôme** | Joueur très scanné qui scanne peu lui-même. Il accumule des souvenirs. | Confirmé (S3, S5) |
| **Faction** | L'une des 5 équipes inspirées de D&D et de la consommation, choisie pour chaque étiquette ; 3 au maximum par personnage. | Confirmé (S3, S5, S7) |
| **Série** | Ensemble d'étiquettes à collectionner au complet pour obtenir un bonus ; invisible jusqu'au scan. | Confirmé (S3, S5) |
| **Rareté** | Niveau d'une étiquette : commune, rare ou légendaire. | Proposition (S2), cohérente avec S1 |
| **Quête collective** | Progression commune à tous les joueurs, découpée en paliers et conclue par une révélation finale. | Confirmé (S1, S3) |
| **Palier** | Seuil de la quête collective qui débloque un événement pour tous. | Confirmé (S3) |
| **Révélation finale** | Affichage simultané, à 5 h, de l'image collective de la soirée et du temps d'écran de chacun. | Confirmé (S1, S5, S6) |
| **Mission éclair** | Défi court, limité dans le temps, annoncé à tous. | Confirmé (S3) |
| **Mur « Déjà vu ! »** | Mosaïque des photos basse qualité prises lors des scans faits dans l'app. | Confirmé (S3) |
| **Maître du jeu (MJ)** | Florian, qui dispose du panneau d'administration. | Confirmé (S3) |
