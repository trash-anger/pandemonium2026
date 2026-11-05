# Exigences transversales

[← Index](../README.md)

Les exigences ci-dessous s'appliquent à toutes les fonctionnalités. Chacune comporte une **vérification**. Une valeur marquée « à définir » n'a pas été fixée : elle ne doit pas être inventée à l'implémentation.

## Accessibilité et ergonomie

### REQ-001
**Mobile d'abord.** L'app est entièrement utilisable sur un téléphone de 360 px de large, en portrait. *Statut : Hypothèse.* *Vérification :* test manuel sur iPhone et Android à 360 px.

### REQ-002
**Lisible dans le noir.** Thème sombre ; contraste du texte d'au moins 4,5:1 (WCAG AA) ; police de 16 px au minimum pour le texte courant. *Statut : Proposition.* *Vérification :* outil de contraste et test réel en salle sombre.

### REQ-003
**Glitchs sans danger.** Pas plus de 3 flashs par seconde (WCAG 2.3.1). La préférence `prefers-reduced-motion` est respectée : les glitchs deviennent statiques. Le glitch ne bloque jamais l'interface plus de 5 s. *Statut : Proposition, recommandée pour la sécurité des personnes photosensibles.* *Vérification :* revue des animations, et test avec la réduction des animations activée.

### REQ-004
**Cibles tactiles** d'au moins 48×48 px, utilisables avec des gants ou un faux ongle. *Statut : Proposition.* *Vérification :* inspection.

### REQ-005
**Sans compte.** Ni courriel, ni mot de passe, ni réseau social ne sont exigés pour jouer. *Statut : Hypothèse* (cohérente avec OBJ-6 et « pas de clavier », S3). *Vérification :* parcours complet sans aucune saisie d'identifiant.

## Performance et fiabilité

### REQ-006
**Premier chargement léger.** Le poids transféré au premier scan est de X Ko au maximum. Interface affichée en moins de Y s sur une 4G médiocre. *Statut : Confirmé (intention, S3 : CDN et cache) ; X et Y à définir.* *Vérification :* mesure avec un réseau bridé.

### REQ-007
**Quasi temps réel.** Les événements globaux (progression, palier, glitch global, message du MJ, révélation) atteignent les appareils ouverts en N s au maximum. *Statut : Confirmé (S1 : conscience de l'avancement global) ; N à définir.* *Vérification :* deux appareils côte à côte, chronométrés.

### REQ-008
**Photos de scan basse qualité** : au plus X px sur le grand côté et Y Ko. *Statut : Confirmé (« basse qualité », S3) ; valeurs à définir.* *Vérification :* inspection des fichiers stockés.

### REQ-015
**Tenue à la charge.** Le service supporte le pic attendu de joueurs simultanés (300 à 400 joueurs, [DEC-019](decisions.md#dec-019)) avec une marge ×3. *Statut : Proposition.* *Vérification :* test de charge avant la fête.

### REQ-016
**Compatibilité** : Safari iOS et Chrome Android dans leurs versions courantes, Chrome et Safari sur ordinateur pour l'administration. *Statut : Hypothèse.* *Vérification :* matrice de tests manuelle.

### REQ-019
**Données dans le cloud.** Toute donnée de jeu est envoyée au serveur dès que le réseau le permet ; le stockage local n'est qu'un cache ([DEC-052](decisions.md#dec-052)). *Statut : Confirmé (S6).* *Vérification :* vider le stockage du navigateur, réintégrer avec le PIN, et retrouver toutes ses données.

### REQ-020
**Bilingue.** Tous les textes existent en français et en anglais ([DEC-039](decisions.md#dec-039)). *Statut : Confirmé (S5).* *Vérification :* parcours complet avec un téléphone en anglais.

### REQ-018
**Observabilité.** Le MJ voit les erreurs serveur et le volume de scans en direct ([FEAT-020](fonctionnalites/admin.md)). *Statut : Proposition.*

## Sécurité, triche et confidentialité

### REQ-009
**Visibilité publique minimale.** Les seules données visibles des autres joueurs sont le pseudo, l'emoji, les attributs de costume, la faction, les badges et les statistiques de jeu. *Statut : Proposition.* *Vérification :* revue des réponses de l'API.

### REQ-010
**Consentement photo.** Aucune image de la caméra ne quitte l'appareil sans un consentement explicite, donné une fois et révocable. Le refus ne dégrade pas le jeu. *Statut : Confirmé (S5, S7, [DEC-034](decisions.md#dec-034), [DEC-061](decisions.md#dec-061))* : c'est le scanneur qui consent, et il est invité à cadrer sans personne reconnaissable. *Vérification :* test avec le consentement refusé, en inspectant le trafic réseau.

### REQ-011
**Contrôle d'accès.** Le panneau MJ exige une authentification forte. Il passe par Google OAuth ([DEC-047](decisions.md#dec-047)). Un personnage ne peut être modifié que par ses appareils, liés à la création ou par la réintégration avec PIN ([FEAT-019](fonctionnalites/recuperation.md)), limitée en tentatives. *Statut : Confirmé (S5) pour l'OAuth ; reste : Proposition, requise.* *Vérification :* tests d'accès refusé.

### REQ-012
**Anti-triche raisonnable.** Limites de débit par appareil ; détection d'une étiquette scannée par un nombre anormal d'appareils en peu de temps, par exemple à partir d'une photo partagée. La triche est **tolérée** si elle reste marginale : c'est une fête. *Statut : Proposition.* Seuils à définir.

### REQ-013
**Modération.** Le MJ peut masquer un pseudo ou une photo en direct. Les pseudos générés ne produisent pas de contenu offensant ([univers-et-ton §2](univers-et-ton.md#2-humour)). *Statut : Proposition.*

### REQ-014
**Conservation limitée.** 7 jours après la fête, les photos sont supprimées et le reste anonymisé ([DEC-035](decisions.md#dec-035)). Une page explique quelles données sont collectées, et l'écran d'avertissement précise qu'aucune ne sert à un but commercial. *Statut : Confirmé (S5).*

### REQ-017
**Dépôt public sans secrets ni spoilers.** Le dépôt GitHub est public ([CT-012](contraintes-techniques.md#ct-012)). Les clés (admin, Web Push, Cloudflare) **et la configuration secrète du jeu** (effets des légendaires et des pièges, paramètres des rôles) n'y figurent jamais avant la fête ; elles vivent dans l'admin ou un fichier ignoré par git ([DEC-045](decisions.md#dec-045)). *Statut : Proposition, requise.* *Vérification :* analyse des secrets du dépôt et revue avant chaque push.
