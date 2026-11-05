# Barème et équilibrage

[← Index](../README.md)

> **Statut : Confirmé** (valeurs validées par Florian, S9, [DEC-079](decisions.md#dec-079)). Toutes les valeurs sont **réglables depuis l'admin** pendant la soirée ([FEAT-020](fonctionnalites/admin.md)), par **préréglages** ou, en dernier recours, valeur par valeur (§0). Elles sont calibrées pour **350 joueurs** ([DEC-019](decisions.md#dec-019)).

## 0. Préréglages (Confirmé, S9)
Les invités de Pandémonium **se connaissent relativement bien** : le jeu risque d'aller vite (S9). Le préréglage **« Rapide »** est donc celui de départ. Le MJ passe d'un préréglage à l'autre en un toucher ; le serveur peut lui en suggérer un par notification (§6).

| Réglage | Lent | Normal | **Rapide (départ)** | Très rapide |
|---------|------|--------|---------------------|-------------|
| Nouvelles cartes attendues par joueur | 8 | 15 | 25 | 40 |
| Seuils des paliers P-1 à P-5 | 150 / 600 / 1 200 / 2 000 / 3 000 | 250 / 1 000 / 2 000 / 3 500 / 5 000 | 500 / 2 000 / 4 000 / 6 500 / 9 000 | 800 / 3 000 / 6 000 / 10 000 / 14 000 |
| Contribution d'un rescan compté | 0,5 | 0,25 | 0,25 | 0,1 |
| Rescans par heure avant perte de souvenirs | 15 | 10 | 10 | 8 |
| Seuil Boucle infinie (rescans comptés) | 15 | 20 | 30 | 40 |
| Seuil Fantôme (scanneurs distincts) | 10 | 15 | 25 | 35 |
| Probabilité de transmission du glitch | 70 % | 60 % | 60 % | 50 % |

**Champ libre (dernier recours) :** si les estimations sont complètement à côté de la plaque, chaque valeur de ce barème peut être saisie à la main dans l'admin. Un bouton « Revenir au préréglage » annule les saisies manuelles. Les autres sections donnent les valeurs du préréglage **Normal** ; les paliers suivent le préréglage actif.

## 1. Quête collective ([FEAT-009](fonctionnalites/quete-collective.md))

### 1.1 Contribution
| Action | Contribution |
|--------|--------------|
| Nouvelle carte (A scanne B pour la première fois) | 1 connexion |
| Rescan compté (au plus un toutes les 5 min par paire) | 0,25 |
| Retrouvailles de jumeaux | 5 |
| Multiplicateur multi-faction | ×1 ; ×1,25 ; ×1,5 selon 1, 2 ou 3 factions |
| Surconsommation | ×0,5 |
| Légendaire L-5 « Bon de réduction −100 % » | ×2 sur les 3 nouvelles cartes suivantes |

Estimation : 350 joueurs × 15 nouvelles cartes ≈ **5 000 connexions** pour une soirée réussie.

### 1.2 Paliers
| Palier | Seuil | Effet pour tous |
|--------|-------|-----------------|
| P-1 | 250 | « Solde éclair » : pendant 5 min, chaque nouvelle carte compte double |
| P-2 | 1 000 | Glitch global de 5 s et message « La Matrice a remarqué votre soirée » |
| P-3 | 2 000 | Un indice bonus pour tous les jumeaux pas encore réunis |
| P-4 | 3 500 | Deuxième « Solde éclair » de 5 min |
| P-5 | 5 000 | Image de la révélation **complète** |

**Lien avec la révélation (proposition) :** l'image cachée de la constellation se dessine d'autant plus nettement que la salle a franchi de paliers. À 5 paliers, elle est complète ; à 2 paliers, elle reste floue et partielle. Tout le monde a ainsi une raison de faire avancer la quête.

## 2. Points de faction ([FEAT-011](fonctionnalites/factions.md))
Un joueur rapporte des points à **chacune** de ses factions ([RG-011-4](fonctionnalites/factions.md)).

| Action | Points |
|--------|--------|
| Nouvelle carte, pour le scanneur | +10 |
| Être scanné pour la première fois par quelqu'un, pour le scanné | +5 |
| Bonus inter-faction : scanneur et scanné n'ont aucune faction en commun | +5 au scanneur |
| Rescan compté, pour le scanneur | +2 |
| Retrouvailles de jumeaux, pour chaque membre | +50 |
| Série complète | +30 |
| Légendaire obtenue | +15 |
| Contaminer quelqu'un, pour un chat noir | +5 |
| Surconsommation | −50 % sur tous les gains suivants |

Le score d'une faction est la somme des points de ses membres ; un classement par faction montre aussi le **score moyen par membre**, pour ne pas avantager la faction la plus nombreuse.

## 3. Mémoire et rôles gagnés ([FEAT-005](fonctionnalites/rescan-deja-vu.md))
Chaque joueur a une **jauge de souvenirs** qui part de **10** ([DEC-031](decisions.md#dec-031)).

| Règle | Valeur |
|-------|--------|
| Rescan reçu (compté) | +1 souvenir pour le scanné |
| Rescans faits au-delà de 10 dans l'heure glissante | −1 souvenir par rescan |
| Jauge sous 5 | La moitié des faux souvenirs du joueur deviennent flous (`▒▒▒`) |
| Jauge à 0 | Tous ses faux souvenirs sont flous ; badge « Amnésie » |
| Jauge remonte au-dessus de 5 | Les souvenirs redeviennent lisibles |

| Rôle gagné | Condition |
|-----------|-----------|
| **Boucle infinie** | Au moins 20 rescans comptés faits dans la soirée |
| **Célébrité** | Top 10 des joueurs scannés par le plus de personnes distinctes ; badge global et un badge par faction ([RG-011-7](fonctionnalites/factions.md)) |
| **Fantôme** | Scanné par au moins 15 personnes distinctes, avec au plus 0,3 nouvelle carte faite par carte reçue |

## 4. Contagion ([FEAT-008](fonctionnalites/chat-noir.md))
Valeurs déjà décidées ([DEC-029](decisions.md#dec-029)), rappelées ici : transmission 60 % ; corruption 10 min ; immunité 80 % (20, 40 ou 60 min) ; 1 chat noir pour 50 joueurs ; au-delà de 50 % de corrompus, −1 min de corruption par tranche de 5 points, minimum 3 min.

## 5. Temps d'écran ([FEAT-015](fonctionnalites/badges-classements.md))
Le temps d'écran **ne rapporte aucun point** : il est seulement révélé à la fin. Le jeu ne doit pas récompenser le fait de rester sur son téléphone, puisqu'il le critique.

## 6. Signaux et suggestions au MJ (Confirmé, S9)
Le serveur compare l'activité réelle à la **courbe attendue du préréglage actif**, toutes les 10 min. Quand un signal se déclenche, il envoie au MJ une **notification push** avec une suggestion ; toucher la notification ouvre l'admin sur la suggestion, applicable en un toucher. Le serveur **n'applique jamais rien tout seul**. Au plus une suggestion toutes les 15 min.

| Signal dans la frise d'activité | Suggestion envoyée au MJ |
|---------------------------------|--------------------------|
| Connexions au-dessus de 2 fois la courbe attendue | Passer au préréglage plus rapide |
| Connexions sous la moitié de la courbe attendue | Passer au préréglage plus lent |
| Prochain palier atteint plus de 45 min avant l'heure prévue | Passer au préréglage plus rapide |
| Plus de 50 % de corrompus pendant plus de 20 min | Baisser la probabilité de transmission de 10 points |
| Moins de 10 % de corrompus après 1 h | Relancer un foyer |
| Plus de rescans que de nouvelles cartes pendant 30 min | Réduire la contribution des rescans à 0,1 |

Exemple de notification : « Les connexions vont 2,3 fois plus vite que prévu. Passer au préréglage Très rapide ? »
