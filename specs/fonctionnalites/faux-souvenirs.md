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
| RG-006-3 | Le gabarit utilise les **attributs de costume** des deux personnages : type de costume et les 12 attributs ([FEAT-003](personnage.md)). | Confirmé (S3, S6) |
| RG-006-4 | La paire n'est **pas orientée** : A×B et B×A donnent le même souvenir. | Hypothèse |
| RG-006-5 | Le choix des éléments est déterministe, calculé à partir des identifiants de la paire triés. | Proposition (implémentation) |
| RG-006-6 | Les gabarits mélangent les univers [Déjà vu, mode, D&D et Matrix](../univers-et-ton.md), et le NSFW soft est permis. | Confirmé (S3) |
| RG-006-7 | Les retrouvailles de jumeaux produisent un souvenir **spécial**, plus long ([FEAT-007](jumeaux.md)). | Proposition (S2) |
| RG-006-9 | Sur l'écran de nouvelle carte, le faux souvenir est l'**élément principal**, affiché en premier et en grand. Au moment de la distribution à un groupe, les membres sont invités à se scanner entre eux pour découvrir leurs premiers faux souvenirs ensemble. | Confirmé (S8) |
| RG-006-8 | Un souvenir peut devenir « flou » selon [RG-005-5](rescan-deja-vu.md). | Confirmé (S5, [DEC-031](../decisions.md#dec-031)) |

## Structure de gabarit (Proposition)
`Vous vous êtes rencontrés en {année} {lieu}. {détail_A} {détail_B} {chute}`

| Emplacement | Exemples | Source des variations |
|-------------|----------|----------------------|
| `{année}` | 1987 à 2019 | hash de la paire |
| `{lieu}` | « dans un lave-auto à Laval », « en file au Boxing Day », « dans une taverne de Baldur's Gate » | hash de la paire |
| `{détail_A}` | « Tu portais déjà ce masque. » | attributs de A |
| `{détail_B}` | « L'autre avait du maquillage vert, mais en solde. » | attributs de B |
| `{chute}` | « Personne n'en a jamais reparlé. » | hash de la paire |

Environ **40 gabarits**, en français et en anglais, rédigés par l'assistant et relus par Florian ([DEC-042](../decisions.md#dec-042)) : voir [textes §3](../textes.md#3-faux-souvenirs). Ton : allusions, rien d'explicite ([DEC-049](../decisions.md#dec-049)).

## Propositions non validées (S2)
- **Ta vie antérieure :** en fin de soirée, tous les souvenirs d'un joueur forment une biographie chronologique.
- **Effet Mandela :** le même souvenir diffère d'un détail selon celui qui le lit.

## Critères d'acceptation
- **CA-006-1 :** Pour la même paire, deux affichages, même sur deux appareils, produisent le même texte, sauf l'effet Mandela s'il est retenu.
- **CA-006-2 :** Deux paires différentes ont une probabilité faible d'obtenir le même texte (seuil proposé : moins de 1 % sur 1 000 paires tirées au hasard).
- **CA-006-3 :** Tout texte généré est grammaticalement correct quels que soient les attributs (genre, accords). Une revue d'un échantillon de 50 souvenirs est requise.
