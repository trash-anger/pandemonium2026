# FEAT-002 : Scan (appareil photo et scanner intégré)

[← Fonctionnalités](README.md)

**Statut :** Confirmé · **Sources :** S1, S3

## Objectif
Permettre de scanner une étiquette **de deux façons** : avec l'appareil photo natif du téléphone (premier contact) et avec un **scanner intégré à l'app**. Le scanner intégré garde le joueur dans le même navigateur, ce qui préserve son personnage ([FEAT-019](recuperation.md)). Il permet aussi d'utiliser la **lampe de poche** et de prendre la photo du mur ([FEAT-017](mur-deja-vu.md)).

## Utilisateurs
Tous.

## Déclencheurs
- Ouverture de `https://p.uyt.re/<code>` depuis n'importe quel lecteur de QR.
- Bouton « Scanner » dans l'app.
- Saisie manuelle du code court.

## Parcours nominal (scanner intégré)
1. Le joueur touche « Scanner ».
2. Au premier usage, l'app explique pourquoi elle demande l'accès à la caméra, puis le demande.
3. La vue caméra s'ouvre. Un bouton **lampe** s'affiche quand le téléphone le permet.
4. Le QR est détecté. L'app vérifie qu'il pointe vers une URL du jeu.
5. L'app capture une image basse qualité pour le mur ([FEAT-017](mur-deja-vu.md)), puis traite le scan.

## Variantes et erreurs
| Cas | Comportement attendu | Statut |
|-----|----------------------|--------|
| QR étranger au jeu | Message humoristique (« Cet article ne vient pas de notre collection »). Aucune navigation. | Proposition |
| Caméra refusée | Repli sur la saisie du code court, avec une explication pour réactiver l'accès. | Proposition |
| Lampe non disponible (navigateur iOS, par exemple) | Bouton masqué ; on suggère d'allumer la lampe d'un autre téléphone. | Hypothèse (support variable selon le navigateur, [CT-010](../contraintes-techniques.md#ct-010)) |
| Hors ligne | Le scan est mis en file d'attente puis synchronisé ([FEAT-021](pwa-hors-ligne.md)). | Confirmé (S3 : « ne prenons pas de risque ») |
| Code court inexistant | « Article introuvable. Vérifie l'étiquette. » | Proposition |
| QR ouvert dans un navigateur intégré (Instagram, Snapchat…) | Bandeau qui invite à ouvrir dans le navigateur principal. | Proposition ([FEAT-019](recuperation.md)) |

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-002-1 | Un scan fait dans l'app et un scan fait par le QR externe ont **les mêmes effets de jeu**. | Hypothèse |
| RG-002-2 | Le jeu **incite** à installer l'app et à activer la caméra (récompense, badge ou bonus). | Confirmé (S3 : « On incite ») ; nature de l'incitation : [Q-009](../questions-ouvertes.md#q-009) |
| RG-002-3 | Le traitement du scan suit l'arbre de décision du [parcours §1](../parcours.md#1-vue-densemble--la-soirée-dun-joueur). | Confirmé |
| RG-002-4 | Les scans répétés du même couple dans un court délai sont limités (voir [RG-005-3](rescan-deja-vu.md)). | Proposition |

## Données
**Crée :** `Scan` ([données](../donnees.md#scan)), et éventuellement `PhotoScan`.

## Interface
Chargement : animation « lecture de l'étiquette… » de moins de 1 s. Succès : vibration courte (Android) et transition vers le résultat. Erreur : voir le tableau des variantes.

## Critères d'acceptation
- **CA-002-1 :** Étant donné l'app ouverte avec la caméra autorisée, quand un QR du jeu est cadré, alors le résultat s'affiche sans autre action.
- **CA-002-2 :** Étant donné un QR d'un autre site, alors aucune navigation n'a lieu.
- **CA-002-3 :** Saisir le code court produit exactement le même résultat qu'un scan.
- **CA-002-4 :** Étant donné un téléphone hors ligne, quand on scanne, alors le scan est conservé et envoyé au retour du réseau, sans doublon.
