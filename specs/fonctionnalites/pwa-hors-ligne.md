# FEAT-021 : Installation (PWA), cache et résilience réseau

[← Fonctionnalités](README.md)

**Statut :** Confirmé · **Sources :** S2, S3, S6

## Objectif
- Inciter à **installer l'app** sur l'écran d'accueil (S3 : « On incite pour que le monde accepte d'installer l'app »).
- Rester jouable si le réseau de la salle faiblit. D'après Florian, le réseau « n'est pas si mal, mais ne prenons pas de risque » : il faut **mettre un maximum sur un CDN, puis en cache sur le téléphone** (S3).

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-021-1 | Toutes les ressources statiques sont servies par un CDN. | Confirmé (S3) |
| RG-021-2 | Toutes les ressources statiques sont mises en cache sur le téléphone dès la première visite (service worker). | Confirmé (S3) |
| RG-021-3 | Les scans faits hors ligne sont mis en file d'attente et synchronisés **sans doublon**, de façon idempotente. | Proposition |
| RG-021-4 | Le service worker sert l'interface d'une URL d'étiquette même hors ligne, puis traite le scan au retour du réseau. | Proposition |
| RG-021-5 | L'installation sur l'écran d'accueil est récompensée par le badge « Téléporteur installé » (BDG-4) et un bonus de score ([FEAT-015](badges-classements.md)). Elle conditionne aussi les notifications iOS ([CT-008](../contraintes-techniques.md#ct-008)). | Confirmé (S5) |
| RG-021-7 | Le stockage local (cookies, localStorage, cache) ne sert qu'à **faciliter le jeu en cas de mauvais réseau**. Toutes les données sont envoyées au cloud dès que possible ; le serveur est la source de vérité. | Confirmé (S6, [DEC-052](../decisions.md#dec-052)) |
| RG-021-6 | Un indicateur discret est affiché : « N scans en attente de synchronisation » s'il y a des scans en file, sinon « Hors ligne » quand le réseau manque. | Confirmé (Florian, 5 nov.) |

## Critères d'acceptation
- **CA-021-1 :** Étant donné une première visite réussie, quand le téléphone passe en mode avion et qu'on rouvre l'app, alors l'interface et la collection s'affichent.
- **CA-021-2 :** Étant donné 3 scans faits hors ligne, quand le réseau revient, alors exactement 3 scans sont enregistrés côté serveur.
- **CA-021-3 :** Le premier chargement respecte [REQ-006](../exigences-transversales.md#req-006).
