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
