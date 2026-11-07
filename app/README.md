# Application « Déjà vu ! »

Worker Cloudflare servi sur `https://p.uyt.re` ([DEC-048](../specs/decisions.md#dec-048)). Lots livrés ([plan](../specs/plan-implementation.md)) : **LOT-0** (étiquettes, panneau du MJ) et **LOT-1** (scan, création du personnage, collection, réintégration par PIN).

| Chemin | Rôle |
|--------|------|
| `/` | Application du joueur : accueil, ou saisie d'un code sans personnage (`?code=` → `/<CODE>?s=m`) |
| `/<CODE>` | Scan d'une étiquette (FEAT-002, FEAT-003) ; minuscules redirigées ; code inconnu → 404 |
| `/collection`, `/moi`, `/saisie`, `/tuto` | Écrans de l'application (`public/app.js`) |
| `/api/*` | API du jeu : `moi`, `scan`, `tirage`, `creer`, `etiquette`, `reintegrer`, `modifier`, `collection` |
| `/admin` | Panneau du MJ, Google OAuth : génération (ADM-1), export CSV Niimbot, recherche et rôle d'une étiquette (CA-001-4), heures (ADM-3), paramètres (ADM-2), PIN et détachement d'une étiquette, remise à zéro de la partie |

## Développer en local

```sh
npm install
npm run db:local                 # crée la base D1 locale
printf 'PUBLIC_ORIGIN=http://localhost:8787\nDEV_ADMIN_EMAIL=mj@local\n' > .dev.vars
npm run dev                      # http://localhost:8787, admin sans OAuth en local
npm test && npm run typecheck
```

`DEV_ADMIN_EMAIL` n'a d'effet que si `PUBLIC_ORIGIN` commence par `http://localhost`.

### Banc d'essai

`http://localhost:8787/banc` : 1 à 4 téléphones émulés côte à côte, une console de tests et un journal. Les boutons agissent par **injection** (`postMessage` vers l'agent `/__dev/agent.js`, ajouté aux pages en local) ou par **simulation** (API `/__dev/*`, qui modifie la base locale). Le banc, son API et l'horloge simulée sont **toujours derrière la connexion Google** (bouton « 🧪 Banc d'essai » du panneau) : MJ et lecteur en local (session de dev automatique) et sur l'aperçu ; **MJ seulement en production**, où le banc n'utilise que ses propres étiquettes (colonne `banc`, créées par « Stock de test », jamais exportées ni comptées), « Tout réinitialiser » (qui efface aussi les étiquettes imprimées) n'y est possible que jusqu'au samedi 7 novembre 6 h (Montréal), avec confirmation `TOUT`, et garde le journal du MJ, et « Partie à zéro » efface aussi les vrais joueurs. À retirer à la fin de la phase de dev. Les boutons grisés arrivent avec leur lot. Ajouter `?lang=en` à une URL force l'anglais.

Chaque téléphone du banc a son propre stockage local (clés suffixées par `T1`…`T4`) et sa propre horloge : l'application envoie l'heure simulée au serveur (`X-Dev-Maintenant`, ignoré en production sauf pour le MJ connecté). « Joueur prêt » crée un personnage complet (PIN 1234) ; « T1 scanne T2 » fait scanner une étiquette de T2 par T1.

Le navigateur s'identifie par un jeton anonyme (en-tête `X-Appareil`, stocké localement) ; le serveur n'en garde que l'empreinte.

### Codes fixes du banc (planche imprimée)

Pour tester avec de vrais téléphones, sans retaper de codes au hasard : 34 étiquettes numérotées (`src/banc-fixe.ts`), installées par le bouton « Codes fixes 0001… » du banc (A4), en local et sur l'aperçu seulement (refusé en production). Elles commencent toutes par 0, chiffre absent des vrais codes : aucune collision possible, et elles répondent « code inconnu » sur p.uyt.re.

| Codes | Rôle |
|---|---|
| 0001 à 0004 | 4 joueurs fixes (personnages créés d'avance, PIN 1234) |
| 0005 | étiquette personnelle du MJ, avec son personnage (PIN 1234) |
| 0011 à 0020 | légendaires L-1 à L-10, toujours le même effet (pas de mélange) |
| 0021 à 0025 | pièges T-1 à T-5, toujours le même effet |
| 0031 à 0042 | vierges |
| 0051 / 0099 | retirée / inconnue |

Le bouton est rejouable : il remet les PIN à 1234 et recrée les personnages fixes effacés par « Partie à zéro ». Planche à imprimer (papier Lettre, noir et blanc, 3 pages : récapitulatif puis QR) :

```sh
npm run planche                  # QR vers l'aperçu
npm run planche -- <origine>     # ou vers une autre adresse
```

Le banc affiche aussi, sous chaque téléphone (jusqu'à 6), les QR de ses étiquettes : un vrai téléphone peut les scanner à l'écran. En C1, une matrice fait scanner n'importe quel téléphone du banc par n'importe quel autre. L'horloge simulée (A3) ne vaut que pour les téléphones du banc : pour tester avec un vrai téléphone, A3b « Soirée en heure réelle » décale toute la soirée sur l'heure réelle (« 23:58 » : minuit dans 2 min), local et aperçu seulement. Plan de tests imprimable : `npm run plan-tests` (`sorties/plan-tests.pdf`).

Elle s'écrit dans `sorties/codes-banc.pdf` (Chrome requis pour le PDF ; sinon, imprimer `sorties/codes-banc.html`). Avant de scanner pour de vrai, mettre le début de la soirée dans le passé dans l'admin de l'aperçu.

## Déployer (première fois)

```sh
export CLOUDFLARE_ACCOUNT_ID=<compte qui porte la zone uyt.re>
npx wrangler d1 create deja-vu   # reporter l'identifiant dans wrangler.jsonc
npm run db:remote
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put SESSION_SECRET   # chaîne aléatoire longue (openssl rand -base64 48)
npx wrangler secret put ADMIN_EMAILS     # adresse(s) du MJ, séparées par des virgules
npx wrangler secret put LECTEURS_EMAILS  # facultatif : accès en lecture seule (ni modification ni export CSV)
npm run deploy                   # crée aussi le domaine personnalisé p.uyt.re
```

À chaque nouveau lot : `npm run db:remote` (migrations), puis `npm run deploy`.

Client OAuth Google (application Web) : URI de redirection autorisée `https://p.uyt.re/auth/retour`.

## Pipeline et aperçu

Workflow `.github/workflows/deja-vu.yml` :

| Événement | Ce qui se passe |
|-----------|-----------------|
| Pull request vers `main` | Tests et types, puis déploiement sur l'**aperçu** `https://deja-vu-apercu.uyt-re.workers.dev` (Worker `deja-vu-apercu`, base D1 `deja-vu-apercu`, banc d'essai actif) ; le lien est commenté dans la PR |
| Fusion dans `main` | Tests, migrations de la base de production, déploiement sur `https://p.uyt.re` |

L'aperçu n'utilise jamais la base de production. Il montre la dernière PR poussée. Le banc (`/banc`) et l'horloge simulée y sont actifs (`BANC=actif`) ; l'admin passe par Google (URI de redirection `https://deja-vu-apercu.uyt-re.workers.dev/auth/retour`).

Secrets GitHub : `CLOUDFLARE_API_TOKEN` (modèle « Modifier les Workers Cloudflare » + D1 : modifier), `CLOUDFLARE_ACCOUNT_ID`. Secrets du Worker d'aperçu : `wrangler secret put <NOM> --env apercu`.

## Imprimer les étiquettes

### Sur papier (soirée du 7 novembre : l'imprimante Niimbot n'est pas arrivée)

Les codes sont tirés une fois pour toutes dans **`donnees/etiquettes-jeu.csv`** (commité, livré avec chaque déploiement) : 890 étiquettes au même format (29 × 38 mm), dont 1 `personnelle_mj` et 15 `speciale_mj`.

1. Après le déploiement, dans `/admin` : **« Charger les codes du jeu »**. Rejouable : n'ajoute que les codes absents, ne touche jamais une étiquette déjà réclamée.
2. `npm run etiquettes` écrit `sorties/etiquettes.pdf` : 19 pages Lettre, 49 étiquettes par page, QR et « DÉJÀ VU ! » aligné à gauche. Imprimer **à 100 %** (pas « ajuster à la page »).
3. Massicoter sur les traits gris, prolongés jusqu'au bord de la feuille ; percer au point gris.
4. Costume du MJ (1re page) : un petit losange à droite de « VU ! » marque les 15 spéciales ; deux losanges, la personnelle du MJ.

`npm run codes-jeu -- --force` retire de nouveaux codes : à ne faire que si rien n'est encore imprimé.

### Avec la Niimbot

1. Dans `/admin`, générer : 690 `petit` `normale` ; 1 `grand` `personnelle_mj` ; 15 `grand` `speciale_mj` ; le reste du grand format en `normale`.
2. Exporter les CSV (« tous les petits », « tous les grands »). **Ne jamais les committer** : `sorties/` est ignoré par git (REQ-017).
3. Vérifier à l'échelle : `npm run apercu -- sorties/etiquettes-petit.csv petit`, puis ouvrir `sorties/apercu-petit.html` et imprimer à 100 %.
4. Dans l'app NIIMBOT (macOS), créer le gabarit et importer le CSV :

| | Petit 40×30 mm | Grand 40×50 mm |
|---|---|---|
| QR | 25,4 × 25,4 mm, à gauche, centré verticalement ; lié à la colonne `url` ; correction Q | 25,4 × 25,4 mm, centré, en haut ; colonne `url` ; correction Q |
| Texte | « DÉJÀ VU ! » sur 2 lignes, gras, à droite ; colonne `code` dessous, chasse fixe, espacé | colonne `code` sous le QR, puis « DÉJÀ VU ! » |
| Marge du QR | 2 modules blancs autour (≈ 1,75 mm) | idem |

Le QR encode `HTTPS://P.UYT.RE/<CODE>` en majuscules : version 2 (25 × 25 modules), soit environ 6 points d'impression par module sur la B1 à 203 dpi.

5. Imprimer une planche test, la scanner avec un iPhone et un Android, lampe allumée, dans une pièce sombre (CA-001-2), puis lancer la série.

## Faux souvenirs (LOT-2)
Les gabarits, lieux et chutes viennent de `specs/textes.md` §3. Après une correction des textes, régénérer `src/souvenirs-textes.ts` depuis la racine du dépôt :

```sh
python3 app/scripts/textes-souvenirs.py
```

Les seuils de la jauge de souvenirs (départ, rescans par heure, seuil du flou) se règlent dans l'admin, section `memoire` des paramètres.

## Direct et révélation (LOT-3)
- `/api/direct` : quête, paliers, soldes éclair, factions et événements, identique pour tous (cache 4 s en périphérie). Les téléphones l'interrogent toutes les 10 s.
- `/api/revelation` : refusé avant l'heure de révélation, puis un instantané figé (table `revelations`), le même pour tous (cache 30 s). Le graphe est dessiné avec D3 (`public/vendor/d3-7.9.0.min.js`, mis en cache par le service worker dès la première visite).
- Admin → « Révélation : image cachée » : phrase (« / » pour passer à la ligne) ou image, échantillonnée en points dans le navigateur. Le lien « Aperçu de la révélation » montre l'état actuel sans rien figer.
- Pour répéter : sur le banc, avancer l'heure de révélation (Admin → En direct → −15 min ou « Maintenant »). Chaque nouvelle heure produit un nouvel instantané.

## Costume du MJ (LOT-3, étape C)
- Les 15 étiquettes « speciale_mj » portent chacune un effet (L-1 à L-10, T-1 à T-5), redistribué toutes les 20 min (HMAC du secret de session : imprévisible, mais identique pour tous). Les étiquettes du banc ont leur propre mélange.
- Une légendaire ou un piège ne s'obtient qu'une fois par joueur. Le Dernier exemplaire (L-7) n'existe qu'en un seul exemplaire, remis en rayon à 21 h, minuit et 3 h. Le MJ voit l'effet sans le subir.
- Admin → « Costume du MJ » : pause « Fermé pour inventaire » (5, 10, 15 min ou jusqu'à réouverture), tableau des effets en cours, « Derniers clients » (30 min) avec sanctions 1 à 5 et missions M-1 à M-7. Sanctions et missions aussi depuis la fiche d'une étiquette. Les sanctions sont annulables (ce qui a été retiré est rendu).
- Les joueurs reçoivent sanctions et missions par `/api/notifs`, relevé avec le direct toutes les 10 s.
- Banc : boutons L-1…L-10 et T-1…T-5 (ouvrent l'étiquette qui porte l'effet à l'heure du banc), Sanction 1…5, Pause 5 min, Rouvrir, M-1…M-7 (missions de 2 min).

## Jumeaux et chats noirs (LOT-4)
- **Groupes** : formés par le serveur, à la création d'un personnage et au plus une fois par minute pendant le direct. Départ à la 60e activation ou à minuit ; courbe linéaire jusqu'à 2 h (45 paires et 10 triplés par défaut, étalés). Les partenaires sont pris parmi les joueurs actifs depuis 10 min ; le MJ est exclu.
- **Indices** : aucun avant minuit, puis un toutes les 10 min (type, couleur, attributs vrais et faux, pseudo). Bonus : palier P-3, L-4, mission M-5.
- **Retrouvailles** : scan mutuel en 90 s, avec n'importe quelle étiquette. Les deux téléphones montrent la fusion (le premier relève ses messages toutes les 2 s pendant l'attente). Badge, +50 points chacun, +5 à la quête, souvenir d'origine. Triplés : badge secret « Deux sur trois » à la première paire.
- **Chats noirs** : 1 pour 50 joueurs (au moins un dès 10). **Contagion** : à chaque scan, dans les deux sens, avec la probabilité du barème ; corruption de 10 min (moins au-delà de 50 % de corrompus), immunité dans 80 % des cas. L-1 protège, L-2 annule, la surconsommation corrompt sans immunité, la sanction 3 corrompt 10 min.
- **Révélation** : les jumeaux retrouvés sont reliés en pointillés dorés. Le bouton « 🦠 Contagion » montre qui a corrompu qui et dévoile les chats noirs. Le « Dernier survivant » (jamais corrompu, le plus de nouvelles cartes) reçoit son badge quand l'instantané est figé.
- Admin → « Jumeaux et chats noirs » : groupes, chats, part de corrompus, réglage de la transmission et de la durée, « Relancer un foyer ».
- Banc : E1 (Attribuer aux téléphones sélectionnés, Minuit, Indice +1, Retrouvailles T1↔T2, Trop lent, Triplés 2/3) et E2 (Devenir chat noir, Contaminer, Immunité, Vague > 50 %, Transmission 100 % / 60 %).

## Notifications push (LOT-3 D)
- **Clé VAPID** : secret `VAPID_JWK` (clé privée P-256 au format JWK), sur chaque Worker. À générer une seule fois, sans l'afficher (depuis `app/`) :
  ```sh
  export CLOUDFLARE_ACCOUNT_ID=…   # compte qui héberge les Workers
  K=$(node -e 'const {generateKeyPairSync}=require("crypto");process.stdout.write(JSON.stringify(generateKeyPairSync("ec",{namedCurve:"prime256v1"}).privateKey.export({format:"jwk"})))') \
  && printf %s "$K" | npx wrangler secret put VAPID_JWK [--env apercu]; unset K
  ```
  Changer la clé invalide tous les abonnements. La clé publique se déduit de la privée (`GET /api/push/cle`).
- **Envoi** : un Cron Trigger chaque minute (et `/api/notifs` en secours) prépare le contenu de chaque appareil, puis le réveille par un push sans contenu. Le service worker lit le texte sur `/api/push/contenu` avec l'adresse de son abonnement. Au-delà de 40 appareils, les lots passent par la liaison `SOI` (le Worker lui-même), car un appel a droit à 50 sous-requêtes.
- **Quoi** : annonces H−30 et révélation, messages du MJ, paliers, et pour chaque joueur : jumeau, chat noir, sanctions, missions. Au plus un push toutes les 10 min par appareil, sauf annonces, jumeau et chat noir (RG-016-3).
- **Côté joueur** : une carte « 🔔 Ne rate rien » sur l'accueil après la première carte (RG-016-1). Sur iPhone, seulement dans l'app installée. Le premier abonnement d'un appareil reçoit un push de bienvenue, qui vérifie toute la chaîne.
- **Admin** : bloc « Notifications » (appareils abonnés) et bouton « Push de test sur les appareils du MJ ». **Banc** : `POST /__dev/push` force un tick à l'heure du banc.


## Frise d'activité et suggestions au MJ (LOT-3 E)
- **Frise** (ADM-14), dans l'admin : scans par tranche de 5 min (nouvelles cartes et rescans), nouvelles cartes cumulées face à la courbe attendue du préréglage, part de corrompus, nouveaux joueurs. Repères : minuit, 2 h, révélation, mélanges des légendaires, paliers, messages, pauses, sanctions, missions et suggestions. Calculée à la demande depuis les tables du jeu ; un tableau est aussi disponible.
- **Courbe attendue** : joueurs actifs × cartes par joueur du préréglage (Lent 8, Normal 15, Rapide 25, Très rapide 40) × part de la soirée écoulée jusqu'à la révélation.
- **Signaux** (barème §6), évalués toutes les 10 min par le Cron Trigger (et `/api/notifs` en secours), de 30 min après l'ouverture jusqu'à la révélation : connexions au-dessus de 2 fois ou sous la moitié de la courbe, palier atteint plus de 45 min en avance, plus de 50 % de corrompus pendant 20 min, moins de 10 % une heure après le premier chat noir, plus de rescans que de nouvelles cartes depuis 30 min.
- **Suggestions** : au plus une toutes les 15 min, le même signal pas avant 45 min. Le MJ reçoit un push « 🎛️ Suggestion de réglage » sur son personnage de MJ, qui ouvre l'admin ; il applique ou ignore en un toucher. Le serveur n'applique jamais rien tout seul.
- **Banc** : `POST /__dev/suggestions` (`{ maintenant, effacer }`) évalue les signaux à l'heure du banc.
