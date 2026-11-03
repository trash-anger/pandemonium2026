# Prompt : page teaser `index.html`

> Prompt à retravailler, puis à donner à un agent de développement. Les éléments `[À COMPLÉTER]` sont des informations manquantes ; les éléments `[À AJUSTER]` sont des choix proposés que tu peux modifier.

---

## Rôle

Tu es développeur front-end et concepteur d'expériences web ludiques. Tu écris un **unique fichier `index.html`**, autonome, qui sert de **page teaser** au jeu « Déjà vu ! », joué pendant la fête costumée **Pandémonium** à Montréal.

## Contexte

- **Événement :** Pandémonium, fête costumée montréalaise. Thème 2026 : **« Déjà vu »**.
- **Date :** samedi 7 novembre 2026, `à partir de 21h`, mais probablement difficile à trouver avant minuit, fuseau `America/Toronto`. Début du jeu à 21h en before, mon arrivé à la soirée autour de minuit, mais on ne divulgue pas ces détails.
- **Lieu affiché :** `2875 Rue Hochelaga, Montréal, QC H2K 1K7, Canada`.
- **URL de la page :** `https://pandemonium2026.uyt.re/`, hébergée sur Cloudflare.
- **Le jeu :** il existe, mais il **ne doit pas être expliqué**. La page ne fait que créer le mystère.
- Spécifications complètes du projet, à consulter sans les dévoiler : `README.md` et `specs/`.

## Objectif

**Intriguer.** Les visiteurs arrivent par un **lien partagé sur les réseaux sociaux**. Ils doivent repartir curieux, avec l'envie de venir samedi et d'y chercher quelque chose, sans savoir exactement quoi.

## Niveau de dévoilement : mystère total

**Autorisé :** l'ouverture des soldes ; les rayons vêtements ; un « **responsable des rayons vêtements** » qu'il faudra **absolument rencontrer** pour **entrer dans le monde parallèle** ; le déjà vu ; une Matrice qui bugue.

**Interdit :** mentionner les QR codes, le scan, l'application, la collection, les personnages, les jumeaux, les chats noirs, les rôles, les factions ou la quête collective.

**Le responsable :** on dit seulement qu'il existe et qu'il faut le trouver. **Aucun indice** sur son apparence, son costume ou l'endroit où il se tient.

Le mot « étiquette » peut apparaître, une seule fois de façon ambiguë.

## Récit selon la date (calculé côté client, heure de Montréal)

| Phase | Période | Contenu attendu |
|-------|---------|-----------------|
| **Avant** | jusqu'au début de la fête | Annonce mystérieuse de **l'ouverture des soldes** et **compte à rebours** jusqu'au début. Le responsable des rayons vêtements « vous attend ». Une dernière ligne du type « À samedi. Vous y êtes déjà allés. » |
| **Pendant** | du début à la fin `[À COMPLÉTER : heure de fin]` | « Les soldes sont ouvertes. » Injonction : **trouve le responsable des rayons vêtements**. Pas de compte à rebours ; éventuellement un chronomètre qui monte, ou une boucle. |
| **Après** | après la fin | Ton du lendemain : « Déjà vu. Tu étais là hier soir. Ou pas ? » Remerciement, et teaser d'une suite éventuelle `[À AJUSTER]`. |

Un paramètre d'URL `?phase=avant|pendant|apres` force une phase, pour tester.

## Ton et univers

Mélange humoristique, accessible à tous :
- **Pub de soldes fast fashion** : « Ouverture exceptionnelle », « −70 % sur la réalité », « Dernière démarque », « Ni repris ni échangé ».
- **Bug de la Matrice** : textes qui se répètent, déjà vu, glitchs.
- **Clins d'œil D&D** légers, facultatifs.
- **NSFW soft** autorisé en sous-entendu ; jamais vulgaire ni blessant.

Exemples de phrases, à réécrire librement :
- FR : « Ouverture des soldes. Tout doit disparaître, surtout vos souvenirs. »
- FR : « Le responsable des rayons vêtements vous attend. Il est le seul à connaître la sortie. »
- FR : « Cet article a déjà été vu. Cet article a déjà été vu. »
- EN : “Grand opening sale. Everything must go — especially your memories.”
- EN : “The head of the clothing department is waiting. Only he knows the way out.”

## Interactions

1. **Compte à rebours** (phase « Avant ») jusqu'au début de la fête : jours, heures, minutes, secondes. **Effet déjà vu :** de temps en temps (toutes les 20 à 40 s environ), le compteur **revient en arrière** d'une ou deux secondes, avec un court glitch, puis reprend.
2. **Glitchs légers** sur le titre ou un mot-clé : décalage RGB, répétition. Ils sont **sobres**, ne gênent pas la lecture, ne font jamais plus de 3 flashs par seconde, et sont **désactivés** quand `prefers-reduced-motion` est actif.
3. `[À AJUSTER]` Petit secret facultatif (par exemple, revenir sur la page affiche « Tu es déjà venu ici. »). Le stockage local est entouré de `try/catch` et la page fonctionne sans lui.

**Pas** de formulaire, d'inscription, de collecte de données ni de bouton de notification. L'appel à l'action se résume à « à samedi » et à « trouve le responsable ».

## Langues

- **Bascule FR / EN** visible, en haut de page.
- Langue par défaut : celle du navigateur (français si la langue commence par `fr`, anglais sinon). Le choix manuel est mémorisé si le stockage local est disponible.
- Tous les textes vivent dans un **dictionnaire unique** en JavaScript, facile à retoucher.
- L'attribut `lang` de `<html>` est mis à jour à chaque changement de langue.

## Contraintes techniques

- **Un seul fichier `index.html`**, avec CSS et JS intégrés. Aucun framework, aucune bibliothèque, aucun traqueur ni outil d'analyse, aucun cookie.
- Polices : celles du système, ou **une seule** police Google Fonts `[À AJUSTER]`.
- Poids : **moins de 60 Ko** sans la police.
- **Mobile d'abord** (la plupart des visiteurs viennent d'un lien sur leur téléphone). Mise en page correcte de 320 px à 1440 px, sans défilement horizontal.
- Thème sombre, contraste d'au moins 4,5:1 (WCAG AA).
- Les dates sont calculées pour `America/Toronto`, quel que soit le fuseau du visiteur.

## Partage sur les réseaux

Le lien sera partagé : les balises d'aperçu sont essentielles.
- `<title>`, `meta description`.
- Open Graph : `og:title`, `og:description`, `og:url`, `og:image`, `og:locale` (`fr_CA`, avec `en_CA` en alternative).
- Twitter Card : `summary_large_image`.
- `og:image` : `[À COMPLÉTER : URL absolue d'une image 1200×630 qui ne dévoile rien]`.
- Favicon intégré (SVG en data URI), sur le thème étiquette ou déjà vu.

## Livrables

1. Le fichier `index.html` complet.
2. Une courte note : comment modifier les dates, les textes (dictionnaire FR/EN) et tester chaque phase (`?phase=`).

## Critères d'acceptation

- [ ] Aucun mot interdit (QR, scan, app, collection, jumeau, chat noir, rôle, faction…) dans le HTML, en FR comme en EN.
- [ ] Aucune description du responsable des rayons vêtements.
- [ ] Phase « Avant » : le compte à rebours est exact à la seconde près pour l'heure de Montréal, et il « recule » de temps en temps.
- [ ] `?phase=pendant` et `?phase=apres` affichent les textes attendus.
- [ ] La bascule FR/EN change tous les textes sans recharger la page.
- [ ] Avec `prefers-reduced-motion`, aucun glitch animé.
- [ ] La page fonctionne quand le stockage local est bloqué (navigation privée).
- [ ] Le fichier ne fait aucune requête réseau, à part la police si elle est retenue.
- [ ] L'aperçu du lien (Open Graph) s'affiche correctement dans un outil de prévisualisation.
- [ ] Le rendu est lisible et sans défilement horizontal à 360 px de large.
