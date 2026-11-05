# FEAT-013 : Missions éclair

[← Fonctionnalités](README.md)

**Statut :** Confirmé · **Sources :** S2, S3 (« excellent ! »), S10

## Objectif
Relancer l'activité par de **courts défis limités dans le temps**, annoncés à tous.

## Missions personnelles
En plus des missions globales, le MJ peut confier une **mission à un seul joueur** qui vient de le scanner ([ADM-19](admin.md), Confirmé, S10). Le catalogue est dans la fiche admin ; ces missions font partie du périmètre de samedi.

## Exemples de missions globales (Proposition, S2)
- « Scanne 3 personnes en 5 minutes. »
- « Scanne quelqu'un dont l'emoji est 🧛. »
- « Scanne quelqu'un qui porte un masque ET du maquillage. » Ce défi repose sur les attributs de [FEAT-003](personnage.md).
- « Fais-toi rescanner par ta première rencontre. » Voir [RG-005-7](rescan-deja-vu.md).
- « Solde éclair : chaque scan compte double pendant 3 minutes. »

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-013-1 | Une mission a un titre, une condition vérifiable par le serveur, une durée et une récompense. | Proposition |
| RG-013-2 | Les missions sont lancées par le MJ ([FEAT-020](admin.md)) ou programmées à l'avance. | Proposition |
| RG-013-3 | Elles sont annoncées par bannière dans l'app et par notification ([FEAT-016](notifications.md)). | Hypothèse |
| RG-013-4 | Une seule mission globale est active à la fois. | Proposition |

## Critères d'acceptation
- **CA-013-1 :** Étant donné une mission active, quand la condition est remplie avant l'échéance, alors la récompense est attribuée une seule fois.
- **CA-013-2 :** Étant donné une mission expirée, alors aucun progrès n'est plus comptabilisé.
