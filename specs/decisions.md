# Journal des décisions

[← Index](../README.md)

Format : **ID · Décision · Raison · Statut · Source · Exigences liées**. Une décision ne se supprime pas : on la remplace (statut « Remplacée par DEC-xxx »).

| ID | Décision | Raison | Statut | Source | Liens |
|----|----------|--------|--------|--------|-------|
| <a id="dec-001"></a>DEC-001 | Le thème « Déjà vu » guide toutes les mécaniques | Thème officiel de Pandémonium 2026 | Acceptée | S1, S3 | [Univers](univers-et-ton.md) |
| <a id="dec-002"></a>DEC-002 | Les jumeaux sont **configurés en code** et ont des **identifiants distincts** (pas de QR identique imprimé deux fois) | Préférence explicite de Florian | Acceptée | S1 | [FEAT-007](fonctionnalites/jumeaux.md) |
| <a id="dec-003"></a>DEC-003 | Une étiquette vierge est réclamée au premier scan, par la création d'un personnage | Rien à préparer par personne | Acceptée | S1, S3 | [FEAT-003](fonctionnalites/personnage.md) |
| <a id="dec-004"></a>DEC-004 | Les faux souvenirs sont déterministes par paire et produits par gabarits, sans IA | Simplicité, coût, reproductibilité | Acceptée | S1 | [FEAT-006](fonctionnalites/faux-souvenirs.md) |
| <a id="dec-005"></a>DEC-005 | La description de costume se fait sans clavier : catégorie, couleur, booléens | Éviter le décrochage des joueurs | Acceptée | S3 | [FEAT-003](fonctionnalites/personnage.md) |
| <a id="dec-006"></a>DEC-006 | Les retrouvailles exigent un scan mutuel dans une fenêtre courte, avec une animation simultanée | Forcer la rencontre ; ne pas favoriser le premier | Acceptée (la valeur de la fenêtre est ouverte : [Q-018](questions-ouvertes.md#q-018)) | S3 | [RG-007-7](fonctionnalites/jumeaux.md), [RG-007-9](fonctionnalites/jumeaux.md) |
| <a id="dec-007"></a>DEC-007 | QR d'un pouce, URL courte, mat noir sur blanc, code court de secours imprimé | Lisibilité dans le noir | Acceptée | S3 | [FEAT-001](fonctionnalites/etiquettes-impression.md) |
| <a id="dec-008"></a>DEC-008 | Hébergement sur le compte Cloudflare de Florian, sous un sous-domaine de `uyt.re` | Ressources existantes | Acceptée (services précis : [Q-032](questions-ouvertes.md#q-032)) | S1 | [CT-005](contraintes-techniques.md#ct-005), [CT-006](contraintes-techniques.md#ct-006) |
| <a id="dec-009"></a>DEC-009 | Un maximum de ressources passe par un CDN, puis en cache sur le téléphone | Ne prendre aucun risque réseau | Acceptée | S3 | [FEAT-021](fonctionnalites/pwa-hors-ligne.md) |
| <a id="dec-010"></a>DEC-010 | Un scanner QR est intégré à l'app, avec la lampe | Rester dans le même navigateur ; photos du mur | Acceptée | S3 | [FEAT-002](fonctionnalites/scan.md) |
| <a id="dec-011"></a>DEC-011 | Les réactions sont des emoji d'Halloween, en un toucher | Rapidité | Acceptée | S3 | [FEAT-014](fonctionnalites/reactions.md) |
| <a id="dec-012"></a>DEC-012 | Le temps passé dans l'app est mesuré côté client et classé | Demande explicite | Acceptée | S3 | [FEAT-015](fonctionnalites/badges-classements.md) |
| <a id="dec-013"></a>DEC-013 | Le duel D&D n'a lieu qu'avec le consentement des deux joueurs | Respect des joueurs | Acceptée | S3 | [RG-010-6](fonctionnalites/duel.md) |
| <a id="dec-014"></a>DEC-014 | Un panneau d'administration existe pour le MJ | Pilotage en direct | Acceptée (contenu : Proposition) | S3 | [FEAT-020](fonctionnalites/admin.md) |
| <a id="dec-015"></a>DEC-015 | Documentation et code dans un dépôt GitHub public, en démarche SDD | Demande explicite | Acceptée | S3 | [CT-012](contraintes-techniques.md#ct-012), [CT-015](contraintes-techniques.md#ct-015) |
| <a id="dec-016"></a>DEC-016 | Imprimer deux fois le même QR pour les jumeaux | Remplacée par l'approche configurée | **Rejetée** | S1 | DEC-002 |

## Décisions en attente
Elles correspondent aux questions [Q-001](questions-ouvertes.md#q-001) à [Q-033](questions-ouvertes.md#q-033). La plus structurante est [Q-028](questions-ouvertes.md#q-028) (périmètre de samedi).
