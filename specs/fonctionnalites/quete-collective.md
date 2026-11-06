# FEAT-009 : Quête collective, paliers et révélation finale

[← Fonctionnalités](README.md)

**Statut :** Confirmé · **Sources :** S1, S3 (« c'est génial !!! »), S5, S6, S7

## Objectif
Chaque scan fait avancer une **quête commune**. Tout le monde **a conscience de l'avancement global** (S1). Des **paliers** débloquent des événements pour tous, et une **révélation finale** à heure fixe montre l'image collective de la soirée.

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-009-1 | La progression globale est **visible par tous, en temps réel** ou presque. | Confirmé (S1) |
| RG-009-2 | Unité de progression : nombre de **paires uniques** (connexions) de la soirée ; un rescan compté vaut environ un quart de connexion. La contribution d'un joueur est multipliée par 1,25 par faction supplémentaire ([RG-011-5](factions.md)), et divisée par 2 en surconsommation ([RG-003-10](personnage.md)). | Proposition ; rescans : Confirmé (S5, [DEC-032](../decisions.md#dec-032)) |
| RG-009-3 | Des **paliers collectifs** débloquent des événements pour tous. Les effets ne doivent pas contredire le calendrier fixe des jumeaux (indices toutes les 10 min, groupes complets à 2 h) ni le nombre de chats noirs (1 pour 50 joueurs). Seuils et effets : voir le [barème](../bareme.md#12-paliers). | Confirmé (principe, S2 → S3) ; valeurs : Proposition (S8) |
| RG-009-4 | À une **heure fixe**, la révélation apparaît chez **tout le monde** : **5 h**, fin du jeu à 6 h. Le MJ peut la déclencher ou la décaler depuis l'admin. | Confirmé (S5, [DEC-018](../decisions.md#dec-018)) |
| RG-009-5 | L'image révélée est la **constellation de toutes les connexions** de la soirée, avec le nœud du joueur en surbrillance. | Confirmé (S2 → S3 « génial ») |
| RG-009-6 | La constellation se **réorganise pour former un dessin ou une phrase cachée** (variante S1). Proposition : l'image est d'autant plus nette que la salle a franchi de paliers. | Confirmé (S5, [DEC-033](../decisions.md#dec-033)) ; image : Florian la définira plus tard (S8) |
| RG-009-7 | Affichage sur un écran ou projecteur de la salle. | **Abandonné** : pas d'écran ([DEC-046](../decisions.md#dec-046)) |
| RG-009-9 | La révélation montre aussi, si possible, une mosaïque des **photos autorisées** par leurs auteurs ([FEAT-017](mur-deja-vu.md)), dans les limites du free tier ou d'un coût estimé à l'avance. | Confirmé (S5, S7) |
| RG-009-11 | **Compte à rebours** : 30 min avant la révélation, une annonce et un compteur apparaissent dans le jeu. Une fois la révélation passée, la fin du jeu est annoncée avec un compteur jusqu'à 6 h. | Confirmé (S7, [DEC-068](../decisions.md#dec-068)) |
| RG-009-13 | **Graphe de la révélation** dessiné avec D3.js (`d3-force` pour la disposition, `d3-zoom` pour le zoom), rendu en Canvas. Les positions finales, y compris la transformation en dessin, sont **calculées une seule fois côté serveur** juste avant 5 h et envoyées à tous : chacun voit la même image au même moment, et les téléphones ne font qu'animer. Les modules sont mis en cache avant 4 h 30. | Proposition (S9) |
| RG-009-14 | Sur chaque téléphone, le **point du joueur** est mis en valeur (plus gros, lumineux, avec son emoji et « TOI ») ; ses connexions s'allument, le reste s'atténue ; le lien avec son jumeau retrouvé est en pointillés dorés ; la caméra zoome sur lui puis dézoome sur l'image entière. | Proposition (S9) |
| RG-009-15 | Le graphe est **zoomable** (pincer, glisser, double-toucher), de la vue entière à ×8 environ. Les détails apparaissent avec le zoom : traits et points de loin, emoji de costume en zoomant, pseudos au plus près. Boutons « Me retrouver » et « Vue d'ensemble » ; toucher un point affiche la carte du joueur. Le graphe reste explorable en mode lendemain. | Proposition (S9) |
| RG-009-17 | **Mise en œuvre (LOT-3)** : le serveur fige un instantané (personnages, connexions, faction de rattachement, image cachée, paliers franchis) avec les seules données d'avant l'heure de révélation, une fois par heure de révélation. La disposition d3-force est calculée sur chaque téléphone, pas sur le serveur (10 ms de CPU par requête sur le free tier) ; elle reste identique partout : positions de départ issues d'un hachage, générateur pseudo-aléatoire fixe de d3, opérations IEEE seulement. Part des joueurs aimantés selon les paliers : 10, 30, 50, 70, 85, 100 %. L'image cachée est saisie dans l'admin (phrase ou image), stockée en base, jamais dans le dépôt ; repli : « DÉJÀ / VU ! ». | Proposition (LOT-3) |
| RG-009-16 | Le dessin se forme en aimantant chaque joueur vers un point échantillonné dans l'image cachée ; la part de joueurs aimantés dépend du nombre de paliers franchis. Aucun visage n'est affiché : seulement emoji et pseudos. | Proposition (S9) |
| RG-009-12 | La révélation montre chaque joueur multi-factions dans sa faction de rattachement ([RG-011-6](factions.md)). | Confirmé (S7) |
| RG-009-10 | La révélation affiche à chacun son **temps d'écran** de la soirée ([RG-015-5](badges-classements.md)). | Confirmé (S6) |
| RG-009-8 | Les degrés de séparation et les « clans » visibles dans le graphe ([FEAT-010](duel.md)) peuvent colorer la constellation par faction. | Proposition |

## Interface
- Barre de progression globale toujours visible, en en-tête de l'app.
- Toast « Palier atteint ! » chez tout le monde, avec sa description.
- Révélation : plein écran, animation de construction de la constellation, transformation en dessin, puis zoom sur son propre point ; ensuite, vue explorable et zoomable (RG-009-13 à RG-009-16).

## Critères d'acceptation
- **CA-009-1 :** Étant donné deux appareils ouverts, quand un scan crée une nouvelle paire, alors la barre se met à jour sur les deux appareils en moins de N secondes (N : [REQ-007](../exigences-transversales.md#req-007)).
- **CA-009-2 :** Étant donné qu'un palier est franchi, alors son effet est actif pour tous les joueurs et annoncé une seule fois à chacun.
- **CA-009-3 :** Étant donné l'heure de révélation, alors tout appareil ouvert affiche la révélation, et tout appareil qui rouvre l'app ensuite l'affiche à l'ouverture.
