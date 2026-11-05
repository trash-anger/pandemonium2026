# FEAT-005 : Rescan « Déjà vu », boucles et mémoire

[← Fonctionnalités](README.md)

**Statut :** Confirmé · **Sources :** S1, S2 (paliers proposés), S3 (« C'est génial ! J'adore tout ! »), S5

## Objectif
Revoir quelqu'un est **le cœur du thème**. Scanner de nouveau une personne affiche « Déjà vu. » avec un compteur. Ce n'est pas une erreur, c'est un **badge** (S1).

## Parcours nominal
1. A scanne B alors que B est déjà dans sa collection.
2. L'écran affiche « **Déjà vu ×N** » avec une animation de boucle.
3. Si N atteint un palier, un easter egg ou un badge se débloque.
4. **Au premier rescan de sa soirée**, A reçoit une invitation : *« Va rescanner la personne qui a le plus marqué ta mémoire. »* (Confirmé, S3.)

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-005-1 | Un compteur de rescans existe **par paire orientée** (A→B). | Confirmé (S1) ; orientation : Hypothèse |
| RG-005-2 | Paliers d'easter eggs : ×3 « Boucle détectée », ×6 « Jour de la marmotte », ×13 secret. | Confirmé (proposés en S2, approuvés en S3 : « J'adore tout ») ; contenu : [textes §2](../textes.md#2-easter-eggs-de-rescan-rg-005-2), validé par Florian ([DEC-032](../decisions.md#dec-032)) |
| RG-005-3 | Un rescan ne compte qu'**une fois par fenêtre de 5 minutes** pour une même paire. | Confirmé (S2 → S3) ; valeur ajustable par le MJ (Proposition) |
| RG-005-4 | Certaines étiquettes peuvent avoir des easter eggs propres, déclenchés après N rescans de ce badge précis. | Confirmé (S1 : « mettre des easter egg si tu scannes un certain nombre de fois certains badges ») |
| RG-005-5 | Une **Boucle infinie** (joueur qui rescanne beaucoup) **perd des souvenirs**, selon la proposition ci-dessous. | Confirmé (S3, S5) ; valeurs : [barème §3](../bareme.md#3-mémoire-et-rôles-gagnés) |
| RG-005-6 | Une **Célébrité** ou un **Fantôme** (joueur très rescanné) **accumule des souvenirs**. | Confirmé (S3, S5) |
| RG-005-7 | Mission « Fermer la boucle » : en fin de soirée, rescanner la toute première personne scannée. | Confirmé (S2 → S3) ; « fin de soirée » = à partir d'une heure avant la révélation (4 h) : Proposition |
| RG-005-8 | Un rescan compté alimente la quête collective, environ un quart d'un nouveau scan. | Confirmé (S5, [DEC-032](../decisions.md#dec-032)) |

> **Modèle retenu ([DEC-031](../decisions.md#dec-031)).** Un « souvenir » serait une unité de score (une jauge de mémoire). La Boucle infinie perd 1 souvenir par rescan au-delà de X dans l'heure. Le joueur rescanné gagne 1 souvenir par rescan reçu. Les **faux souvenirs** déjà obtenus deviendraient flous (texte partiellement effacé, `▒▒▒`) au lieu d'être supprimés. Les valeurs de X restent des propositions, réglables dans l'admin.

## Interface
« Déjà vu » doit se distinguer visuellement d'un nouveau scan : boucle, écho, répétition du texte. Il faut respecter la préférence de réduction des animations ([REQ-003](../exigences-transversales.md#req-003)).

## Critères d'acceptation
- **CA-005-1 :** Étant donné B dans la collection de A, quand A scanne B, alors le compteur A→B augmente de 1 et aucune carte n'est ajoutée.
- **CA-005-2 :** Étant donné un rescan A→B compté à t, quand A rescanne B à t+2 min, alors le compteur ne change pas ; l'écran « Déjà vu » s'affiche quand même.
- **CA-005-3 :** Étant donné un compteur qui atteint 3, alors l'easter egg « Boucle détectée » s'affiche une seule fois.
- **CA-005-4 :** Au premier rescan de la soirée de A, l'invitation « personne qui t'a le plus marqué » s'affiche une seule fois.
