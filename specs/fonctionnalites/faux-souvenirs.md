# FEAT-006 : Faux souvenirs

[← Fonctionnalités](README.md)

**Statut :** Confirmé · **Sources :** S1 (« Bonne idée ! »), S3 (enrichissement par le costume)

## Objectif
Chaque scan entre deux personnes génère un **souvenir commun absurde**, comme *« Vous vous êtes déjà rencontrés en 1997, dans un lave-auto à Laval. Tu portais une cape. »* Ça fait rire, ça brise la glace et ça donne envie de faire des captures d'écran (S1).

## Règles métier
| ID | Règle | Statut |
|----|-------|--------|
| RG-006-1 | Le souvenir d'une paire est **toujours le même** pour cette paire. | Confirmé (S1) |
| RG-006-2 | Il est produit par **gabarits combinés, sans IA**. | Confirmé (S1) |
| RG-006-3 | Le gabarit utilise les **attributs de costume** des deux personnages : catégorie, couleur, masque, maquillage, accessoires… | Confirmé (S3) |
| RG-006-4 | La paire n'est **pas orientée** : A×B et B×A donnent le même souvenir. | Hypothèse |
| RG-006-5 | Le choix des éléments est déterministe, calculé à partir des identifiants de la paire triés. | Proposition (implémentation) |
| RG-006-6 | Les gabarits mélangent les univers [Déjà vu, mode, D&D et Matrix](../univers-et-ton.md), et le NSFW soft est permis. | Confirmé (S3) |
| RG-006-7 | Les retrouvailles de jumeaux produisent un souvenir **spécial**, plus long ([FEAT-007](jumeaux.md)). | Proposition (S2) |
| RG-006-8 | Un souvenir peut devenir « flou » selon [RG-005-5](rescan-deja-vu.md). | À préciser ([Q-012](../questions-ouvertes.md#q-012)) |

## Structure de gabarit (Proposition)
`Vous vous êtes rencontrés en {année} {lieu}. {détail_A} {détail_B} {chute}`

| Emplacement | Exemples | Source des variations |
|-------------|----------|----------------------|
| `{année}` | 1987 à 2019 | hash de la paire |
| `{lieu}` | « dans un lave-auto à Laval », « en file au Boxing Day », « dans une taverne de Baldur's Gate » | hash de la paire |
| `{détail_A}` | « Tu portais déjà ce masque. » | attributs de A |
| `{détail_B}` | « L'autre avait du maquillage vert, mais en solde. » | attributs de B |
| `{chute}` | « Personne n'en a jamais reparlé. » | hash de la paire |

Le nombre de gabarits nécessaire pour éviter les répétitions visibles reste **À préciser** ([Q-017](../questions-ouvertes.md#q-017)).

## Propositions non validées (S2)
- **Ta vie antérieure :** en fin de soirée, tous les souvenirs d'un joueur forment une biographie chronologique.
- **Effet Mandela :** le même souvenir diffère d'un détail selon celui qui le lit.

## Critères d'acceptation
- **CA-006-1 :** Pour la même paire, deux affichages, même sur deux appareils, produisent le même texte, sauf l'effet Mandela s'il est retenu.
- **CA-006-2 :** Deux paires différentes ont une probabilité faible d'obtenir le même texte (seuil : [Q-017](../questions-ouvertes.md#q-017)).
- **CA-006-3 :** Tout texte généré est grammaticalement correct quels que soient les attributs (genre, accords). Une revue d'un échantillon de 50 souvenirs est requise.
