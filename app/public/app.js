// Application du joueur « Déjà vu ! » — LOT-1 : scan, création en 4 écrans, collection, fiche, PIN.
// Le serveur est la source de vérité (DEC-052) : le stockage local n'est qu'un cache.
(() => {
  "use strict";

  // ---------- Stockage local (un espace par téléphone du banc d'essai : window.name = T1…T4) ----------
  const SUFFIXE = /^T\d$/.test(window.name) ? "-" + window.name : "";
  const CLE = { jeton: "dv-appareil" + SUFFIXE, langue: "dv-langue" + SUFFIXE, moi: "dv-moi" + SUFFIXE, brouillon: "dv-brouillon" + SUFFIXE };
  const lire = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const ecrire = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} };
  const lireJson = (k) => { try { return JSON.parse(lire(k) || "null"); } catch { return null; } };

  // ---------- Langue (REQ-020) ----------
  const q = new URLSearchParams(location.search);
  if (q.get("lang") === "fr" || q.get("lang") === "en") ecrire(CLE.langue, q.get("lang"));
  let L = lire(CLE.langue) || ((navigator.language || "fr").toLowerCase().startsWith("fr") ? "fr" : "en");
  document.documentElement.lang = L;

  // ---------- Catalogue (textes §1) ----------
  const TYPES = [
    ["mort_vivant", "🧟", "Mort-vivant", "Undead"], ["nuit", "🧛", "Vampire et créature de la nuit", "Vampires & night creatures"],
    ["magie", "🧙", "Magie et fantasy", "Magic & fantasy"], ["robot", "🤖", "Robot et sci-fi", "Robots & sci-fi"],
    ["animal", "🦄", "Animal et créature", "Animals & creatures"], ["sexy", "💋", "Sexy et uniforme", "Sexy & uniforms"],
    ["pop", "🦸", "Pop culture", "Pop culture"], ["inclassable", "🤡", "Inclassable", "Unclassifiable"],
  ].map(([id, e, fr, en]) => ({ id, e, fr, en }));
  const COULEURS = [
    ["noir", "#111111", "noir", "black"], ["blanc", "#f4f1ea", "blanc", "white"], ["argent", "#b8bcc6", "argent", "silver"],
    ["rouge", "#d7263d", "rouge", "red"], ["orange", "#f46036", "orange", "orange"], ["dore", "#d4af37", "doré", "gold"],
    ["vert", "#2bb673", "vert", "green"], ["bleu", "#2e5eaa", "bleu", "blue"], ["violet", "#7b3fa0", "violet", "purple"],
    ["rose", "#ff5fa2", "rose", "pink"], ["brun", "#7a4a2a", "brun", "brown"],
    ["arc_en_ciel", "conic-gradient(#f33,#fd3,#3d6,#39f,#a3f,#f33)", "arc-en-ciel", "rainbow"],
  ].map(([id, hex, fr, en]) => ({ id, hex, fr, en }));
  const ATTRS = [
    ["masque", "🎭", "Masque", "Mask"], ["maquillage", "💄", "Maquillage sur le visage", "Face paint"],
    ["perruque", "💇", "Perruque ou cheveux colorés", "Wig or coloured hair"], ["cornes", "😈", "Cornes ou oreilles", "Horns or ears"],
    ["ailes", "🪽", "Ailes", "Wings"], ["chapeau", "🎩", "Chapeau ou couvre-chef", "Hat or headpiece"],
    ["lumieres", "💡", "Lumières ou électronique", "Lights or electronics"], ["sang", "🩸", "Faux sang", "Fake blood"],
    ["accessoire", "🪄", "Accessoire à la main ou à la ceinture", "Handheld or belt accessory"], ["cape", "🧥", "Cape ou manteau long", "Cape or long coat"],
    ["paillettes", "✨", "Paillettes ou tissu brillant", "Glitter or shiny fabric"], ["queue", "🐾", "Queue", "Tail"],
    // Derrière « Charger plus »
    ["lunettes", "🕶️", "Lunettes ou lentilles", "Glasses or lenses"],
    ["couronne", "👑", "Couronne ou tiare", "Crown or tiara"],
    ["crocs", "🦷", "Crocs ou fausses dents", "Fangs or fake teeth"],
    ["armure", "🪖", "Armure ou casque", "Armour or helmet"],
    ["arme", "⚔️", "Arme factice", "Prop weapon"],
    ["plumes", "🪶", "Plumes ou fourrure", "Feathers or fur"],
    ["latex", "🖤", "Cuir, latex ou vinyle", "Leather, latex or vinyl"],
    ["chaines", "⛓️", "Chaînes ou gros bijoux", "Chains or big jewellery"],
    ["tatouages", "🎨", "Tatouages ou peinture sur le corps", "Tattoos or body paint"],
    ["tentacules", "🐙", "Tentacules ou membres en trop", "Tentacles or extra limbs"],
    ["integral", "🧸", "Combinaison intégrale ou mascotte", "Full-body suit or mascot"],
    ["pancarte", "🪧", "Pancarte ou texte écrit", "Sign or written text"],
  ].map(([id, e, fr, en]) => ({ id, e, fr, en }));
  const FACTIONS = {
    ordre: { e: "🛡️", fr: "L'Ordre du Ticket de Caisse", en: "The Order of the Receipt", dfr: "Sans reçu, point de salut.", den: "No receipt, no salvation." },
    chaos: { e: "🔥", fr: "Les Soldés Chaotiques", en: "The Chaotic Clearance", dfr: "Tout doit disparaître. Nous aussi.", den: "Everything must go. Us included." },
    friperie: { e: "🌿", fr: "Le Cercle de la Friperie", en: "The Thrift Circle", dfr: "Déjà porté, jamais dépassé.", den: "Pre-worn, never outworn." },
    influence: { e: "📸", fr: "La Guilde des Influenceurs", en: "The Influencer Guild", dfr: "Utilise mon code promo.", den: "Use my promo code." },
    necro: { e: "💀", fr: "Les Nécromanciens du Black Friday", en: "The Black Friday Necromancers", dfr: "Les invendus se relèveront.", den: "The unsold shall rise." },
  };
  const CLASSES = {
    barbare: ["Barbare du Black Friday", "Black Friday Barbarian", "Force (de bousculade)", "Strength (shoving)"],
    barde: ["Barde de la Cabine d'essayage", "Fitting-Room Bard", "Charisme vestimentaire", "Sartorial charisma"],
    clerc: ["Clerc du Retour gratuit", "Cleric of Free Returns", "Sagesse (lire les petits caractères)", "Wisdom (reading the fine print)"],
    druide: ["Druide du Zéro déchet", "Zero-Waste Druid", "Constitution", "Constitution"],
    magicien: ["Magicien du Code promo", "Promo-Code Wizard", "Intelligence", "Intelligence"],
    paladin: ["Paladin du Service après-vente", "After-Sales Paladin", "Patience (au téléphone)", "Patience (on hold)"],
    rodeur: ["Rôdeur de Friperie", "Thrift-Store Ranger", "Perception (des bonnes affaires)", "Perception (of bargains)"],
    voleur: ["Voleur d'Étiquettes", "Tag Thief", "Dextérité", "Dexterity"],
  };
  // Badges (FEAT-015, textes §1.6) : [emoji, nom FR, nom EN, condition FR, condition EN, secret]
  // L'ordre est celui de l'écran ; un badge secret n'apparaît qu'une fois gagné.
  const BADGES = {
    tueur_de_poussin: ["🐣", "Tueur de poussin", "Chick Killer", "Scanner une étiquette pas encore activée qui n'est pas à toi.", "Scan a not-yet-activated tag that isn't yours."],
    achat_compulsif: ["🛍️", "Achat compulsif", "Impulse Buy", "Ajouter une étiquette à ton personnage. Demande au MJ.", "Add a tag to your character. Ask the GM."],
    surconsommation: ["🧾", "Surconsommation", "Overconsumption", "Prendre plus de 3 étiquettes.", "Take more than 3 tags."],
    trans_classe: ["🔀", "Trans-classe", "Class Shifter", "Changer de classe avant 1 h.", "Change class before 1 a.m."],
    installe_portail: ["🖖", "Téléporteur installé", "Transporter Installed", "Installer l'app sur ton écran d'accueil.", "Install the app on your home screen."],
    boucle_detectee: ["🔁", "Boucle détectée", "Loop Detected", "Revoir la même personne 3 fois.", "See the same person 3 times."],
    jour_marmotte: ["🕰️", "Jour de la marmotte", "Groundhog Day", "Revoir la même personne 6 fois.", "See the same person 6 times."],
    client_maudit: ["🧿", "Client maudit", "Cursed Customer", "Ce badge n'existe pas. Tu ne l'as jamais eu.", "This badge doesn't exist. You never got it.", true],
    jumeaux_retrouves: ["👯", "Jumeaux retrouvés", "Twins Reunited", "Retrouver ton double.", "Find your double."],
    fermer_boucle: ["⭕", "Fermer la boucle", "Close the Loop", "En fin de soirée, rescanner ta toute première personne.", "At the end of the night, rescan your very first person."],
    patient_zero: ["🦠", "Patient zéro", "Patient Zero", "Être la première personne corrompue par un chat noir.", "Be the first person corrupted by a black cat."],
    dernier_survivant: ["🛡️", "Dernier survivant", "Last Survivor", "Jamais corrompu, et le plus de nouvelles cartes à la révélation.", "Never corrupted, with the most new cards at the reveal."],
    amnesie: ["🫥", "Amnésie", "Amnesia", "Vider complètement ta jauge de souvenirs.", "Empty your memory gauge completely."],
    serie_complete: ["🧩", "Série complète", "Full Set", "Compléter une série.", "Complete a set."],
    garde_robe_mj: ["👔", "Garde-robe du MJ", "GM's Wardrobe", "Collectionner les 10 légendaires du MJ.", "Collect all 10 of the GM's legendaries."],
    anticapitaliste: ["✊", "Anticapitaliste", "Anti-capitalist", "Trouver un bon de réduction très particulier.", "Find a very special discount voucher."],
    employe_du_mois: ["🏷️", "Employé du mois", "Employee of the Month", "Réussir une mission confiée par le MJ.", "Complete a mission from the GM."],
    client_difficile: ["⚠️", "Client difficile", "Difficult Customer", "Recevoir un avertissement du MJ. Rien de glorieux.", "Get a warning from the GM. Not proud.", true],
    collegue_de_rayon: ["🤝", "Collègue de rayon", "Aisle Mate", "Scanner une personne de ta faction.", "Scan someone from your faction."],
  };
  const lib = (o) => (L === "en" ? o.en : o.fr);
  const typeDe = (id) => TYPES.find((t) => t.id === id) || TYPES[7];
  const couleurDe = (id) => COULEURS.find((c) => c.id === id) || COULEURS[0];
  const attrDe = (id) => ATTRS.find((a) => a.id === id);
  const classeLib = (id) => (CLASSES[id] || ["?", "?"])[L === "en" ? 1 : 0];
  const factionLib = (id) => (FACTIONS[id] ? `${FACTIONS[id].e} ${lib(FACTIONS[id])}` : "");

  // ---------- Textes de l'interface ----------
  const T = {
    fr: {
      soldes: "Ouverture des soldes", sousTitre: "Tu as déjà vécu cette soirée.",
      saisir: "Entre le code imprimé sous le QR", voir: "Voir l'étiquette",
      accueilAide: "Tu as une étiquette ? Scanne son QR avec l'appareil photo de ton téléphone.",
      accueilSans: "Pas d'étiquette ? Va trouver le maître du jeu.",
      reveil: "Réveil dans", jour: "j", lecture: "Lecture de l'étiquette…",
      attente: "Elle se réveillera samedi 7 novembre à 21 h. Garde-la sur toi : à l'ouverture, scanne-la pour créer ton personnage.",
      ouvert: "C'est ouvert. Rescanne ton étiquette.",
      inconnue: "Cette étiquette n'existe pas dans cette timeline.", inconnueAide: "Vérifie le code : il n'utilise jamais 0, O, 1, I ni L.",
      retiree: "Article retiré de la vente. Va voir le maître du jeu.",
      ferme: "Le magasin est fermé. Les soldes sont terminées… ou pas tout à fait : reviens demain.",
      reseau: "Le réseau fait des siennes.", reessayer: "Réessayer", accueil: "Accueil",
      erreur: "Quelque chose a glitché.",
      // Création (FEAT-003)
      etape: (n) => `Étape ${n}/4`, retour: "← Retour",
      avTitre: "Avant d'entrer dans la boutique",
      av: [
        "🏴 <b>Déjà vu !</b> est un jeu <b>punk et anticapitaliste</b>. Les soldes, ici, c'est pour rire.",
        "🗑️ Tes données sont <b>intégralement supprimées 7 jours après la fête</b>. Aucun usage commercial, jamais.",
        "🔢 Pas de compte, pas de courriel : juste un <b>code PIN</b> pour retrouver ton personnage.",
      ],
      compris: "J'ai compris",
      instTitre: "Installe l'app : on te la recommande",
      instPourquoi: "Pour une meilleure expérience : plein écran, ouverture en un geste, plus rapide, jouable même quand le réseau faiblit, et les notifications (ton jumeau, les annonces du MJ). Tu gagnes aussi le badge « Téléporteur installé ». Sans installation, tu peux quand même jouer en scannant les QR.",
      instBouton: "Installer l'app",
      instPuis: (c) => `Ensuite, ouvre <b>Déjà vu !</b> depuis ton écran d'accueil et entre le code de ton étiquette : <b class="code">${c}</b>`,
      instIos: "Sur iPhone, l'app installée ne partage pas la mémoire de ton navigateur : crée ton personnage <b>dans l'app</b>.",
      instDeja: "✅ L'app est installée. Parfait.",
      instSans: "Continuer sans installer",
      redirTitre: (n) => `Ouvre ton étiquette dans ${n}`,
      redir: (n) => `Ce navigateur risque d'oublier ton personnage. Ton étiquette n'est pas encore activée : ouvre-la plutôt dans <b>${n}</b>.`,
      redirOuvrir: (n) => `Ouvrir dans ${n}`, redirCopier: "Copier le lien", redirCopie: (n) => `Lien copié. Colle-le dans ${n}.`,
      redirManuel: (n) => `Si le bouton ne marche pas : copie le lien, ouvre ${n}, colle-le dans la barre d'adresse.`,
      redirIci: "Continuer ici quand même",
      inst: {
        safari: ["Touche le bouton <b>Partager</b> <span class=\"ico\">⬆︎</span> en bas de l'écran (ou en haut sur iPad).", "Fais défiler et choisis <b>« Sur l'écran d'accueil »</b>.", "Touche <b>Ajouter</b>."],
        chromeIos: ["Touche le bouton <b>Partager</b> <span class=\"ico\">⬆︎</span> dans la barre d'adresse.", "Choisis <b>« Sur l'écran d'accueil »</b>.", "Touche <b>Ajouter</b>."],
        autreIos: ["Ouvre cette page dans <b>Safari</b> ou <b>Chrome</b>.", "Touche <b>Partager</b> <span class=\"ico\">⬆︎</span>, puis <b>« Sur l'écran d'accueil »</b>."],
        chrome: ["Touche le menu <b>⋮</b> en haut à droite.", "Choisis <b>« Installer l'application »</b> ou <b>« Ajouter à l'écran d'accueil »</b>.", "Confirme avec <b>Installer</b>."],
        samsung: ["Touche le menu <b>≡</b> en bas à droite.", "Choisis <b>« Ajouter la page à »</b>, puis <b>« Écran d'accueil »</b>."],
        firefox: ["Touche le menu <b>⋮</b>.", "Choisis <b>« Installer »</b> ou <b>« Ajouter à l'écran d'accueil »</b>."],
        integre: ["Tu es dans le navigateur d'une autre app (Instagram, Messenger…). Ouvre d'abord cette page dans <b>Safari</b> ou <b>Chrome</b> : menu <b>⋯</b>, puis « Ouvrir dans le navigateur »."],
        ordi: ["Dans la barre d'adresse, clique sur l'icône d'installation <b>⊕</b>, ou passe par le menu du navigateur."],
      },
      costumeTitre: "Ton costume", costumeAide: "Choisis ce qui te ressemble le plus.",
      detailsTitre: "Les détails", couleurTitre: "Couleur dominante du costume", plusAttrs: "Charger plus",
      attrsAide: "Coche tout ce qu'on peut voir de loin sur ton costume.",
      suivant: "Suivant →", carteTitre: "Ta carte",
      pseudoModifiable: "Tu pourras le changer depuis ta fiche.",
      faction: "Faction", classe: "Classe",
      photos: "J'accepte que mes photos de scan apparaissent à la révélation.",
      pinTitre: "Ton code PIN (4 chiffres)",
      pinAide: "Il te servira à retrouver ton personnage sur un autre navigateur. Note-le dans ta tête.",
      creer: "Créer mon personnage", tirage: "On fouille les bacs de soldes…",
      dejaReclamee: "Trop tard : quelqu'un vient de réclamer cette étiquette.",
      // Tutoriel (textes §5.1)
      tutoTitre: "Ta mission",
      tuto: [["📷", "<b>Scanne des inconnus</b> : chaque personne devient une carte de ta collection, et te fait monter au classement."],
        ["🔁", "<b>Revois-les</b> : chaque déjà vu compte, et certains cachent des badges."],
        ["👯", "<b>Quelqu'un dans Pandémonium te ressemble un peu trop.</b> Premiers indices à minuit."],
        ["🕔", "<b>5 h : révélation</b> pour tout Pandémonium. Les classements se figent, les médailles restent."]],
      pouls: (j, r) => `⚡ <b>${j} joueur${j > 1 ? "s" : ""}</b> déjà dans la partie${r ? ` · record : <b>${r} carte${r > 1 ? "s" : ""}</b>` : ""}.`,
      missionTitre: "🎯 Ta première mission", missionSuivante: "🎯 Mission suivante", missionFaite: "✅ Mission accomplie !", missionsToutes: "Toutes les missions de départ sont accomplies. Chapeau.", missionsActives: "Missions actives", missionMJ: "MJ",
      missionAide: { installe_portail: "Suis les étapes d'installation, puis ouvre l'app depuis ton écran d'accueil.",
        collegue_de_rayon: (f) => `Trouve quelqu'un de ${f} et scanne son étiquette.`,
        boucle_detectee: "Scanne la même personne 3 fois, à 5 minutes d'écart au moins.",
        trans_classe: "Va dans <b>Moi</b> et change de classe avant 1 h." },
      premierScanBouton: "📷 Scanner ma première personne", scannerQqn: "📷 Scanner quelqu'un",
      cestParti: "C'est parti",
      // Accueil (textes §5.2)
      maintenant: "Et maintenant ?",
      mBloque: (m) => `Scanner bloqué encore ${m} min. Patience, client fidèle.`,
      mRevelation: (m) => `Révélation dans ${m} min. Dernière chance de faire grimper la quête !`,
      mPremiere: "Scanne ta première personne : ton premier faux souvenir t'attend.",
      mDefaut: "Scanne quelqu'un que tu ne connais pas.",
      scanner: "Scanner", maCarte: "Ma carte", maCollection: "Ma collection", cartes: (n) => `${n} carte${n > 1 ? "s" : ""}`,
      cdBloque: "Scanner débloqué dans", cdRevelation: "Révélation dans", cdFin: "Fermeture dans",
      saisieTitre: "Scanner une étiquette",
      saisieAide: "Le scanner intégré arrive bientôt. En attendant, scanne le QR avec l'appareil photo de ton téléphone, ou entre le code imprimé dessous.",
      // Résultats
      nouvelle: "Nouvelle pièce ajoutée", collectionN: (n) => `Ta collection : ${n} pièce${n > 1 ? "s" : ""}.`,
      souvenirBientot: "Votre faux souvenir commun se reconstitue…",
      dejaVu: (n) => (n ? `DÉJÀ VU ×${n}` : "DÉJÀ VU"), panier: "Article déjà dans ton panier.", fenetre: "Trop tôt pour compter : un même déjà vu compte une fois toutes les 5 minutes.",
      soiTitre: "C'est toi.", soi: "Ton double existe… quelque part. Les indices arrivent à partir de minuit.",
      encore: "Scanner encore",
      spectMJ: "Va trouver le MJ pour avoir ta propre étiquette !",
      spectAide: "Cette étiquette appartient déjà à quelqu'un. Voici sa carte, en lecture seule.",
      reintegrer: "Réintégrer le jeu avec mon PIN",
      reintTitre: "Réintégrer le jeu", reintAide: "C'est ton étiquette ? Entre ton code PIN pour retrouver ton personnage et ta collection.",
      valider: "Valider", pinFaux: (n) => `PIN incorrect. Encore ${n} essai${n > 1 ? "s" : ""}.`,
      pinBloque: (m) => `Trop d'essais. Récupération bloquée encore ${m} min.`,
      bienRevenu: "Personnage retrouvé. Re-bienvenue dans la boutique.",
      bloqueTitre: "Scanner bloqué", bloque: "Patience, client fidèle. Ce scan ne compte pas.",
      specialTitre: "Collection privée du MJ", special: "Cet article sort de la garde-robe du maître du jeu. Ses effets se réveillent bientôt.",
      aToiTitre: "Cette étiquette est-elle à toi ?",
      aToiAide: "Oui : elle s'ajoute à ton personnage, avec une nouvelle faction. Non : tu la laisses à son futur propriétaire.",
      aToiAlerte: "Attention : tu as déjà 3 étiquettes. Une de plus, c'est la surconsommation.",
      oui: "Oui, elle est à moi", non: "Non, pas à moi",
      ajoutee: "Ajoutée à ton personnage", nouvelleFaction: "Nouvelle faction",
      surconsoTitre: "Ne prends pas trop d'étiquettes.",
      surconso: ["Scanner bloqué 10 min", "Points de faction réduits de moitié", "Bonus multi-faction annulé", "Contribution à la quête divisée par 2", "Corruption immédiate, sans immunité jusqu'à la fin de la soirée"],
      tueTitre: "Tué dans l'œuf", tue: "L'étiquette reste à prendre : rends-la à son propriétaire ou au MJ.",
      badgeGagne: "Badge gagné",
      // Collection
      collectionTitre: "Collection", vide: "Ton placard est vide. Va scanner du monde.",
      premierScan: "Premier scan", rescans: (n) => `Vu ${n} fois`,
      // Fiche
      moiTitre: "Ma fiche", mesEtiquettes: "Mes étiquettes", mesBadges: "Mes badges", aucunBadge: "Aucun badge pour l'instant.",
      pseudo: "Pseudo", enregistrer: "Enregistrer", fige: "Figé",
      pseudoFige: "Le pseudo ne se change plus après minuit.",
      costumeFige: "Ton costume est figé : quelqu'un a déjà scanné ton étiquette, ou il est passé minuit.",
      classeFigee: "La classe ne se change plus.",
      classeAlerte: "Changer de classe donne le badge « Trans-classe ».",
      modifierCostume: "Modifier mon costume", confidentialite: "Photos",
      langue: "Language / Langue", commentJouer: "Ta mission",
      pinRappel: "Ton PIN te permet de retrouver ton personnage : rescanne une de tes étiquettes depuis un autre navigateur, puis touche « Réintégrer le jeu avec mon PIN ».",
      enregistre: "Enregistré.", mj: "MJ",
      ongAccueil: "Accueil", ongCollection: "Collection", ongClassements: "Classements", ongBadges: "Badges", ongMedailles: "Médailles", ongMoi: "Moi",
      sousBadges: "Badges", sousClassements: "Classements", bonus: (n) => `bonus`, toutPandemonium: "Tout Pandémonium", tous: "Tous",
      medaillesBonus: "Médailles bonus", medaillesBonusAide: "Un top 3 dans un classement, dans tout Pandémonium ou dans ta faction, rapporte une médaille. Provisoire : tout se fige à la révélation de 5 h.",
      medaillesFigees: "Classements figés depuis la révélation.",
      voirMedailles: (m) => `Mes médailles (${m.gagnes}/${m.total}${m.bonus ? ` +${m.bonus}` : ""})`,
      place: (r) => (r === 1 ? "1re place" : `${r}e place`),
      lb: { collectionneurs: ["Collectionneurs", "Personnes différentes scannées", (n) => `${n} personne${n > 1 ? "s" : ""}`], celebrites: ["Célébrités", "Personnes différentes qui ont scanné ton étiquette", (n) => `${n} scanneur${n > 1 ? "s" : ""}`] },
      lbBientot: "Bientôt : Fantôme, Boucle infinie, Business, Pont, Premier jumeau réuni, Factions.",
      lbVide: "Personne pour l'instant. Va scanner !", lbToi: "Toi", lbPasClasse: "Pas encore au classement : scanne, et fais scanner ton étiquette.",
      lbParticipants: (n) => `${n} au classement`,
      badgesTitre: "Badges", badgesGagnes: "Gagnés", badgesAVenir: "À débloquer",
      badgesVide: "Aucun badge pour l'instant. Ils se gagnent en jouant… ou en faisant des bêtises.",
      voirBadges: (n) => `Mes badges (${n})`, gagneA: (h) => `gagné à ${h}`,
      integre: "Tu es dans le navigateur d'une app. Ouvre plutôt cette page dans Safari ou Chrome pour garder ton personnage.",
      pied: "Pandémonium · Montréal · 7 novembre 2026",
    },
    en: {
      soldes: "Sale now on", sousTitre: "You've already lived this night.",
      saisir: "Enter the code printed under the QR", voir: "See the tag",
      accueilAide: "Got a tag? Scan its QR with your phone's camera.",
      accueilSans: "No tag? Go find the game master.",
      reveil: "Waking up in", jour: "d", lecture: "Reading the tag…",
      attente: "It wakes up Saturday, November 7 at 9 p.m. Keep it on you: when the game opens, scan it to create your character.",
      ouvert: "We're open. Scan your tag again.",
      inconnue: "This tag doesn't exist in this timeline.", inconnueAide: "Check the code: it never uses 0, O, 1, I or L.",
      retiree: "Item withdrawn from sale. Go see the game master.",
      ferme: "The store is closed. The sale is over… or not quite: come back tomorrow.",
      reseau: "The network is acting up.", reessayer: "Try again", accueil: "Home",
      erreur: "Something glitched.",
      etape: (n) => `Step ${n}/4`, retour: "← Back",
      avTitre: "Before you walk into the store",
      av: [
        "🏴 <b>Déjà vu!</b> is a <b>punk, anti-capitalist</b> game. The sales here are a joke.",
        "🗑️ Your data is <b>fully deleted 7 days after the party</b>. No commercial use, ever.",
        "🔢 No account, no email: just a <b>PIN</b> to get your character back.",
      ],
      compris: "Got it",
      instTitre: "Install the app: we recommend it",
      instPourquoi: "For a better experience: full screen, one-tap launch, faster, playable even when the network struggles, and notifications (your twin, the GM's announcements). You also earn the “Transporter Installed” badge. Without installing, you can still play by scanning QR codes.",
      instBouton: "Install the app",
      instPuis: (c) => `Then open <b>Déjà vu!</b> from your home screen and enter your tag's code: <b class="code">${c}</b>`,
      instIos: "On iPhone, the installed app doesn't share your browser's memory: create your character <b>in the app</b>.",
      instDeja: "✅ The app is installed. Perfect.",
      instSans: "Continue without installing",
      redirTitre: (n) => `Open your tag in ${n}`,
      redir: (n) => `This browser may forget your character. Your tag isn't activated yet: open it in <b>${n}</b> instead.`,
      redirOuvrir: (n) => `Open in ${n}`, redirCopier: "Copy the link", redirCopie: (n) => `Link copied. Paste it in ${n}.`,
      redirManuel: (n) => `If the button doesn't work: copy the link, open ${n}, paste it in the address bar.`,
      redirIci: "Continue here anyway",
      inst: {
        safari: ["Tap the <b>Share</b> button <span class=\"ico\">⬆︎</span> at the bottom of the screen (top on iPad).", "Scroll down and pick <b>“Add to Home Screen”</b>.", "Tap <b>Add</b>."],
        chromeIos: ["Tap the <b>Share</b> button <span class=\"ico\">⬆︎</span> in the address bar.", "Pick <b>“Add to Home Screen”</b>.", "Tap <b>Add</b>."],
        autreIos: ["Open this page in <b>Safari</b> or <b>Chrome</b>.", "Tap <b>Share</b> <span class=\"ico\">⬆︎</span>, then <b>“Add to Home Screen”</b>."],
        chrome: ["Tap the <b>⋮</b> menu at the top right.", "Pick <b>“Install app”</b> or <b>“Add to Home screen”</b>.", "Confirm with <b>Install</b>."],
        samsung: ["Tap the <b>≡</b> menu at the bottom right.", "Pick <b>“Add page to”</b>, then <b>“Home screen”</b>."],
        firefox: ["Tap the <b>⋮</b> menu.", "Pick <b>“Install”</b> or <b>“Add to Home screen”</b>."],
        integre: ["You're inside another app's browser (Instagram, Messenger…). First open this page in <b>Safari</b> or <b>Chrome</b>: <b>⋯</b> menu, then “Open in browser”."],
        ordi: ["In the address bar, click the install icon <b>⊕</b>, or use the browser menu."],
      },
      costumeTitre: "Your costume", costumeAide: "Pick what looks most like you.",
      detailsTitre: "The details", couleurTitre: "Main colour of your outfit", plusAttrs: "Load more",
      attrsAide: "Tick everything people can see from across the room.",
      suivant: "Next →", carteTitre: "Your card",
      pseudoModifiable: "You can change it from your profile.",
      faction: "Faction", classe: "Class",
      photos: "I agree that my scan photos may appear at the reveal.",
      pinTitre: "Your PIN (4 digits)",
      pinAide: "You'll use it to get your character back in another browser. Keep it in your head.",
      creer: "Create my character", tirage: "Digging through the bargain bins…",
      dejaReclamee: "Too late: someone just claimed this tag.",
      tutoTitre: "Your mission",
      tuto: [["📷", "<b>Scan strangers</b>: each person becomes a card in your collection, and moves you up the rankings."],
        ["🔁", "<b>See them again</b>: every déjà vu counts, and some hide badges."],
        ["👯", "<b>Someone in Pandémonium looks a little too much like you.</b> First clues at midnight."],
        ["🕔", "<b>5 a.m.: the reveal</b> for all of Pandémonium. Rankings freeze, medals stay."]],
      pouls: (j, r) => `⚡ <b>${j} player${j === 1 ? "" : "s"}</b> already in the game${r ? ` · record: <b>${r} card${r === 1 ? "" : "s"}</b>` : ""}.`,
      missionTitre: "🎯 Your first mission", missionSuivante: "🎯 Next mission", missionFaite: "✅ Mission complete!", missionsToutes: "All starter missions complete. Hats off.", missionsActives: "Active missions", missionMJ: "GM",
      missionAide: { installe_portail: "Follow the install steps, then open the app from your home screen.",
        collegue_de_rayon: (f) => `Find someone from ${f} and scan their tag.`,
        boucle_detectee: "Scan the same person 3 times, at least 5 minutes apart.",
        trans_classe: "Go to <b>Me</b> and change your class before 1 a.m." },
      premierScanBouton: "📷 Scan my first person", scannerQqn: "📷 Scan someone",
      cestParti: "Let's go",
      maintenant: "What now?",
      mBloque: (m) => `Scanner locked for ${m} more min. Patience, loyal customer.`,
      mRevelation: (m) => `Reveal in ${m} min. Last chance to push the quest!`,
      mPremiere: "Scan your first person: your first fake memory awaits.",
      mDefaut: "Scan someone you don't know.",
      scanner: "Scan", maCarte: "My card", maCollection: "My collection", cartes: (n) => `${n} card${n === 1 ? "" : "s"}`,
      cdBloque: "Scanner unlocks in", cdRevelation: "Reveal in", cdFin: "Closing in",
      saisieTitre: "Scan a tag",
      saisieAide: "The built-in scanner is coming soon. Meanwhile, scan the QR with your phone's camera, or enter the code printed under it.",
      nouvelle: "New item added", collectionN: (n) => `Your collection: ${n} item${n === 1 ? "" : "s"}.`,
      souvenirBientot: "Your shared fake memory is loading…",
      dejaVu: (n) => (n ? `DÉJÀ VU ×${n}` : "DÉJÀ VU"), panier: "Item already in your cart.", fenetre: "Too soon to count: the same déjà vu counts once every 5 minutes.",
      soiTitre: "That's you.", soi: "Your double is out there… somewhere. Clues start at midnight.",
      encore: "Scan again",
      spectMJ: "Go find the game master to get your own tag!",
      spectAide: "This tag already belongs to someone. Here's their card, read-only.",
      reintegrer: "Rejoin the game with my PIN",
      reintTitre: "Rejoin the game", reintAide: "Is this your tag? Enter your PIN to get your character and collection back.",
      valider: "Confirm", pinFaux: (n) => `Wrong PIN. ${n} more ${n === 1 ? "try" : "tries"}.`,
      pinBloque: (m) => `Too many tries. Recovery locked for ${m} more min.`,
      bienRevenu: "Character found. Welcome back to the store.",
      bloqueTitre: "Scanner locked", bloque: "Patience, loyal customer. This scan doesn't count.",
      specialTitre: "Game master's private collection", special: "This item comes from the game master's wardrobe. Its effects wake up soon.",
      aToiTitre: "Is this tag yours?",
      aToiAide: "Yes: it joins your character, with a new faction. No: you leave it for its future owner.",
      aToiAlerte: "Careful: you already have 3 tags. One more is overconsumption.",
      oui: "Yes, it's mine", non: "No, not mine",
      ajoutee: "Added to your character", nouvelleFaction: "New faction",
      surconsoTitre: "Don't take too many tags.",
      surconso: ["Scanner locked for 10 min", "Faction points cut in half", "Multi-faction bonus cancelled", "Quest contribution halved", "Instant corruption, no immunity until the end of the night"],
      tueTitre: "Nipped in the bud", tue: "The tag is still up for grabs: give it back to its owner or to the game master.",
      badgeGagne: "Badge earned",
      collectionTitre: "Collection", vide: "Your closet is empty. Go scan some people.",
      premierScan: "First scan", rescans: (n) => `Seen ${n} times`,
      moiTitre: "My profile", mesEtiquettes: "My tags", mesBadges: "My badges", aucunBadge: "No badges yet.",
      pseudo: "Name", enregistrer: "Save", fige: "Locked",
      pseudoFige: "Your name can't change after midnight.",
      costumeFige: "Your costume is locked: someone has already scanned you, or it's past midnight.",
      classeFigee: "Your class can't change anymore.",
      classeAlerte: "Changing class earns the “Class Shifter” badge.",
      modifierCostume: "Edit my costume", confidentialite: "Photos",
      langue: "Language / Langue", commentJouer: "Your mission",
      pinRappel: "Your PIN gets your character back: scan one of your tags in another browser, then tap “Rejoin the game with my PIN”.",
      enregistre: "Saved.", mj: "GM",
      ongAccueil: "Home", ongCollection: "Collection", ongClassements: "Rankings", ongBadges: "Badges", ongMedailles: "Medals", ongMoi: "Me",
      sousBadges: "Badges", sousClassements: "Rankings", bonus: (n) => `bonus`, toutPandemonium: "All of Pandémonium", tous: "All",
      medaillesBonus: "Bonus medals", medaillesBonusAide: "A top 3 in a ranking, across Pandémonium or within your faction, earns a medal. Provisional: everything freezes at the 5 a.m. reveal.",
      medaillesFigees: "Rankings frozen since the reveal.",
      voirMedailles: (m) => `My medals (${m.gagnes}/${m.total}${m.bonus ? ` +${m.bonus}` : ""})`,
      place: (r) => ["1st", "2nd", "3rd"][r - 1] || `${r}th`,
      lb: { collectionneurs: ["Collectors", "Different people scanned", (n) => `${n} ${n === 1 ? "person" : "people"}`], celebrites: ["Celebrities", "Different people who scanned you", (n) => `${n} scanner${n === 1 ? "" : "s"}`] },
      lbBientot: "Coming soon: Ghost, Infinite Loop, Business, Bridge, First Twins Reunited, Factions.",
      lbVide: "Nobody yet. Go scan!", lbToi: "You", lbPasClasse: "Not ranked yet: scan and get scanned.",
      lbParticipants: (n) => `${n} in the ranking`,
      badgesTitre: "Badges", badgesGagnes: "Earned", badgesAVenir: "To unlock",
      badgesVide: "No badges yet. You earn them by playing… or by misbehaving.",
      voirBadges: (n) => `My badges (${n})`, gagneA: (h) => `earned at ${h}`,
      integre: "You're inside an app's browser. Open this page in Safari or Chrome instead to keep your character.",
      pied: "Pandémonium · Montréal · November 7, 2026",
    },
  };
  let t = T[L];

  // ---------- Outils ----------
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2));
  const vibrer = (ms = 30) => { try { navigator.vibrate && navigator.vibrate(ms); } catch {} };
  const minutesAvant = (iso) => Math.max(1, Math.ceil((Date.parse(iso) - Date.now()) / 60000));

  async function api(chemin, corps) {
    const h = { "X-Dev-Maintenant": String(Date.now()) };
    const jeton = lire(CLE.jeton);
    if (jeton) h["X-Appareil"] = jeton;
    if (corps !== undefined) h["Content-Type"] = "application/json";
    let r;
    try {
      r = await fetch(chemin, { method: corps === undefined ? "GET" : "POST", headers: h, body: corps === undefined ? undefined : JSON.stringify(corps) });
    } catch {
      throw { erreur: "reseau" };
    }
    const j = await r.json().catch(() => ({ erreur: "serveur" }));
    if (!r.ok && j.erreur) throw Object.assign(j, { status: r.status });
    return j;
  }

  const etat = { moi: lireJson(CLE.moi), heures: null };
  function majMoi(d) {
    if (d.jeton) ecrire(CLE.jeton, d.jeton);
    if (d.heures) etat.heures = d.heures;
    etat.moi = d.personnage ? d : null;
    ecrire(CLE.moi, etat.moi ? JSON.stringify(etat.moi) : null);
  }
  let installSignalee = false;
  async function chargerMoi() {
    try { majMoi(await api("/api/moi")); } catch (e) { if (e.erreur !== "reseau") throw e; }
    if (!installSignalee && etat.moi && etat.moi.personnage) { installSignalee = true; signalerInstallation(); }
    return etat.moi;
  }

  // ---------- Rendu ----------
  const app = $("#app");
  let minuterie = null;
  function rendre(html, { onglet = null, classe = "" } = {}) {
    const integre = /Instagram|FBAN|FBAV|Snapchat|TikTok|Line\//i.test(navigator.userAgent);
    app.innerHTML = (integre ? `<div class="bandeau">${t.integre}</div>` : "")
      + `<main class="ecran ${onglet ? "" : "sans-tabs"} ${classe}">${html}</main>` + (onglet ? onglets(onglet) : "");
    window.scrollTo(0, 0);
    demarrerComptes();
  }
  function onglets(actif) {
    const o = (id, href, e, l) => `<a href="${href}" data-nav class="${id === "scan" ? "scan" : ""}"${actif === id ? ' aria-current="page"' : ""}><span class="e">${e}</span>${l}</a>`;
    return `<nav class="onglets">${o("accueil", "/", "🏠", t.ongAccueil)}${o("collection", "/collection", "🗂️", t.ongCollection)}${o("scan", "/saisie", "📷", t.scanner)}${o("medailles", "/medailles", "🏅", t.ongMedailles + (medaillesNonVues() ? '<i class="pastille"></i>' : ""))}${o("moi", "/moi", "👤", t.ongMoi)}</nav>`;
  }
  function toast(texte) {
    const d = document.createElement("div"); d.className = "toast apparait"; d.textContent = texte;
    document.body.appendChild(d); setTimeout(() => d.remove(), 2600);
  }

  // Comptes à rebours : <span data-fin="ISO" data-fini="texte"></span>
  function demarrerComptes() {
    clearInterval(minuterie);
    const els = [...document.querySelectorAll("[data-fin]")];
    if (!els.length) return;
    const p = (n) => String(n).padStart(2, "0");
    const tic = () => {
      for (const e of els) {
        const s = Math.max(0, Math.floor((Date.parse(e.dataset.fin) - Date.now()) / 1000));
        if (!s) { e.textContent = e.dataset.fini || "00:00"; if (e.dataset.recharger) { clearInterval(minuterie); setTimeout(route, 800); } continue; }
        const j = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
        e.textContent = (j ? `${j} ${t.jour} ` : "") + (j || h ? p(h) + ":" : "") + p(m) + ":" + p(s % 60);
      }
    };
    tic(); minuterie = setInterval(tic, 1000);
  }

  function carte(c, { grand = true } = {}) {
    const ty = typeDe(c.type), co = couleurDe(c.couleur);
    const attrs = (c.attributs || []).map((a) => attrDe(a)).filter(Boolean);
    return `<div class="carte apparait" style="--teinte:${co.hex}">
      ${c.est_mj ? `<span class="chip or mj">${t.mj}</span>` : ""}
      <div class="tete"><div class="e">${ty.e}</div><div><div class="pseudo">${esc(c.pseudo)}</div>
      <div class="classe">${esc(classeLib(c.classe))} · ${esc(lib(co))}</div></div></div>
      ${grand && attrs.length ? `<div class="attributs" title="${esc(attrs.map(lib).join(", "))}">${attrs.map((a) => a.e).join(" ")}</div>` : ""}
      ${(c.factions || []).length ? `<div class="factions">${c.factions.map((f) => `<span class="faction">${esc(factionLib(f))}</span>`).join("")}</div>` : ""}
    </div>`;
  }
  const badgeGagne = (id) => {
    const b = BADGES[id]; if (!b) return "";
    return `<a class="badge-gagne apparait" href="/medailles" data-nav style="color:inherit;text-decoration:none"><span class="e">${b[0]}</span><div><small>${t.badgeGagne}</small><b>${L === "en" ? b[2] : b[1]}</b><small>${L === "en" ? b[4] : b[3]}</small></div></a>`;
  };
  const formulaireCode = (valeur = "") => `<form class="boite" id="f-code" autocomplete="off">
      <label class="mono petit muted" for="code">${t.saisir}</label>
      <input type="text" class="saisie" id="code" name="code" maxlength="6" autocapitalize="characters" spellcheck="false" value="${esc(valeur)}" required style="margin-top:8px">
      <button class="bouton">${t.voir}</button></form>`;
  function brancherCode() {
    const f = $("#f-code"); if (!f) return;
    f.onsubmit = (ev) => {
      ev.preventDefault();
      const c = $("#code").value.toUpperCase().replace(/[\s-]/g, "");
      if (c) aller(`/${encodeURIComponent(c)}?s=m`);
    };
  }
  function ecranErreur(e, reprise) {
    rendre(`<span class="chip">ERR</span><h1 class="moyen">${e && e.erreur === "reseau" ? t.reseau : t.erreur}</h1>
      <button class="bouton" id="b-re">${t.reessayer}</button><a class="bouton sec" href="/" data-nav>${t.accueil}</a>`, { onglet: etat.moi ? "accueil" : null });
    $("#b-re").onclick = reprise || route;
  }

  // ---------- Installation (FEAT-021) ----------
  let invitationInstall = null; // Chrome et Edge sur Android : invitation native
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); invitationInstall = e; });
  addEventListener("appinstalled", () => { invitationInstall = null; });
  function navigateur() {
    const ua = navigator.userAgent;
    if (matchMedia("(display-mode: standalone)").matches || navigator.standalone) return "installee";
    if (/Instagram|FBAN|FBAV|Snapchat|TikTok|Line\//i.test(ua)) return "integre";
    const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    if (ios) return /CriOS|EdgiOS/.test(ua) ? "chromeIos" : /FxiOS|OPiOS/.test(ua) ? "autreIos" : "safari";
    if (/Android/.test(ua)) return /SamsungBrowser/.test(ua) ? "samsung" : /Firefox/.test(ua) ? "firefox" : "chrome";
    return "ordi";
  }

  // ---------- Navigation ----------
  function aller(chemin, remplacer = false) {
    history[remplacer ? "replaceState" : "pushState"](null, "", chemin);
    route();
  }
  document.addEventListener("click", (ev) => {
    const a = ev.target.closest && ev.target.closest("a[data-nav]");
    if (!a || ev.metaKey || ev.ctrlKey) return;
    ev.preventDefault(); aller(a.getAttribute("href"));
  });
  addEventListener("popstate", () => route());

  async function route() {
    const p = location.pathname;
    try {
      if (p === "/") return accueil();
      if (p === "/collection") return collection();
      if (p === "/moi") return fiche();
      if (p === "/saisie") return saisie();
      if (p === "/tuto") return tutoriel();
      if (p === "/badges" || p === "/medailles") return medailles();
      const m = p.match(/^\/([^/]{1,12})\/?$/);
      if (m) return scanner(decodeURIComponent(m[1]).toUpperCase());
      return inconnue("");
    } catch (e) {
      console.error(e); ecranErreur(e);
    }
  }

  // ---------- Accueil (E-01, interface §2bis) ----------
  async function accueil() {
    if (!etat.moi) await chargerMoi(); else chargerMoi().then((m) => { if (location.pathname === "/") m ? dessinerAccueil() : accueil(); });
    if (!etat.moi) {
      const h = etat.heures || (await api("/api/moi").catch(() => ({}))).heures;
      const avant = h && Date.now() < Date.parse(h.debut);
      rendre(`<span class="chip">${t.soldes}</span><h1>DÉJÀ<br>VU&nbsp;!</h1><p class="muted">${t.sousTitre}</p>
        ${avant ? `<div class="boite"><p class="mono petit muted" style="margin:0 0 4px">${t.reveil}</p><div class="compte" data-fin="${h.debut}" data-fini="${esc(t.ouvert)}"></div></div>` : ""}
        <p>${t.accueilAide}</p>${formulaireCode()}<p class="muted petit">${t.accueilSans}</p><footer>${t.pied}</footer>`);
      brancherCode();
      return;
    }
    dessinerAccueil();
  }
  function dessinerAccueil() {
    const d = etat.moi, pe = d.personnage, h = d.heures || etat.heures || {};
    const now = Date.now();
    let compte = "", ligne = t.mDefaut;
    if (pe.bloque_jusqu_a && Date.parse(pe.bloque_jusqu_a) > now) {
      compte = `<p class="mono petit muted" style="margin:0 0 4px">${t.cdBloque}</p><div class="compte" data-fin="${pe.bloque_jusqu_a}" data-recharger="1"></div>`;
      ligne = t.mBloque(minutesAvant(pe.bloque_jusqu_a));
    } else if (h.revelation && now < Date.parse(h.revelation) && Date.parse(h.revelation) - now < 3600e3) {
      compte = `<p class="mono petit muted" style="margin:0 0 4px">${t.cdRevelation}</p><div class="compte" data-fin="${h.revelation}"></div>`;
      ligne = t.mRevelation(minutesAvant(h.revelation));
    } else {
      if (h.revelation && h.fin && now >= Date.parse(h.revelation) && now < Date.parse(h.fin)) {
        compte = `<p class="mono petit muted" style="margin:0 0 4px">${t.cdFin}</p><div class="compte" data-fin="${h.fin}"></div>`;
      }
      if (!d.nb_cartes) ligne = t.mPremiere;
    }
    const ty = typeDe(pe.type);
    rendre(`${compte ? `<div class="boite">${compte}</div>` : ""}
      <p class="maintenant"><small>${t.maintenant}</small>${esc(ligne)}</p>
      <a class="gros-scan" href="/saisie" data-nav><span>📷</span>${t.scanner}</a>
      <div class="discret"><a href="/moi" data-nav><b>${ty.e}</b><span>${t.maCarte}</span><div class="petit" style="margin-top:4px">${esc(pe.pseudo)}</div></a>
      <a href="/collection" data-nav><b>${d.nb_cartes}</b><span>${t.maCollection}</span><div class="petit" style="margin-top:4px">${t.cartes(d.nb_cartes)}</div></a>
      ${(() => { const m = compteMedailles(); return `<a href="/medailles" data-nav class="carte-medailles"><b>${m.gagnes}<small>/${m.total}</small></b><span>${t.ongMedailles}</span>
        <div class="petit" style="margin-top:4px">${m.bonus ? `<em class="or" style="font-style:normal">+${m.bonus} ${t.bonus(m.bonus)}</em> ${m.emojis}` : ""}</div>${medaillesNonVues() ? '<i class="pastille"></i>' : ""}</a>`; })()}</div>`, { onglet: "accueil" });
  }

  function saisie() {
    rendre(`<h2>${t.saisieTitre}</h2><p class="muted">${t.saisieAide}</p>${formulaireCode()}`, { onglet: etat.moi ? "scan" : null });
    brancherCode();
    setTimeout(() => { const i = $("#code"); i && i.focus(); }, 50);
  }

  function inconnue(code) {
    rendre(`<span class="chip">404</span><h1>DÉJÀ<br>VU&nbsp;?</h1><p>${t.inconnue}</p><p class="muted">${t.inconnueAide}</p>${formulaireCode(code)}`, { onglet: etat.moi ? "scan" : null });
    brancherCode();
  }

  // ---------- Ta mission (ex-tutoriel) : personnage, preuve sociale, règles, première mission, premier geste ----------
  // Missions de départ (badges faciles) ; chaque joueur commence par une mission différente selon son identifiant.
  const MISSIONS = ["collegue_de_rayon", "boucle_detectee", "installe_portail", "trans_classe"];
  function missionDe(d) {
    const gagnes = new Set((d.badges || []).map((b) => b.badge));
    let h = 0; for (const c of d.personnage.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    // App déjà installée (badge acquis ou app ouverte depuis l'écran d'accueil) : cette mission n'est jamais distribuée
    const installee = gagnes.has("installe_portail") || matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    const liste = MISSIONS.filter((m) => !(installee && m === "installe_portail"));
    const ordre = liste.map((_, i) => liste[(h + i) % liste.length]);
    const dispo = (m) => !gagnes.has(m) && (m !== "trans_classe" || d.droits.classe) && (m !== "collegue_de_rayon" || (d.factions || []).length);
    return { premiere: ordre[0], faite: gagnes.has(ordre[0]), courante: ordre.find(dispo) || null };
  }
  /** Une mission de départ (badge) : emoji, nom, aide personnalisée. */
  function ligneMission(d, id) {
    const b = BADGES[id], aide = t.missionAide[id];
    const fac = (d.factions || []).map((f) => FACTIONS[f]).filter(Boolean).map((f) => `<b>${f.e} ${esc(lib(f))}</b>`).join(L === "en" ? " or " : " ou ");
    return `<div class="mission"><span class="e">${b[0]}</span><div><b>${L === "en" ? b[2] : b[1]}</b><small>${typeof aide === "function" ? aide(fac) : aide}</small></div></div>`;
  }
  /** Missions actives (onglet Collection) : mission du MJ (ADM-19, LOT-6) puis mission de départ. Vide s'il n'y en a aucune. */
  function blocMissions(d) {
    const lignes = [];
    if (d.mission_mj) { // forme attendue au LOT-6 : { titre, condition, fin }
      const mm = d.mission_mj;
      lignes.push(`<div class="mission"><span class="e">🏷️</span><div><b>${esc(mm.titre)} <span class="chip or">${t.missionMJ}</span></b><small>${esc(mm.condition)}</small>
        ${mm.fin ? `<div class="compte" data-fin="${esc(mm.fin)}"></div>` : ""}</div></div>`);
    }
    const m = missionDe(d);
    if (m.courante) lignes.push(ligneMission(d, m.courante));
    return lignes.length ? `<div class="boite mission-boite"><p class="titre-inst" style="color:var(--pink);font-size:17px">🎯 ${t.missionsActives}</p>${lignes.join('<hr class="sep">')}</div>` : "";
  }

  async function tutoriel() {
    const d = await chargerMoi().catch(() => null);
    const regles = `<ul class="liste tuto">${t.tuto.map(([e, l]) => `<li><span class="e">${e}</span><span>${l}</span></li>`).join("")}</ul>`;
    if (!d || !d.personnage) return rendre(`<h2>${t.tutoTitre}</h2>${regles}<a class="bouton" href="/saisie" data-nav>${t.premierScanBouton}</a>`);
    const pe = d.personnage, ty = typeDe(pe.type), cl = CLASSES[pe.classe];
    const mesFactions = (d.factions || []).map((f) => FACTIONS[f]).filter(Boolean);
    const m = missionDe(d);
    const mission = (m.courante ? (m.faite ? `<p class="ok petit" style="margin:0 0 6px">${t.missionFaite}</p>` : "") + ligneMission(d, m.courante) : "")
      || `<p class="petit">${t.missionsToutes}</p>`;
    rendre(`<p class="perso-ligne"><span>${ty.e}</span> <b>${esc(pe.pseudo)}</b> · ${mesFactions.map((f) => f.e).join(" ")}${cl ? ` · ${esc(L === "en" ? cl[1] : cl[0])}` : ""}</p>
      <h2 style="margin-top:4px">${t.tutoTitre}</h2>
      ${d.partie && d.partie.joueurs > 1 ? `<p class="pouls">${t.pouls(d.partie.joueurs, d.partie.record)}</p>` : ""}
      <div class="boite mission-boite"><p class="titre-inst" style="color:var(--pink)">${m.faite || !m.courante ? t.missionSuivante : t.missionTitre}</p>${mission}</div>
      <a class="bouton" href="/saisie" data-nav style="margin-top:0">${d.nb_cartes ? t.scannerQqn : t.premierScanBouton}</a>
      ${regles}`, { onglet: "moi" });
  }
  // BDG-4 : l'app installée se signale une fois (le badge s'affiche dans Médailles)
  async function signalerInstallation() {
    if (!(matchMedia("(display-mode: standalone)").matches || navigator.standalone)) return;
    if (!etat.moi || !etat.moi.personnage || (etat.moi.badges || []).some((b) => b.badge === "installe_portail")) return;
    try { const r = await api("/api/installe", {}); if (r.badge) { await chargerMoi(); toast(`🖖 ${t.badgeGagne} : ${BADGES.installe_portail[L === "en" ? 2 : 1]}`); } } catch {}
  }

  // ---------- Scan (FEAT-002, arbre de décision de FEAT-003) ----------
  async function scanner(code) {
    const source = q.get("s") === "m" ? "code_manuel" : q.get("s") === "a" ? "app" : "qr_externe";
    rendre(`<div class="centre"><p class="chargement">${t.lecture}</p></div>`);
    let r;
    try {
      r = await api("/api/scan", { code, id_client: uuid(), source, horodatage: new Date().toISOString() });
    } catch (e) {
      if (e.type === "inconnue" || e.status === 404) return inconnue(code);
      return ecranErreur(e, () => scanner(code));
    }
    if (r.type === "inconnue") return inconnue(code);
    // L'URL redevient l'accueil : recharger la page ne rejoue pas le scan
    const fixer = () => history.replaceState(null, "", "/");
    const o = etat.moi ? "accueil" : null;
    switch (r.type) {
      case "retiree": fixer(); return rendre(`<span class="chip">${esc(code)}</span><h1>ERR</h1><p>${t.retiree}</p>`, { onglet: o });
      case "ferme": fixer(); return rendre(`<span class="chip">${esc(code)}</span><h1 class="moyen">06:00</h1><p>${t.ferme}</p>`, { onglet: o });
      case "bientot":
        return rendre(`<span class="chip">${esc(code)}</span><h1>DÉJÀ<br>VU&nbsp;!</h1><div class="boite"><div class="code">${esc(code)}</div><p>${t.attente}</p>
          <p class="mono petit muted" style="margin-bottom:4px">${t.reveil}</p><div class="compte" data-fin="${r.debut}" data-fini="${esc(t.ouvert)}" data-recharger="1"></div></div><footer>${t.pied}</footer>`);
      case "bloque": fixer(); return rendre(`<span class="chip">${t.bloqueTitre}</span><div class="boite alerte"><div class="compte" data-fin="${r.jusqu_a}"></div><p>${t.bloque}</p></div>`, { onglet: "accueil" });
      case "special": fixer(); vibrer(); return rendre(`<span class="chip or">${t.specialTitre}</span><h1 class="moyen">✦ ${esc(code)} ✦</h1><p>${t.special}</p>`, { onglet: o });
      case "creation": return creation(code, r.mj);
      case "a_toi": return aToi(code);
      case "spectateur": fixer(); return spectateur(r);
      case "soi_meme": fixer(); return rendre(`<span class="chip vert">${esc(code)}</span><h1 class="moyen">${t.soiTitre}</h1>${carte(r.carte)}<p>${t.soi}</p>
          <a class="bouton" href="/" data-nav>${t.accueil}</a>`, { onglet: "accueil" });
      case "nouvelle_carte":
        fixer(); vibrer(40); chargerMoi();
        return rendre(`<span class="chip vert">${t.nouvelle}</span>
          ${carte(r.carte)}<p class="muted">${t.collectionN(r.nb_cartes)}</p>${(r.badges || []).map(badgeGagne).join("")}
          <a class="bouton" href="/saisie" data-nav>${t.encore}</a><a class="bouton sec" href="/" data-nav>${t.accueil}</a>`, { onglet: "accueil" });
      case "deja_vu":
        fixer(); vibrer(20);
        return rendre(`<div class="echo">${[0, 1, 2].map(() => `<div>${t.dejaVu(r.compte === false ? null : r.n)}</div>`).join("")}</div><p>${t.panier}</p>${(r.badges || []).map(badgeGagne).join("")}${r.compte === false ? `<p class="petit muted">${t.fenetre}</p>` : ""}${carte(r.carte, { grand: false })}
          <a class="bouton" href="/saisie" data-nav>${t.encore}</a>`, { onglet: "accueil" });
      default: return ecranErreur({}, () => scanner(code));
    }
  }

  // ---------- Création en 4 écrans (FEAT-003, RG-003-7, RG-003-9) ----------
  function creation(code, estMJ) {
    let b = lireJson(CLE.brouillon);
    if (!b || b.code !== code) b = { code, etape: 1, type: null, couleur: null, attributs: [], photos: false, tirage: null };
    const sauver = () => ecrire(CLE.brouillon, JSON.stringify(b));
    const entete = () => `<div class="etapes"><button class="retour" id="b-retour">${t.retour}</button><span>${t.etape(b.etape)}</span></div>`;
    const retour = () => { if (b.etape > 1) { b.etape--; sauver(); dessiner(); } else { ecrire(CLE.brouillon, null); aller("/", true); } };

    function dessiner() {
      const nav = navigateur();
      if (b.etape === 1 && !b.resterIci && (nav === "integre" || nav === "autreIos")) return autreNavigateur();
      if (b.etape === 1) {
        const n = navigateur();
        rendre(`${entete()}<h2>${t.avTitre}</h2>${estMJ ? `<p><span class="chip or">${t.mj}</span></p>` : ""}
          <ul class="liste">${t.av.map((x) => `<li>${x}</li>`).join("")}</ul>
          ${n === "installee" ? `<p class="ok"><b>${t.instDeja}</b></p>` : `<div class="boite installer"><p class="titre-inst">📲 ${t.instTitre}</p><p class="petit">${t.instPourquoi}</p>
            ${invitationInstall ? `<button class="bouton vert" id="b-inst">${t.instBouton}</button>` : `<ol class="etapes-inst">${t.inst[n].map((x) => `<li>${x}</li>`).join("")}</ol>`}
            ${n !== "integre" && n !== "ordi" ? `<p class="petit">${t.instPuis(esc(code))}</p>` : ""}
            ${["safari", "chromeIos", "autreIos"].includes(n) ? `<p class="petit muted">${t.instIos}</p>` : ""}</div>`}
          <button class="bouton${n === "installee" ? "" : " sec"}" id="b-ok">${n === "installee" ? t.compris : t.instSans}</button>`);
        $("#b-ok").onclick = () => { b.etape = 2; sauver(); dessiner(); };
        const bi = $("#b-inst");
        if (bi) bi.onclick = async () => { invitationInstall.prompt(); const r = await invitationInstall.userChoice; if (r.outcome === "accepted") { invitationInstall = null; dessiner(); } };
      } else if (b.etape === 2) {
        rendre(`${entete()}<h2>${t.costumeTitre}</h2><p class="muted">${t.costumeAide}</p>
          <div class="grille-types">${TYPES.map((ty) => `<button class="type" data-t="${ty.id}" aria-pressed="${b.type === ty.id}"><span class="e">${ty.e}</span><span>${lib(ty)}</span></button>`).join("")}</div>
          ${b.type ? `<button class="bouton" id="b-suiv">${t.suivant}</button>` : ""}`);
        app.querySelectorAll(".type").forEach((x) => (x.onclick = () => {
          if (b.type !== x.dataset.t) b.tirage = null;
          b.type = x.dataset.t; b.etape = 3; sauver(); vibrer(15); dessiner();
        }));
        if (b.type) $("#b-suiv").onclick = () => { b.etape = 3; sauver(); dessiner(); };
      } else if (b.etape === 3) {
        rendre(`${entete()}<h2>${t.detailsTitre}</h2><h3>${t.couleurTitre}</h3>
          <div class="couleurs">${COULEURS.map((c) => `<button class="couleur" data-c="${c.id}" aria-pressed="${b.couleur === c.id}"><i style="background:${c.hex}"></i>${lib(c)}</button>`).join("")}</div>
          <h3>${t.attrsAide}</h3>
          ${grilleAttrs(b.attributs)}
          <button class="bouton" id="b-suiv" ${b.couleur ? "" : "disabled"}>${t.suivant}</button>`);
        app.querySelectorAll(".couleur").forEach((x) => (x.onclick = () => {
          if (b.couleur !== x.dataset.c) b.tirage = null;
          b.couleur = x.dataset.c; sauver();
          app.querySelectorAll(".couleur").forEach((y) => y.setAttribute("aria-pressed", y === x));
          $("#b-suiv").disabled = false;
        }));
        app.querySelectorAll(".attr").forEach((x) => (x.onclick = () => {
          const a = x.dataset.a, i = b.attributs.indexOf(a);
          i >= 0 ? b.attributs.splice(i, 1) : b.attributs.push(a); sauver();
          x.setAttribute("aria-pressed", i < 0);
        }));
        brancherPlusAttrs();
        $("#b-suiv").onclick = () => { if (b.couleur) { b.etape = 4; sauver(); dessiner(); } };
      } else {
        dessinerCarte();
      }
      const r = $("#b-retour"); if (r) r.onclick = retour;
    }

    // Navigateur intégré ou navigateur iPhone peu fiable : proposer le navigateur principal AVANT la réclamation
    function autreNavigateur() {
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
      // Sur iPhone, on accepte Safari et Chrome (même moteur, tous deux installent l'app)
      const nom = ios ? (L === "en" ? "Safari or Chrome" : "Safari ou Chrome") : "Chrome";
      const lien = `${location.origin}/${code}`;
      const boutons = ios
        ? [["Safari", "x-safari-" + lien], ["Chrome", lien.replace(/^https?:/, (m) => (m === "https:" ? "googlechromes:" : "googlechrome:"))]]
        : [["Chrome", `intent://${location.host}/${code}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(lien)};end`]];
      rendre(`${entete()}<h2>${t.redirTitre(nom)}</h2><p>${t.redir(nom)}</p>
        <div class="${boutons.length > 1 ? "duo" : ""}">${boutons.map(([n, u]) => `<a class="bouton vert" href="${esc(u)}">${t.redirOuvrir(n)}</a>`).join("")}</div>
        <div class="boite"><input type="text" id="lien" readonly value="${esc(lien)}" style="font-family:var(--mono);font-size:16px">
        <button class="bouton" id="b-copier">📋 ${t.redirCopier}</button><p class="petit muted">${t.redirManuel(nom)}</p></div>
        <button class="lien" id="b-ici">${t.redirIci}</button>`);
      $("#b-retour").onclick = retour;
      $("#b-copier").onclick = async () => {
        const champ = $("#lien");
        try { await navigator.clipboard.writeText(lien); } catch { champ.select(); try { document.execCommand("copy"); } catch {} }
        vibrer(); toast(t.redirCopie(nom));
      };
      $("#b-ici").onclick = () => { b.resterIci = true; sauver(); dessiner(); };
    }

    async function dessinerCarte() {
      if (!b.tirage || Date.now() / 1000 > b.tirage.exp) {
        rendre(`${entete()}<div class="centre"><p class="chargement">${t.tirage}</p></div>`);
        $("#b-retour").onclick = retour;
        try {
          const r = await api("/api/tirage", { code, type: b.type, couleur: b.couleur, attributs: b.attributs, langue: L });
          b.tirage = { ...r, exp: Date.now() / 1000 + 25 * 60 }; sauver();
        } catch (e) {
          if (e.erreur === "deja_reclamee") { ecrire(CLE.brouillon, null); return rendre(`<span class="chip">${esc(code)}</span><h1 class="moyen">${t.dejaReclamee}</h1><a class="bouton" href="/" data-nav>${t.accueil}</a>`); }
          return ecranErreur(e, dessinerCarte);
        }
      }
      const ti = b.tirage, f = FACTIONS[ti.faction];
      rendre(`${entete()}<h2>${t.carteTitre}</h2>
        ${carte({ pseudo: ti.pseudo, type: b.type, couleur: b.couleur, attributs: b.attributs, classe: ti.classe, factions: [ti.faction], est_mj: estMJ })}
        <p class="petit ok">✎ ${t.pseudoModifiable}</p>
        <div class="boite"><h3 style="margin-top:0">${t.faction}</h3><p style="margin:0"><b>${f.e} ${lib(f)}</b><br><span class="muted">« ${L === "en" ? f.den : f.dfr} »</span></p>
        <h3>${t.classe}</h3><p style="margin:0"><b>${esc(classeLib(ti.classe))}</b></p></div>
        <label class="case"><input type="checkbox" id="c-photos" ${b.photos ? "checked" : ""}><span>${t.photos}</span></label>
        <h3>${t.pinTitre}</h3>
        <input class="pin" id="pin" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" placeholder="····">
        <p class="petit muted">${t.pinAide}</p>
        <button class="bouton vert" id="b-creer" disabled>${t.creer}</button><p class="err" id="msg"></p>`);
      $("#b-retour").onclick = retour;
      $("#c-photos").onchange = (e) => { b.photos = e.target.checked; sauver(); };
      const pin = $("#pin"), bouton = $("#b-creer");
      pin.oninput = () => { pin.value = pin.value.replace(/\D/g, "").slice(0, 4); bouton.disabled = pin.value.length !== 4; };
      bouton.onclick = async () => {
        bouton.disabled = true;
        try {
          const r = await api("/api/creer", { jeton: ti.jeton, type: b.type, couleur: b.couleur, attributs: b.attributs, photos: b.photos, pin: pin.value, langue: L, id_client: uuid() });
          majMoi(r); ecrire(CLE.brouillon, null); vibrer(60);
          aller("/tuto", true);
        } catch (e) {
          if (e.erreur === "tirage_expire") { b.tirage = null; sauver(); return dessinerCarte(); }
          if (e.erreur === "deja_reclamee") { ecrire(CLE.brouillon, null); return rendre(`<span class="chip">${esc(code)}</span><h1 class="moyen">${t.dejaReclamee}</h1><a class="bouton" href="/" data-nav>${t.accueil}</a>`); }
          if (e.erreur === "deja_un_personnage") { await chargerMoi(); return aller("/", true); }
          $("#msg").textContent = e.erreur === "reseau" ? t.reseau : t.erreur; bouton.disabled = false;
        }
      };
    }
    dessiner();
  }

  // ---------- Étiquette vierge scannée par un joueur (FEAT-003) ----------
  function aToi(code) {
    const n = (etat.moi && etat.moi.etiquettes || []).length;
    rendre(`<span class="chip">${esc(code)}</span><h2>${t.aToiTitre}</h2><p class="muted">${t.aToiAide}</p>
      ${n >= 3 ? `<div class="boite alerte"><b>${t.aToiAlerte}</b></div>` : ""}
      <button class="bouton" id="b-oui">${t.oui}</button><button class="bouton sec" id="b-non">${t.non}</button><p class="err" id="msg"></p>`, { onglet: "accueil" });
    const repondre = async (aMoi) => {
      $("#b-oui").disabled = $("#b-non").disabled = true;
      try {
        const r = await api("/api/etiquette", { code, a_moi: aMoi });
        history.replaceState(null, "", "/");
        chargerMoi();
        if (r.type === "tue") {
          vibrer();
          return rendre(`<span class="chip">${esc(code)}</span><h1 class="moyen">${t.tueTitre}</h1>${r.badge ? badgeGagne(r.badge) : ""}<p>${t.tue}</p>
            <a class="bouton" href="/" data-nav>${t.accueil}</a>`, { onglet: "accueil" });
        }
        vibrer(50);
        const f = FACTIONS[r.faction];
        rendre(`<span class="chip vert">${esc(code)}</span><h1 class="moyen">${t.ajoutee}</h1>
          <div class="boite"><h3 style="margin-top:0">${t.nouvelleFaction}</h3><p style="margin:0"><b>${f.e} ${lib(f)}</b><br><span class="muted">« ${L === "en" ? f.den : f.dfr} »</span></p></div>
          ${r.surconsommation ? `<div class="boite alerte"><h2 style="margin-top:0">${t.surconsoTitre}</h2><ul class="liste">${t.surconso.map((x) => `<li>${x}</li>`).join("")}</ul>
            <div class="compte" data-fin="${r.jusqu_a}"></div></div>` : ""}
          ${(r.badges || []).map(badgeGagne).join("")}<a class="bouton" href="/" data-nav>${t.accueil}</a>`, { onglet: "accueil" });
      } catch (e) {
        if (e.erreur === "deja_reclamee") return rendre(`<h1 class="moyen">${t.dejaReclamee}</h1><a class="bouton" href="/" data-nav>${t.accueil}</a>`, { onglet: "accueil" });
        if (e.erreur === "bloque") return scanner(code);
        $("#msg").textContent = e.erreur === "reseau" ? t.reseau : t.erreur;
        $("#b-oui").disabled = $("#b-non").disabled = false;
      }
    };
    $("#b-oui").onclick = () => repondre(true);
    $("#b-non").onclick = () => repondre(false);
  }

  // ---------- Spectateur et réintégration par PIN (FEAT-019, RG-019-3) ----------
  function spectateur(r) {
    rendre(`<h1 class="moyen">${t.spectMJ}</h1><p class="muted">${t.spectAide}</p>${carte(r.carte)}
      <button class="lien" id="b-pin">${t.reintegrer}</button>`);
    $("#b-pin").onclick = () => reintegrer(r.code);
  }
  function reintegrer(code) {
    rendre(`<button class="retour" id="b-retour">${t.retour}</button><h2>${t.reintTitre}</h2><p class="muted">${t.reintAide}</p>
      <p class="code">${esc(code)}</p>
      <input class="pin" id="pin" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" placeholder="····">
      <button class="bouton" id="b-ok" disabled>${t.valider}</button><p class="err" id="msg"></p>`);
    $("#b-retour").onclick = () => aller("/" + code, true);
    const pin = $("#pin"), b = $("#b-ok");
    pin.oninput = () => { pin.value = pin.value.replace(/\D/g, "").slice(0, 4); b.disabled = pin.value.length !== 4; };
    pin.focus();
    b.onclick = async () => {
      b.disabled = true;
      try {
        majMoi(await api("/api/reintegrer", { code, pin: pin.value }));
        vibrer(60); toast(t.bienRevenu); aller("/", true);
      } catch (e) {
        $("#msg").textContent = e.erreur === "pin_faux" ? t.pinFaux(e.restants) : e.erreur === "pin_bloque" ? t.pinBloque(minutesAvant(e.jusqu_a)) : e.erreur === "reseau" ? t.reseau : t.erreur;
        pin.value = ""; pin.focus();
      }
    };
  }

  // ---------- Collection (FEAT-004) ----------
  async function collection() {
    if (!(await chargerMoi())) return aller("/", true);
    rendre(`<h2>${t.collectionTitre}</h2><p class="chargement">${t.lecture}</p>`, { onglet: "collection" });
    let r;
    try { r = await api("/api/collection"); } catch (e) { return ecranErreur(e, collection); }
    const missions = etat.moi && etat.moi.personnage ? blocMissions(etat.moi) : "";
    if (!r.cartes.length) return rendre(`<h2>${t.collectionTitre}</h2>${missions}<p class="maintenant">${t.vide}</p><a class="bouton" href="/saisie" data-nav>📷 ${t.scanner}</a>`, { onglet: "collection" });
    rendre(`<h2>${t.collectionTitre} · ${r.cartes.length}</h2>${missions}<div class="grille-cartes">${r.cartes.map((c, i) => `<button class="mini" data-i="${i}" style="--teinte:${couleurDe(c.couleur).hex}">
        ${c.nb_scans > 1 ? `<span class="n">×${c.nb_scans}</span>` : ""}<div class="e">${typeDe(c.type).e}</div><div class="pseudo">${esc(c.pseudo)}</div></button>`).join("")}</div>`, { onglet: "collection" });
    app.querySelectorAll(".mini").forEach((x) => (x.onclick = () => {
      const c = r.cartes[+x.dataset.i];
      rendre(`<button class="retour" id="b-retour">${t.retour}</button>${carte(c)}
        <ul class="liste"><li>${(c.attributs || []).map((a) => attrDe(a)).filter(Boolean).map((a) => `${a.e} ${lib(a)}`).join("<br>") || "—"}</li>
        <li class="mono petit">${t.premierScan} : ${new Date(c.premier_scan_le).toLocaleTimeString(L === "en" ? "en-CA" : "fr-CA", { hour: "2-digit", minute: "2-digit" })}</li>
        <li class="mono petit">${t.rescans(c.nb_scans)}</li></ul>`, { onglet: "collection" });
      $("#b-retour").onclick = collection;
    }));
  }

  // ---------- Médailles : badges + classements (FEAT-015, option C) ----------
  // Total = badges non secrets ; les médailles de classement (top 3) sont des bonus.
  const CLE_VUS = "dv-medailles-vues" + SUFFIXE;
  const MEDAILLE = ["🥇", "🥈", "🥉"];
  const clesMedailles = () => [
    ...((etat.moi && etat.moi.badges) || []).map((b) => "b:" + b.badge),
    ...((etat.moi && etat.moi.medailles) || []).map((m) => `m:${m.classement}:${m.faction || "tous"}:${m.rang}`),
  ];
  function medaillesNonVues() {
    const vus = lireJson(CLE_VUS) || [];
    return clesMedailles().some((k) => !vus.includes(k));
  }
  function compteMedailles() {
    const gagnes = ((etat.moi && etat.moi.badges) || []).length;
    const secretsGagnes = ((etat.moi && etat.moi.badges) || []).filter((b) => BADGES[b.badge] && BADGES[b.badge][5]).length;
    const total = Object.values(BADGES).filter((b) => !b[5]).length + secretsGagnes;
    const m = (etat.moi && etat.moi.medailles) || [];
    return { gagnes, total, bonus: m.length, emojis: m.map((x) => MEDAILLE[x.rang - 1]).join("") };
  }
  const sousOnglets = (actif) => `<div class="sous-onglets"><a href="/medailles" data-nav${actif === "badges" ? ' aria-current="page"' : ""}>${t.sousBadges}</a><a href="/medailles?vue=classements" data-nav${actif === "classements" ? ' aria-current="page"' : ""}>${t.sousClassements}</a></div>`;

  async function medailles() {
    if (!(await chargerMoi())) return aller("/", true);
    if (new URLSearchParams(location.search).get("vue") === "classements") return classements();
    ecrire(CLE_VUS, JSON.stringify(clesMedailles()));
    const gagnes = etat.moi.badges || [], m = compteMedailles();
    const ids = new Set(gagnes.map((b) => b.badge));
    const heure = (iso) => new Date(iso).toLocaleTimeString(L === "en" ? "en-CA" : "fr-CA", { hour: "2-digit", minute: "2-digit" });
    const ligne = (b, quand) => `<li class="badge${quand ? " gagne" : ""}"><span class="e">${b[0]}</span><div><b>${L === "en" ? b[2] : b[1]}</b>
      <small>${L === "en" ? b[4] : b[3]}</small>${quand ? `<small class="mono or">${t.gagneA(heure(quand))}</small>` : ""}</div></li>`;
    const aVenir = Object.entries(BADGES).filter(([id, b]) => !ids.has(id) && !b[5]);
    const bonus = (etat.moi.medailles || []).map((x) => { const lb = t.lb[x.classement] || [x.classement, "", String];
      return `<li class="badge gagne bonus"><span class="e">${MEDAILLE[x.rang - 1]}</span><div><b>${lb[0]} · ${t.place(x.rang)}</b>
        <small>${x.faction ? esc(factionLib(x.faction)) : t.toutPandemonium} · ${lb[2](x.n)}</small></div></li>`; }).join("");
    rendre(`<h2>${t.ongMedailles} · ${m.gagnes}/${m.total}${m.bonus ? ` <span class="or">+${m.bonus}</span>` : ""}</h2>${sousOnglets("badges")}
      ${bonus ? `<h3>${t.medaillesBonus}</h3><ul class="liste-badges">${bonus}</ul><p class="petit muted">${t.medaillesBonusAide}</p>` : ""}
      <h3>${t.badgesGagnes}</h3>${gagnes.length ? `<ul class="liste-badges">${gagnes.map((g) => ligne(BADGES[g.badge] || ["🏅", g.badge, g.badge, "", ""], g.obtenu_le)).join("")}</ul>` : `<p class="muted">${t.badgesVide}</p>`}
      <h3>${t.badgesAVenir}</h3><ul class="liste-badges">${aVenir.map(([, b]) => ligne(b, null)).join("")}</ul>`, { onglet: "medailles" });
  }

  async function classements() {
    rendre(`<h2>${t.ongMedailles}</h2>${sousOnglets("classements")}<p class="chargement">${t.lecture}</p>`, { onglet: "medailles" });
    const f = new URLSearchParams(location.search).get("faction");
    let r;
    try { r = await api("/api/classements" + (f ? "?faction=" + encodeURIComponent(f) : "")); } catch (e) { return ecranErreur(e, classements); }
    // Jusqu'à 3 factions : seul le filtre actif affiche son nom ; les autres, leur emoji (nom en aria-label)
    const filtres = `<div class="filtres">${[null, ...r.mes_factions].map((x) => {
      const actif = (r.faction || null) === x, nom = x ? lib(FACTIONS[x]) : t.toutPandemonium;
      const texte = actif ? (x ? `${FACTIONS[x].e} ${esc(nom)}` : nom) : x ? FACTIONS[x].e : t.tous;
      return `<a href="/medailles?vue=classements${x ? "&faction=" + x : ""}" data-nav aria-label="${esc(nom)}"${actif ? ' aria-current="page"' : ""}${!actif && x ? ' class="emoji"' : ""}>${texte}</a>`;
    }).join("")}</div>`;
    const bloc = (c) => {
      const lb = t.lb[c.id] || [c.id, "", String];
      const lignes = c.top.map((x) => `<li class="${x.moi ? "moi" : ""}"><span class="rang">${x.rang <= 3 ? MEDAILLE[x.rang - 1] : "#" + x.rang}</span>
        <span class="qui">${typeDe(x.type).e} ${esc(x.pseudo)}</span><span class="n">${x.n}</span></li>`).join("");
      const moi = c.moi ? (c.moi.rang > 10 ? `<li class="moi"><span class="rang">#${c.moi.rang}</span><span class="qui">${t.lbToi}</span><span class="n">${c.moi.n}</span></li>` : "")
        : `<p class="petit muted">${t.lbPasClasse}</p>`;
      return `<div class="boite"><p class="titre-lb">${lb[0]}</p><p class="petit muted" style="margin:2px 0 8px">${lb[1]} · ${t.lbParticipants(c.participants)}</p>
        ${c.top.length ? `<ol class="classement">${lignes}${moi.startsWith("<li") ? moi : ""}</ol>${moi.startsWith("<p") ? moi : ""}` : `<p class="muted">${t.lbVide}</p>`}</div>`;
    };
    rendre(`<h2>${t.ongMedailles}</h2>${sousOnglets("classements")}${filtres}${r.fige ? `<p class="or petit">${t.medaillesFigees}</p>` : `<p class="petit muted">${t.medaillesBonusAide}</p>`}
      ${r.classements.map(bloc).join("")}<p class="petit muted">${t.lbBientot}</p>`, { onglet: "medailles" });
  }

  // ---------- Fiche (E-05 ; RG-003-11, RG-003-12, REQ-010) ----------
  async function fiche() {
    if (!(await chargerMoi())) return aller("/", true);
    const d = etat.moi, pe = d.personnage, dr = d.droits;
    rendre(`<h2>${t.moiTitre}</h2>${carte({ ...pe, factions: d.etiquettes.map((e) => e.faction) })}
      <h3>${t.pseudo}</h3>${dr.pseudo ? `<form id="f-pseudo" class="duo" style="grid-template-columns:1fr auto"><input type="text" id="pseudo" maxlength="28" value="${esc(pe.pseudo)}"><button class="bouton" style="margin:0;width:auto">${t.enregistrer}</button></form>` : `<p class="muted">🔒 ${t.pseudoFige}</p>`}
      <h3>${t.classe}</h3>${dr.classe ? `<select id="classe">${Object.keys(CLASSES).map((k) => `<option value="${k}" ${k === pe.classe ? "selected" : ""}>${esc(classeLib(k))}</option>`).join("")}</select><p class="petit muted">${t.classeAlerte}</p>` : `<p class="muted">🔒 ${t.classeFigee}</p>`}
      <h3>${t.costumeTitre}</h3>${dr.costume ? `<button class="bouton sec" id="b-costume">${t.modifierCostume}</button>` : `<p class="muted">🔒 ${t.costumeFige}</p>`}
      <h3>${t.confidentialite}</h3><label class="case"><input type="checkbox" id="c-photos" ${pe.photos_ok ? "checked" : ""}><span>${t.photos}</span></label>
      <h3>${t.mesEtiquettes}</h3><ul class="liste">${d.etiquettes.map((e) => `<li><span class="mono">${esc(e.code)}</span> · ${esc(factionLib(e.faction))}</li>`).join("")}</ul>
      <h3>${t.ongMedailles}</h3><a class="bouton sec" href="/medailles" data-nav style="margin-top:0">🏅 ${t.voirMedailles(compteMedailles())}</a>
      <p class="petit muted">🔢 ${t.pinRappel}</p>
      <h3>${t.langue}</h3><div class="duo"><button class="bouton ${L === "fr" ? "" : "sec"}" data-l="fr">Français</button><button class="bouton ${L === "en" ? "" : "sec"}" data-l="en">English</button></div>
      <a class="bouton sec" href="/tuto" data-nav>${t.commentJouer}</a>`, { onglet: "moi" });

    const envoyer = async (corps) => {
      try {
        const r = await api("/api/modifier", corps);
        majMoi(r); toast(t.enregistre);
        if (r.badge) { fiche().then(() => app.querySelector("main").insertAdjacentHTML("afterbegin", badgeGagne(r.badge))); return; }
      } catch (e) { toast(e.erreur === "reseau" ? t.reseau : t.erreur); }
      fiche();
    };
    const fp = $("#f-pseudo"); if (fp) fp.onsubmit = (e) => { e.preventDefault(); envoyer({ pseudo: $("#pseudo").value }); };
    const cl = $("#classe"); if (cl) cl.onchange = () => envoyer({ classe: cl.value });
    $("#c-photos").onchange = (e) => envoyer({ photos: e.target.checked });
    app.querySelectorAll("[data-l]").forEach((x) => (x.onclick = () => { L = x.dataset.l; t = T[L]; ecrire(CLE.langue, L); document.documentElement.lang = L; fiche(); }));
    const bc = $("#b-costume"); if (bc) bc.onclick = () => modifierCostume(pe, envoyer);
  }

  // Grille des attributs : 12 d'office, 12 de plus derrière « Charger plus » (ouverte si l'un d'eux est coché)
  const NB_ATTRS_BASE = 12;
  function grilleAttrs(choisis) {
    const ouverte = choisis.some((id) => ATTRS.findIndex((a) => a.id === id) >= NB_ATTRS_BASE);
    const btn = (a, i) => `<button class="attr" data-a="${a.id}" aria-pressed="${choisis.includes(a.id)}"${i >= NB_ATTRS_BASE && !ouverte ? " hidden" : ""}><span class="e">${a.e}</span>${lib(a)}</button>`;
    return `<div class="attrs">${ATTRS.map(btn).join("")}</div>${ouverte ? "" : `<button class="bouton sec" id="b-plus-attrs" type="button">＋ ${t.plusAttrs}</button>`}`;
  }
  function brancherPlusAttrs() {
    const p = $("#b-plus-attrs"); if (!p) return;
    p.onclick = () => { app.querySelectorAll(".attr[hidden]").forEach((x) => (x.hidden = false)); p.remove(); };
  }

  function modifierCostume(pe, envoyer) {
    const c = { type: pe.type, couleur: pe.couleur, attributs: [...pe.attributs] };
    rendre(`<button class="retour" id="b-retour">${t.retour}</button><h2>${t.costumeTitre}</h2>
      <div class="grille-types">${TYPES.map((ty) => `<button class="type" data-t="${ty.id}" aria-pressed="${c.type === ty.id}"><span class="e">${ty.e}</span><span>${lib(ty)}</span></button>`).join("")}</div>
      <h3>${t.couleurTitre}</h3><div class="couleurs">${COULEURS.map((x) => `<button class="couleur" data-c="${x.id}" aria-pressed="${c.couleur === x.id}"><i style="background:${x.hex}"></i>${lib(x)}</button>`).join("")}</div>
      <h3>${t.attrsAide}</h3>${grilleAttrs(c.attributs)}
      <button class="bouton" id="b-ok">${t.enregistrer}</button>`, { onglet: "moi" });
    $("#b-retour").onclick = fiche;
    const choix = (sel, cle) => app.querySelectorAll(sel).forEach((x) => (x.onclick = () => {
      c[cle] = x.dataset[cle === "type" ? "t" : "c"];
      app.querySelectorAll(sel).forEach((y) => y.setAttribute("aria-pressed", y === x));
    }));
    choix(".type", "type"); choix(".couleur", "couleur"); brancherPlusAttrs();
    app.querySelectorAll(".attr").forEach((x) => (x.onclick = () => {
      const i = c.attributs.indexOf(x.dataset.a); i >= 0 ? c.attributs.splice(i, 1) : c.attributs.push(x.dataset.a);
      x.setAttribute("aria-pressed", i < 0);
    }));
    $("#b-ok").onclick = () => envoyer(c);
  }

  route();
})();
