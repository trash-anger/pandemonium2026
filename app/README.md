# Application « Déjà vu ! »

Worker Cloudflare servi sur `https://p.uyt.re` ([DEC-048](../specs/decisions.md#dec-048)). Lot actuel : **LOT-0** ([plan](../specs/plan-implementation.md)) — étiquettes, page provisoire de chaque étiquette, panneau du MJ.

| Chemin | Rôle |
|--------|------|
| `/` | Accueil et saisie manuelle d'un code (CA-001-3) |
| `/<CODE>` | Page provisoire de l'étiquette ; minuscules redirigées ; code inconnu → 404 |
| `/admin` | Panneau du MJ, Google OAuth : génération (ADM-1), export CSV Niimbot, recherche et rôle d'une étiquette (CA-001-4), heures (ADM-3), paramètres (ADM-2) |

## Développer en local

```sh
npm install
npm run db:local                 # crée la base D1 locale
printf 'PUBLIC_ORIGIN=http://localhost:8787\nDEV_ADMIN_EMAIL=mj@local\n' > .dev.vars
npm run dev                      # http://localhost:8787, admin sans OAuth en local
npm test && npm run typecheck
```

`DEV_ADMIN_EMAIL` n'a d'effet que si `PUBLIC_ORIGIN` commence par `http://localhost`.

### Banc d'essai (local seulement)

`http://localhost:8787/banc` : 1 à 4 téléphones émulés côte à côte, une console de tests et un journal. Les boutons agissent par **injection** (`postMessage` vers l'agent `/__dev/agent.js`, ajouté aux pages en local) ou par **simulation** (API `/__dev/*`, qui modifie la base locale). Le banc et l'API ne répondent que si `PUBLIC_ORIGIN` commence par `http://localhost`. Les boutons grisés arrivent avec leur lot. Ajouter `?lang=en` à une URL force l'anglais.

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

Client OAuth Google (application Web) : URI de redirection autorisée `https://p.uyt.re/auth/retour`.

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
