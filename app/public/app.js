// Application du joueur « Déjà vu ! » — LOT-1 : scan, création en 4 écrans, collection, fiche, PIN.
// LOT-2 : faux souvenirs, déjà vu et paliers, réactions, file d'attente hors ligne, temps d'écran.
// LOT-3 : quête collective en direct, paliers, soldes éclair, glitch global et messages du MJ.
// Le serveur est la source de vérité (DEC-052) : le stockage local n'est qu'un cache.
(() => {
  "use strict";

  // ---------- Stockage local (un espace par téléphone du banc d'essai : window.name = T1…T4) ----------
  const SUFFIXE = /^T\d$/.test(window.name) ? "-" + window.name : "";
  const CLE = { jeton: "dv-appareil" + SUFFIXE, langue: "dv-langue" + SUFFIXE, moi: "dv-moi" + SUFFIXE, brouillon: "dv-brouillon" + SUFFIXE,
    collection: "dv-collection" + SUFFIXE, file: "dv-file" + SUFFIXE, ecran: "dv-ecran" + SUFFIXE, evts: "dv-evenements" + SUFFIXE };
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
    triples_partiels: ["👥", "Deux sur trois", "Two out of Three", "Retrouver un de tes deux doubles de triplés.", "Find one of your two triplet doubles.", true],
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
      missionTitre: "🎯 Ta première mission", missionSuivante: "🎯 Mission suivante", missionFaite: "✅ Mission accomplie !", missionsToutes: "Toutes les missions de départ sont accomplies. Chapeau.", missionsActives: "Missions actives", missionMJ: "MJ", tonPerso: "Ton personnage",
      missionAide: { installe_portail: "Suis les étapes d'installation, puis ouvre l'app depuis ton écran d'accueil.",
        collegue_de_rayon: (f) => `Trouve quelqu'un de ${f} et scanne son étiquette.`,
        boucle_detectee: "Scanne la même personne 3 fois, à 5 minutes d'écart au moins.",
        trans_classe: "Va dans <b>Moi</b> et change de classe avant 1&nbsp;h." },
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
      cmpTitre: "Face à face", cmpToi: "Toi", cmpLignes: ["Pièces", "Déjà vus", "Médailles"],
      communs: (n) => n ? `Vous avez déjà vu les mêmes ${n} personne${n > 1 ? "s" : ""}.` : "Aucune connaissance commune… pour l'instant.",
      souvenirTitre: "Votre faux souvenir commun",
      souvenirFlou: "Ta mémoire flanche : ce souvenir s'efface. Arrête de rescanner en boucle et ta jauge remontera.",
      invitation: "Va rescanner la personne qui a le plus marqué ta mémoire.",
      oeuf3: "Boucle détectée. Cet article est déjà dans ton panier. Trois fois. La Matrice prend des notes.",
      oeuf6: (h) => `Il est ${h}. Il était déjà ${h}. Il sera encore ${h}. Rien ne change, sauf ton score.`,
      oeuf13: "Félicitations : tu atteins le statut Client fidèle, niveau Malédiction. Ce badge n'existe pas. Tu ne l'as jamais eu. Tu ne t'en souviendras pas.",
      ticket: "Ticket de caisse", ticketPied: "Ni repris, ni échangé.",
      perte: (n) => `Boucle infinie : −1 souvenir. Ta jauge : ${n}.`,
      jauge: "Jauge de souvenirs",
      jaugeAide: "On te rescanne : +1 souvenir. Tu rescannes en boucle (plus de 10 fois dans l'heure) : −1. Sous 5, tes faux souvenirs deviennent flous.",
      reagir: "Laisse une trace", reactionsRecues: "Réactions reçues", aucuneReaction: "Personne n'a encore réagi à ta carte.",
      horsLigne: (n) => (n ? `${n} scan${n > 1 ? "s" : ""} en attente de synchronisation` : "Hors ligne"),
      enFileTitre: "Scan gardé en mémoire",
      enFile: "Pas de réseau. Ton scan partira tout seul dès que le réseau revient, sans doublon.",
      synchro: (n) => `${n} scan${n > 1 ? "s" : ""} en attente envoyé${n > 1 ? "s" : ""}.`,
      reessayerMaintenant: "Réessayer maintenant",
      // Quête collective (LOT-3)
      quete: "Quête", queteComplete: "Quête complète",
      palierAtteint: (n) => `Palier ${n} atteint !`,
      paliers: ["Solde éclair : pendant 5 min, chaque nouvelle carte compte double.", "La Matrice a remarqué votre soirée.",
        "La Matrice prépare un indice bonus pour les jumeaux pas encore réunis.", "Deuxième solde éclair : 5 min de nouvelles cartes doubles.",
        "Quête complète : l'image de la révélation sera entière."],
      solde: "Solde éclair", soldeAide: "Chaque nouvelle carte compte double",
      glitchDefaut: "La Matrice a remarqué votre soirée.",
      messageMJ: "Message du MJ", fermer: "Fermer",
      eclairTitre: "Mission éclair", eclairPts: (n) => `+${n} points pour ta faction`, eclairReussie: (n) => `Mission éclair réussie ! +${n} points pour ta faction.`,
      eclair: { "E-1": () => "Scanne 3 nouvelles personnes.", "E-2": (e) => `Scanne quelqu'un dont l'emoji est ${e}.`,
        "E-3": (a, b) => `Scanne quelqu'un qui porte ${a} ET ${b}.`, "E-4": () => "Rescanne ta toute première rencontre." },
      barreRevelation: "Révélation dans", barreFin: "Fermeture dans",
      annonce30: "Révélation dans 30 minutes. Dernière chance de faire grimper la quête !",
      revTitre: "Révélation", revCharge: "La Matrice rassemble vos souvenirs…", revPasEncore: "La révélation n'a pas encore eu lieu. Rendez-vous à 5 h.",
      revStats: (n, l) => `${n} personnages · ${l} connexions`, revImage: (pct, n) => `image révélée à ${pct} % · ${n}/5 paliers`,
      revEcran: (d, pct) => `<b>${d}</b> à regarder ton écran, soit <b>${pct} %</b> de ta soirée.`,
      revFaction: (f) => `Tu termines la soirée chez ${f}.`, revFactionAide: "Plusieurs factions : tu restes dans celle où tu as marqué le moins de points.",
      revMoi: "Me retrouver", revVue: "Vue d'ensemble", revToi: "TOI", revRevoir: "✦ Revoir la révélation", revApercu: "Aperçu du MJ : état actuel, rien n'est figé.",
      revSansFaction: "Sans faction", revConnexions: (n) => `${n} connexion${n > 1 ? "s" : ""}`, revErreur: "Impossible de charger la révélation. Réessaie dans un instant.",
      dejaVu: (n) => (n ? `DÉJÀ VU ×${n}` : "DÉJÀ VU"), panier: "Article déjà dans ton panier.", fenetre: (m) => `Trop tôt pour compter : un même déjà vu compte une fois toutes les ${m} minute${m > 1 ? "s" : ""}.`,
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
      missionTitre: "🎯 Your first mission", missionSuivante: "🎯 Next mission", missionFaite: "✅ Mission complete!", missionsToutes: "All starter missions complete. Hats off.", missionsActives: "Active missions", missionMJ: "GM", tonPerso: "Your character",
      missionAide: { installe_portail: "Follow the install steps, then open the app from your home screen.",
        collegue_de_rayon: (f) => `Find someone from ${f} and scan their tag.`,
        boucle_detectee: "Scan the same person 3 times, at least 5 minutes apart.",
        trans_classe: "Go to <b>Me</b> and change your class before 1&nbsp;a.m." },
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
      cmpTitre: "Face to face", cmpToi: "You", cmpLignes: ["Items", "Déjà vus", "Medals"],
      communs: (n) => n ? `You've both already seen the same ${n} ${n > 1 ? "people" : "person"}.` : "No mutual acquaintances… yet.",
      souvenirTitre: "Your shared fake memory",
      souvenirFlou: "Your memory is slipping: this one is fading. Stop rescanning in loops and your gauge will recover.",
      invitation: "Go rescan the person who left the biggest mark on your memory.",
      oeuf3: "Loop detected. This item is already in your cart. Three times. The Matrix is taking notes.",
      oeuf6: (h) => `It's ${h}. It was already ${h}. It will still be ${h}. Nothing changes except your score.`,
      oeuf13: "Congratulations: you've reached Loyal Customer status, Curse tier. This badge doesn't exist. You never got it. You won't remember it.",
      ticket: "Receipt", ticketPied: "No returns, no exchanges.",
      perte: (n) => `Infinite loop: −1 memory. Your gauge: ${n}.`,
      jauge: "Memory gauge",
      jaugeAide: "Someone rescans you: +1 memory. You rescan in loops (more than 10 times in an hour): −1. Below 5, your fake memories blur.",
      reagir: "Leave a mark", reactionsRecues: "Reactions received", aucuneReaction: "Nobody has reacted to your card yet.",
      horsLigne: (n) => (n ? `${n} scan${n > 1 ? "s" : ""} waiting to sync` : "Offline"),
      enFileTitre: "Scan saved",
      enFile: "No network. Your scan will be sent automatically when the network is back, with no duplicates.",
      synchro: (n) => `${n} waiting scan${n > 1 ? "s" : ""} sent.`,
      reessayerMaintenant: "Try again now",
      quete: "Quest", queteComplete: "Quest complete",
      palierAtteint: (n) => `Tier ${n} reached!`,
      paliers: ["Flash sale: for 5 min, every new card counts double.", "The Matrix has noticed your party.",
        "The Matrix is preparing a bonus clue for twins not yet reunited.", "Second flash sale: 5 min of double new cards.",
        "Quest complete: the reveal image will be whole."],
      solde: "Flash sale", soldeAide: "Every new card counts double",
      glitchDefaut: "The Matrix has noticed your party.",
      messageMJ: "Message from the GM", fermer: "Close",
      eclairTitre: "Flash mission", eclairPts: (n) => `+${n} points for your faction`, eclairReussie: (n) => `Flash mission accomplished! +${n} points for your faction.`,
      eclair: { "E-1": () => "Scan 3 new people.", "E-2": (e) => `Scan someone whose emoji is ${e}.`,
        "E-3": (a, b) => `Scan someone wearing ${a} AND ${b}.`, "E-4": () => "Rescan your very first encounter." },
      barreRevelation: "Reveal in", barreFin: "Closing in",
      annonce30: "Reveal in 30 minutes. Last chance to push the quest!",
      revTitre: "Reveal", revCharge: "The Matrix is gathering your memories…", revPasEncore: "The reveal hasn't happened yet. See you at 5 a.m.",
      revStats: (n, l) => `${n} characters · ${l} connections`, revImage: (pct, n) => `picture revealed at ${pct}% · ${n}/5 milestones`,
      revEcran: (d, pct) => `<b>${d}</b> staring at your screen, or <b>${pct}%</b> of your night.`,
      revFaction: (f) => `You end the night with ${f}.`, revFactionAide: "Several factions: you stay in the one where you scored the fewest points.",
      revMoi: "Find me", revVue: "Overview", revToi: "YOU", revRevoir: "✦ Replay the reveal", revApercu: "GM preview: current state, nothing is frozen.",
      revSansFaction: "No faction", revConnexions: (n) => `${n} connection${n > 1 ? "s" : ""}`, revErreur: "Couldn't load the reveal. Try again in a moment.",
      dejaVu: (n) => (n ? `DÉJÀ VU ×${n}` : "DÉJÀ VU"), panier: "Item already in your cart.", fenetre: (m) => `Too soon to count: the same déjà vu counts once every ${m} minute${m > 1 ? "s" : ""}.`,
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

  async function api(chemin, corps, { keepalive = false } = {}) {
    const h = { "X-Dev-Maintenant": String(Date.now()) };
    const jeton = lire(CLE.jeton);
    if (jeton) h["X-Appareil"] = jeton;
    if (corps !== undefined) h["Content-Type"] = "application/json";
    let r;
    try {
      r = await fetch(chemin, { method: corps === undefined ? "GET" : "POST", headers: h, body: corps === undefined ? undefined : JSON.stringify(corps), keepalive });
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
      + `<main class="ecran ${onglet ? "" : "sans-tabs"} ${classe}">${onglet ? '<a class="barre-quete" id="barre-quete" href="/" data-nav></a>' : ""}${html}</main>` + (onglet ? onglets(onglet) : "");
    window.scrollTo(0, 0);
    demarrerComptes();
    majIndicateur();
    majBarre();
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
  // Mission éclair globale (FEAT-013) : texte de la condition, à partir des paramètres tirés par le serveur
  function texteEclair(d) {
    const f = t.eclair[d.code]; if (!f) return "";
    if (d.code === "E-2") return f(typeDe(d.type).e);
    if (d.code === "E-3") { const [a, b] = (d.attributs || []).map((x) => { const at = attrDe(x); return at ? `${at.e} ${lib(at)}` : x; }); return f(a, b); }
    return f();
  }
  // Comparaison (FEAT-010) : stats des deux joueurs et connaissances communes, après chaque scan d'un autre joueur
  function comparaisonBloc(r) {
    const c = r.comparaison; if (!c) return "";
    const cles = ["cartes", "deja_vus", "badges"];
    const lignes = cles.map((k, i) => {
      const a = c.moi[k], b = c.autre[k];
      return `<tr><td class="${a > b ? "fort" : ""}">${a}</td><th>${t.cmpLignes[i]}</th><td class="${b > a ? "fort" : ""}">${b}</td></tr>`;
    }).join("");
    const avatars = c.avatars.map((p) => `<span class="avatar" style="--teinte:${couleurDe(p.couleur).hex}" title="${esc(p.pseudo)}">${typeDe(p.type).e}</span>`).join("")
      + (c.communs > c.avatars.length ? `<span class="avatar plus">+${c.communs - c.avatars.length}</span>` : "");
    return `<div class="boite comparaison apparait"><small>${t.cmpTitre}</small>
      <table><tr><th>${t.cmpToi}</th><th></th><th>${esc(r.carte.pseudo)}</th></tr>${lignes}</table>
      <p>${t.communs(c.communs)}</p>${avatars ? `<div class="avatars">${avatars}</div>` : ""}</div>`;
  }
  // Faux souvenir (FEAT-006) : élément principal de l'écran de nouvelle carte (RG-006-9)
  const souvenirBloc = (s) => s ? `<blockquote class="souvenir${s.flou ? " flou" : ""} apparait"><small>${t.souvenirTitre}</small>
      <p>${esc(L === "en" ? s.en : s.fr)}</p>${s.flou ? `<small class="muted">${t.souvenirFlou}</small>` : ""}</blockquote>` : "";
  // Réactions d'Halloween en un toucher (FEAT-014)
  const EMOJIS = ["🎃", "👻", "💀", "🦇", "🕷️", "🧛", "🔮", "🖤"];
  const reactionsBloc = (cible, mes = []) => `<div class="reactions" data-cible="${esc(cible)}"><small>${t.reagir}</small>
      <div class="emojis">${EMOJIS.map((e) => `<button class="reac" data-e="${e}" aria-pressed="${mes.includes(e)}">${e}</button>`).join("")}</div></div>`;
  function brancherReactions(apres) {
    app.querySelectorAll(".reactions").forEach((box) => box.querySelectorAll(".reac").forEach((b) => (b.onclick = async () => {
      const actif = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", actif); vibrer(15);
      try {
        const r = await api("/api/reaction", { cible: box.dataset.cible, emoji: b.dataset.e, actif });
        if (apres) apres(box.dataset.cible, r.mes_reactions);
      } catch (e) { b.setAttribute("aria-pressed", !actif); toast(e.erreur === "reseau" ? t.reseau : t.erreur); }
    })));
  }
  const heureCourte = (iso) => new Date(iso).toLocaleTimeString(L === "en" ? "en-CA" : "fr-CA", { hour: "2-digit", minute: "2-digit" });
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
      if (p === "/revelation") return revelation();
      const m = p.match(/^\/([^/]{1,12})\/?$/);
      if (m) return scanner(decodeURIComponent(m[1]).toUpperCase());
      return inconnue("");
    } catch (e) {
      console.error(e); ecranErreur(e);
    }
  }

  // ---------- Accueil (E-01, interface §2bis) ----------
  /** Garde une copie de la collection pour la consulter hors ligne (CA-004-3). */
  const precharger = () => api("/api/collection").then((r) => ecrire(CLE.collection, JSON.stringify(r))).catch(() => {});

  async function accueil() {
    if (etat.moi && navigator.onLine) precharger();
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
      ligne = ligneRoles(d, !d.nb_cartes) || (!d.nb_cartes ? t.mPremiere : ligne); // textes §5.2 : chat noir, jumeau, première carte, corrompu
    }
    const ty = typeDe(pe.type);
    rendre(`${compte ? `<div class="boite">${compte}</div>` : ""}
      ${blocEffets(d)}<p class="maintenant"><small>${t.maintenant}</small>${esc(ligne)}</p>${blocPush(d)}
      ${h.revelation && now >= Date.parse(h.revelation) ? `<a class="bouton rev-revoir" href="/revelation" data-nav>${t.revRevoir}</a>` : ""}
      <a class="gros-scan" href="/saisie" data-nav><span>📷</span>${t.scanner}</a>
      <div class="discret"><a href="/moi" data-nav><b>${ty.e}</b><span>${t.maCarte}</span><div class="petit" style="margin-top:4px">${esc(pe.pseudo)}</div></a>
      <a href="/collection" data-nav><b>${d.nb_cartes}</b><span>${t.maCollection}</span><div class="petit" style="margin-top:4px">${t.cartes(d.nb_cartes)}</div></a>
      ${(() => { const m = compteMedailles(); return `<a href="/medailles" data-nav class="carte-medailles"><b>${m.gagnes}<small>/${m.total}</small></b><span>${t.ongMedailles}</span>
        <div class="petit" style="margin-top:4px">${m.bonus ? `<em class="or" style="font-style:normal">+${m.bonus} ${t.bonus(m.bonus)}</em> ${m.emojis}` : ""}</div>${medaillesNonVues() ? '<i class="pastille"></i>' : ""}</a>`; })()}</div>`, { onglet: "accueil" });
    brancherPush();
  }

  // ---------- Notifications push (FEAT-016, LOT-3 D) ----------
  // RG-016-1 : demandée après la première carte, avec une raison, jamais au chargement. Sur iPhone, seule l'app
  // installée a PushManager : dans Safari, la carte n'apparaît pas (l'écran d'installation parle des notifications).
  const TP = {
    fr: { titre: "🔔 Ne rate rien", texte: "Ton double, le chat noir, les missions du MJ et la révélation : on te prévient même téléphone verrouillé.",
      activer: "Activer les notifications", plusTard: "Plus tard", refus: "Notifications refusées : les annonces resteront en bannière dans l'app.", ok: "Notifications activées.",
      echec: "Impossible d'activer les notifications pour l'instant. Les annonces restent en bannière dans l'app." },
    en: { titre: "🔔 Don't miss a thing", texte: "Your double, the black cat, GM missions and the reveal: we'll tell you, even with your phone locked.",
      activer: "Turn on notifications", plusTard: "Later", refus: "Notifications declined: announcements will stay as banners in the app.", ok: "Notifications on.",
      echec: "Couldn't turn on notifications right now. Announcements stay as banners in the app." },
  };
  const CLE_PUSH = "dv-push-plus-tard" + SUFFIXE;
  const pushPossible = () => !SUFFIXE && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  function blocPush(d) {
    if (!pushPossible() || Notification.permission !== "default" || !d.nb_cartes) return "";
    if (Date.now() - (Number(lire(CLE_PUSH)) || 0) < 2 * 3600e3) return ""; // « Plus tard » : on redemande 2 h après
    const x = TP[L] || TP.fr;
    return `<div class="boite push-boite" id="push-boite"><p class="titre-inst">${x.titre}</p><p class="petit">${x.texte}</p>
      <button class="bouton sec" id="b-push">${x.activer}</button><button class="lien" id="b-push-non">${x.plusTard}</button></div>`;
  }
  function brancherPush() {
    const b = $("#b-push"), n = $("#b-push-non");
    if (b) b.onclick = activerPush;
    if (n) n.onclick = () => { ecrire(CLE_PUSH, String(Date.now())); $("#push-boite").remove(); };
  }
  async function activerPush() {
    const x = TP[L] || TP.fr;
    const p = await Notification.requestPermission().catch(() => "denied");
    const boite = $("#push-boite"); if (boite) boite.remove();
    if (p !== "granted") { if (p === "denied") toast(x.refus); return; }
    toast((await abonnerPush()) ? x.ok : x.echec);
  }
  const versOctets = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
  async function abonnerPush() {
    try {
      const reg = await navigator.serviceWorker.ready;
      let abo = await reg.pushManager.getSubscription();
      if (!abo) {
        const { cle } = await api("/api/push/cle");
        if (!cle) return false;
        abo = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: versOctets(cle) });
      }
      await api("/api/push/abonner", { endpoint: abo.endpoint });
      return true;
    } catch { return false; }
  }
  // Permission déjà accordée : (ré)abonne cet appareil une fois par lancement (nouveau personnage, abonnement perdu)
  let pushVerifie = false;
  function verifierPush() {
    if (pushVerifie || !pushPossible() || Notification.permission !== "granted" || !etat.moi || !etat.moi.personnage) return;
    pushVerifie = true; abonnerPush();
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
    if (d.mission_mj) { // ADM-19 : { code, donnees, fin }
      const mm = missionMJ(d.mission_mj);
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
    rendre(`<h2>${t.tutoTitre}</h2>
      <a class="perso-carte" href="/moi" data-nav style="--teinte:${couleurDe(pe.couleur).hex}"><span class="e">${ty.e}</span><div>
        <small>${t.tonPerso}</small><b>${esc(pe.pseudo)}</b>
        <span class="details">${mesFactions.map((f) => `${f.e} ${esc(lib(f))}`).join("<br>")}${cl ? `<br>${esc(L === "en" ? cl[1] : cl[0])}` : ""}</span></div></a>
      ${d.partie && d.partie.joueurs > 1 ? `<p class="pouls">${t.pouls(d.partie.joueurs, d.partie.record)}</p>` : ""}
      <div class="boite mission-boite"><p class="titre-inst" style="color:var(--pink)">${m.faite || !m.courante ? t.missionSuivante : t.missionTitre}</p>${mission}</div>
      <a class="bouton" href="/saisie" data-nav>${d.nb_cartes ? t.scannerQqn : t.premierScanBouton}</a>
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
    const corps = { code, id_client: uuid(), source, horodatage: new Date().toISOString() };
    try {
      r = await api("/api/scan", corps);
    } catch (e) {
      if (e.type === "inconnue" || e.status === 404) return inconnue(code);
      // Hors ligne (RG-021-3) : on garde le scan et on l'enverra au retour du réseau. La création, elle, demande le réseau.
      if (e.erreur === "reseau" && etat.moi && etat.moi.personnage) return scanEnFile(corps);
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
      case "bloque": { fixer(); const pg = piegeDeBlocage(r); rendre(ecranPiege(pg), { onglet: "accueil" }); return animerPiege(pg.effet); }
      case "piege": fixer(); vibrer([80, 60, 80]); chargerMoi(); rendre(ecranPiege(r), { onglet: "accueil" }); return animerPiege(r.effet);
      case "legendaire": fixer(); vibrer([30, 50, 30, 50, 90]); chargerMoi(); setTimeout(rafraichirDirect, 300);
        return rendre(`${ecranLegendaire(r)}<a class="bouton" href="/saisie" data-nav>${t.encore}</a><a class="bouton sec" href="/" data-nav>${t.accueil}</a>`, { onglet: "accueil" });
      case "suspendu": fixer(); return rendre(`<span class="chip">⛔</span><h1 class="moyen">${esc(M().sanctions[4].split(".")[0])}</h1><div class="boite alerte"><p>${M().suspendu}</p></div>`, { onglet: "accueil" });
      case "special": fixer(); vibrer(); return rendre(`<span class="chip or">${t.specialTitre}</span><h1 class="moyen">✦ ${esc(code)} ✦</h1><p>${t.special}</p>`, { onglet: o });
      case "creation": return creation(code, r.mj);
      case "a_toi": return aToi(code);
      case "spectateur": fixer(); return spectateur(r);
      case "soi_meme": fixer(); return rendre(`<span class="chip vert">${esc(code)}</span><h1 class="moyen">${t.soiTitre}</h1>${carte(r.carte)}<p>${t.soi}</p>
          <a class="bouton" href="/" data-nav>${t.accueil}</a>`, { onglet: "accueil" });
      case "nouvelle_carte":
        fixer(); vibrer(40); chargerMoi(); precharger(); setTimeout(rafraichirDirect, 300);
        rendre(`<span class="chip vert">${t.nouvelle}</span>${souvenirBloc(r.souvenir)}
          ${carte(r.carte)}<p class="muted">${t.collectionN(r.nb_cartes)}</p>${(r.badges || []).map(badgeGagne).join("")}
          ${comparaisonBloc(r)}${reactionsBloc(r.carte.id, r.mes_reactions)}
          <a class="bouton" href="/saisie" data-nav>${t.encore}</a><a class="bouton sec" href="/" data-nav>${t.accueil}</a>`, { onglet: "accueil" });
        brancherReactions(); return apresScanRoles(r);
      case "deja_vu":
        fixer(); vibrer(r.palier ? [30, 60, 30] : 20); chargerMoi(); precharger();
        rendre(ecranDejaVu(r), { onglet: "accueil", classe: r.palier ? "palier-" + r.palier : "" });
        brancherReactions(); return apresScanRoles(r);
      default: return ecranErreur({}, () => scanner(code));
    }
  }

  // Déjà vu (FEAT-005) et ses paliers ×3, ×6, ×13 (textes §2)
  function ecranDejaVu(r) {
    const titre = t.dejaVu(r.compte === false ? null : r.n);
    const h = heureCourte(new Date().toISOString());
    const oeuf = r.palier === 3 ? `<p class="oeuf">${t.oeuf3}</p>`
      : r.palier === 6 ? `<p class="oeuf">${t.oeuf6(h)}</p>`
      : r.palier === 13 ? `<p class="oeuf">${t.oeuf13}</p><div class="ticket"><b>${t.ticket}</b>${(r.heures || []).map((x, i) => `<div><span>#${String(i + 1).padStart(2, "0")}</span><span>${heureCourte(x)}</span></div>`).join("")}<small>${t.ticketPied}</small></div>`
      : "";
    return `<div class="echo">${[0, 1, 2].map(() => `<div>${titre}</div>`).join("")}</div>${oeuf || `<p>${t.panier}</p>`}
      ${(r.badges || []).map(badgeGagne).join("")}${r.compte === false ? `<p class="trop-tot">⏳ ${t.fenetre(r.fenetre_min ?? 5)}</p>` : ""}
      ${r.perte ? `<p class="alerte-ligne">🫥 ${t.perte(r.souvenirs)}</p>` : ""}
      ${r.premier_rescan ? `<div class="boite mission apparait"><b>🔁</b> ${t.invitation}</div>` : ""}
      ${souvenirBloc(r.souvenir)}${carte(r.carte, { grand: false })}${comparaisonBloc(r)}${reactionsBloc(r.carte.id, r.mes_reactions)}
      <a class="bouton" href="/saisie" data-nav>${t.encore}</a>`;
  }

  // ---------- Hors ligne (FEAT-021) : file d'attente des scans, synchronisée sans doublon grâce à id_client ----------
  const fileScans = () => lireJson(CLE.file) || [];
  function scanEnFile(corps) {
    const f = fileScans();
    if (!f.some((x) => x.id_client === corps.id_client)) f.push(corps);
    ecrire(CLE.file, JSON.stringify(f));
    history.replaceState(null, "", "/");
    rendre(`<span class="chip">${esc(corps.code)}</span><h1 class="moyen">${t.enFileTitre}</h1><p>${t.enFile}</p>
      <button class="bouton" id="b-sync">${t.reessayerMaintenant}</button><a class="bouton sec" href="/" data-nav>${t.accueil}</a>`, { onglet: "accueil" });
    $("#b-sync").onclick = () => synchroniser(true);
  }
  let synchroEnCours = false;
  async function synchroniser(montrer = false) {
    if (synchroEnCours || !fileScans().length) return majIndicateur();
    synchroEnCours = true;
    let n = 0;
    try {
      for (const s of fileScans()) {
        try { await api("/api/scan", s); } catch (e) { if (e.erreur === "reseau") break; } // autre erreur : le scan est abandonné
        ecrire(CLE.file, JSON.stringify(fileScans().filter((x) => x.id_client !== s.id_client)));
        n++;
      }
    } finally { synchroEnCours = false; }
    majIndicateur();
    if (n) { toast(t.synchro(n)); await chargerMoi(); if (["/", "/collection"].includes(location.pathname)) route(); }
    else if (montrer) toast(t.reseau);
  }
  function majIndicateur() {
    let d = document.getElementById("hors-ligne");
    const n = fileScans().length, visible = !navigator.onLine || n > 0;
    if (!visible) { if (d) d.remove(); return; }
    if (!d) { d = document.createElement("button"); d.id = "hors-ligne"; d.onclick = () => synchroniser(true); document.body.appendChild(d); }
    d.textContent = "📡 " + t.horsLigne(n);
  }
  addEventListener("online", () => synchroniser());
  addEventListener("offline", majIndicateur);

  // ---------- Temps d'écran (RG-015-4) : cumulé localement, envoyé toutes les 60 s et au passage en arrière-plan ----------
  let visibleDepuis = document.visibilityState === "visible" ? Date.now() : null;
  function cumulerEcran() {
    if (visibleDepuis === null) return;
    const maintenant = Date.now();
    ecrire(CLE.ecran, String((Number(lire(CLE.ecran)) || 0) + (maintenant - visibleDepuis) / 1000));
    visibleDepuis = document.visibilityState === "visible" ? maintenant : null;
  }
  async function envoyerEcran(keepalive = false) {
    cumulerEcran();
    const s = Math.floor(Number(lire(CLE.ecran)) || 0);
    if (s < 1 || !lire(CLE.jeton)) return;
    try {
      await api("/api/ecran", { secondes: s }, { keepalive });
      ecrire(CLE.ecran, String(Math.max(0, (Number(lire(CLE.ecran)) || 0) - s)));
    } catch { /* renvoyé plus tard */ }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") envoyerEcran(true);
    else { visibleDepuis = Date.now(); synchroniser(); }
  });
  setInterval(() => { if (document.visibilityState === "visible") envoyerEcran(); }, 60_000);

  // ---------- Direct (LOT-3) : quête collective, paliers, soldes éclair, glitch et messages du MJ ----------
  // Interrogé toutes les 10 s quand l'app est visible ; la réponse est commune à tous (cache en périphérie).
  etat.direct = null;
  const vusEvts = () => lireJson(CLE.evts);
  function majBarre() {
    const b = document.getElementById("barre-quete");
    const d = etat.direct;
    if (!b || !d || !etat.moi) { if (b) b.hidden = true; return; }
    const q = d.quete, now = Date.now(), h = d.heures;
    const rev = Date.parse(h.revelation), fin = Date.parse(h.fin);
    const pct = q.prochain ? Math.min(100, (q.total / q.prochain) * 100) : 100;
    // Compte à rebours (RG-009-11) : 30 min avant la révélation, puis jusqu'à la fermeture
    const compte = now >= rev - 30 * 60_000 && now < rev ? [t.barreRevelation, h.revelation]
      : now >= rev && now < fin ? [t.barreFin, h.fin] : null;
    b.hidden = false;
    b.setAttribute("href", now >= rev ? "/revelation" : "/");
    b.classList.toggle("solde", !!d.solde);
    b.innerHTML = `<div class="haut"><span>${d.solde ? `🔥 ${t.solde} · <span data-fin="${d.solde.fin}"></span>` : `✦ ${t.quete} · P-${q.franchis}/5`}</span>
      <span class="mono">${q.prochain ? `${Math.floor(q.total)} / ${q.prochain}` : t.queteComplete}</span></div>
      <div class="jauge-q"><i style="width:${pct}%"></i></div>
      ${compte ? `<div class="compte-barre">⏳ ${compte[0]} <span data-fin="${compte[1]}"></span></div>` : ""}`;
    demarrerComptes();
  }
  let attenteJusqua = 0; // pendant l'attente du scan mutuel (90 s), aucune bannière ne masque le compte à rebours
  function banniere(id, html, classe = "") {
    if (Date.now() < attenteJusqua) return;
    if (document.getElementById(id)) return;
    let pile = document.getElementById("annonces");
    if (!pile) { pile = document.createElement("div"); pile.id = "annonces"; document.body.appendChild(pile); }
    const d = document.createElement("div"); d.id = id; d.className = "annonce " + classe; d.innerHTML = html;
    classe === "glitch" ? pile.prepend(d) : pile.appendChild(d);
    const f = d.querySelector("[data-fermer]"); if (f) f.onclick = () => d.remove();
  }
  function glitchGlobal(texte) {
    document.body.classList.add("glitch-global"); vibrer([40, 80, 40]);
    banniere("glitch-texte", `<b>⚡ ${esc(texte || t.glitchDefaut)}</b>`, "glitch");
    setTimeout(() => { document.body.classList.remove("glitch-global"); const g = document.getElementById("glitch-texte"); if (g) g.remove(); }, 5000);
  }
  function traiterEvenements(d) {
    let vus = vusEvts();
    const now = Date.now();
    // Premier passage : on ne rejoue pas l'historique, seulement les 10 dernières minutes
    if (!vus) vus = d.evenements.filter((e) => now - Date.parse(e.debut) > 10 * 60_000).map((e) => e.id);
    for (const e of d.evenements) {
      if (vus.includes(e.id)) continue;
      vus.push(e.id);
      if (e.type === "palier") { vibrer([30, 60, 30]); toast(`${t.palierAtteint(e.donnees.n)} ${t.paliers[e.donnees.n - 1] || ""}`); }
      else if (e.type === "glitch" && now - Date.parse(e.debut) < 60_000) glitchGlobal(e.donnees.texte);
      else if (e.type === "jumeaux_reunis") { vibrer(40); banniere("evt-" + e.id, `<small>👯</small><p>${esc(J().premiersTous((e.donnees.pseudos || []).join(" & ")))}</p><button class="lien" data-fermer>${t.fermer}</button>`); }
      else if (e.type === "mission" && e.fin && Date.parse(e.fin) > now) {
        vibrer([60, 40, 60]);
        banniere("eclair-" + e.id, `<small>⚡ ${t.eclairTitre} · ${heureCourte(e.fin)}</small><p><b>${esc(texteEclair(e.donnees))}</b><br>${t.eclairPts(e.donnees.points)}</p><button class="lien" data-fermer>${t.fermer}</button>`);
      }
      else if (e.type === "message" && (!e.fin || Date.parse(e.fin) > now)) {
        vibrer(60);
        banniere("message-" + e.id, `<small>📣 ${t.messageMJ}</small><p>${esc(e.donnees.texte)}</p><button class="lien" data-fermer>${t.fermer}</button>`);
      }
    }
    ecrire(CLE.evts, JSON.stringify(vus.slice(-100)));
    // Annonce unique 30 min avant la révélation (RG-009-11, CA-016-3 en repli des notifications)
    const rev = Date.parse(d.heures.revelation);
    const cleAnnonce = "dv-annonce30" + SUFFIXE + ":" + d.heures.revelation;
    if (now >= rev - 30 * 60_000 && now < rev && !lire(cleAnnonce)) {
      ecrire(cleAnnonce, "1"); vibrer(80);
      banniere("annonce-30", `<small>⏳</small><p>${t.annonce30}</p><button class="lien" data-fermer>${t.fermer}</button>`);
    }
  }
  async function rafraichirDirect() {
    if (!etat.moi || !etat.moi.personnage) return;
    try {
      const d = await api("/api/direct");
      etat.direct = d; etat.heures = d.heures;
      majBarre(); traiterEvenements(d); verifierPush();
      ouvrirRevelationSiHeure(d.heures);
      releverNotifs();
    } catch { /* hors ligne : on garde le dernier état */ }
  }
  setInterval(() => { if (document.visibilityState === "visible") rafraichirDirect(); }, 10_000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") rafraichirDirect(); });

  // ---------- Costume du MJ : légendaires, pièges, pause, sanctions et missions (FEAT-022, ADM-17 à ADM-19) ----------
  const TMJ = {
    fr: {
      legendaire: "✦ Légendaire", piege: "🪤 Piège", deja: "Déjà vu. Tu l'as déjà dans ta garde-robe.", points: (n) => `+${n} points de faction`,
      collection: (n) => `${n}/10 légendaires`, rupture: "Rupture de stock", ruptureTexte: (h) => `Le dernier exemplaire est parti. ${h ? `Prochaine remise en rayon à ${h}.` : "Plus de remise en rayon ce soir."}`,
      pieDeja: "Tu t'es déjà fait avoir. Déjà vu.", protege: "Retour sans reçu ! Ta légendaire t'a protégé de ce piège.", vueMJ: "Vue du MJ : cette étiquette porte en ce moment",
      bloqueDans: "Scanner bloqué encore", legendes: "✦ Légendes", actif: "actif", pret: "prêt",
      L: {
        "L-1": ["Cape de Déjà-vu +2", "Immunité au glitch du chat noir pendant 30 min."],
        "L-2": ["Retour sans reçu", "Te protège du prochain piège, ou annule une corruption en cours."],
        "L-3": ["La Pilule rouge", "Pendant 10 min, tu vois la part de corrompus et le nombre de chats noirs actifs."],
        "L-4": ["Miroir de la cabine d'essayage", "Révèle tout de suite le prochain indice sur ton jumeau."],
        "L-5": ["Bon de réduction −100 %", "Tes 3 prochaines nouvelles cartes comptent double pour la quête."],
        "L-6": ["Boucle temporelle", "Pendant 10 min, chaque rescan compte, sans attendre."],
        "L-7": ["Dernier exemplaire", "Il n'en existe qu'un à la fois, et c'est toi qui l'as. Les suivants trouveront le rayon vide."],
        "L-8": ["Dé à 20 faces doré", "Pas de duel ce soir : tu gagnes 3 souvenirs à la place."],
        "L-9": ["Ticket de caisse infini", "Un faux souvenir unique avec le MJ : toutes vos vies antérieures."],
        "L-10": ["Mannequin de vitrine", "Pendant 15 min, ta carte est en vitrine sur l'écran d'accueil de tout le monde."],
      },
      T: {
        "T-1": "File d'attente du Black Friday", "T-2": "Paiement refusé", "T-3": "Mise à jour obligatoire", "T-4": "Abonnement premium", "T-5": "CAPTCHA infini",
        pause: "Fermé pour inventaire",
      },
      file: (n) => `Tu es le ${n.toLocaleString("fr-CA")}<sup>e</sup> dans la file.`, fileAide: "Merci de votre patience. Votre scan est important pour nous.",
      refuse: "Carte refusée. Veuillez patienter avant de réessayer.", maj: "Ne pas éteindre votre téléphone.", majEtape: (p) => `Installation de la mise à jour… ${p} %`,
      premium: "Débloque le scan pour 9,99 $/mois.", sabonner: "S'abonner", refuser: "Refuser", premiumNon: "Paiement refusé. Évidemment.",
      captcha: "Prouve que tu n'es pas un robot. Sélectionne toutes les images qui contiennent des étiquettes.", verifier: "Vérifier", captchaNon: "Mauvaise réponse. Réessaie.",
      pause: (m) => `FERMÉ POUR INVENTAIRE. Le MJ fait une pause. Ton scanner est bloqué 2 min. ${m ? `Réouverture dans ${m} min.` : "Réouverture : quand le MJ reviendra."}`,
      sanctionBloque: "Retour en caisse. Le MJ a bloqué ton scanner.", surconso: "Patience, client fidèle. Ce scan ne compte pas.",
      suspendu: "Interdit de magasin. Ton personnage est suspendu. Va voir le MJ.",
      sanctions: [
        "Le MJ t'a à l'œil. Prochaine fois, ce sera moins drôle. Badge : Client difficile.",
        "Retour en caisse. Ton scanner est bloqué 5 min.",
        "Article défectueux. Tu glitches pendant 10 min et tu as perdu des souvenirs.",
        "Rappel de produit. Scanner bloqué 30 min, points de faction retirés, mémoire effacée.",
        "Interdit de magasin. Ton personnage est suspendu. Va voir le MJ.",
      ],
      sanctionAnnulee: "Le MJ a annulé ta sanction. Ce qui t'avait été retiré t'est rendu.", messageMJ: "Le MJ",
      missionAnnonce: (m) => `Le MJ te confie une mission. Tu as ${m} min.`, missionReussie: "Mission accomplie. Badge : Employé du mois.",
      missionEchouee: "Temps écoulé. Le MJ ne t'en veut pas. Pas trop.", missionAnnulee: "Le MJ a annulé ta mission.",
      recompenses: { points: "+20 points de faction pour tes factions.", souvenirs: "+3 souvenirs.", solde: "Tes 5 prochaines nouvelles cartes comptent double.", indice: "Un indice bonus sur ton double." },
      missions: {
        "M-1": ["Ramène-moi des clients", () => "Scanne 3 personnes que tu n'as jamais scannées."],
        "M-2": ["Tournée des factions", () => "Scanne un membre de chacune des 5 factions."],
        "M-3": ["Service après-vente", () => "Retrouve et rescanne ta toute première rencontre de la soirée."],
        "M-4": ["Contrôle qualité", (a, b) => `Trouve quelqu'un avec ${a} et ${b}, et scanne-le.`],
        "M-5": ["Livraison express", () => "Envoie-moi 2 personnes qui ne m'ont jamais scanné."],
        "M-6": ["Solde privée", () => "Tes 5 prochaines nouvelles cartes comptent double. Cadeau de la maison."],
        "M-7": ["Mission spéciale du MJ", () => "Il t'a dit quoi faire."],
      },
      vitrine: "🪟 Vu en vitrine", effets: { "S-3": "⚠️ Article défectueux", "M-6": "🎁 Solde privée ×2" }, cartesX2: (n) => `${n} carte${n > 1 ? "s" : ""} ×2`,
    },
    en: {
      legendaire: "✦ Legendary", piege: "🪤 Trap", deja: "Déjà vu. It's already in your wardrobe.", points: (n) => `+${n} faction points`,
      collection: (n) => `${n}/10 legendaries`, rupture: "Out of stock", ruptureTexte: (h) => `The last one is gone. ${h ? `Restocked at ${h}.` : "No more restocks tonight."}`,
      pieDeja: "You already fell for this one. Déjà vu.", protege: "Return without receipt! Your legendary protected you from this trap.", vueMJ: "GM view: this tag currently carries",
      bloqueDans: "Scanner locked for", legendes: "✦ Legends", actif: "active", pret: "ready",
      L: {
        "L-1": ["Déjà-vu Cloak +2", "Immune to the black cat's glitch for 30 min."],
        "L-2": ["Return Without Receipt", "Protects you from the next trap, or cancels an ongoing corruption."],
        "L-3": ["The Red Pill", "For 10 min, you see the share of corrupted players and the number of active black cats."],
        "L-4": ["Fitting-Room Mirror", "Reveals the next clue about your twin right away."],
        "L-5": ["−100% Coupon", "Your next 3 new cards count double for the quest."],
        "L-6": ["Time Loop", "For 10 min, every rescan counts, no waiting."],
        "L-7": ["Last One in Stock", "Only one exists at a time, and you've got it. The next ones will find an empty shelf."],
        "L-8": ["Golden D20", "No duels tonight: you get 3 memories instead."],
        "L-9": ["Infinite Receipt", "A unique fake memory with the GM: all your past lives."],
        "L-10": ["Window Mannequin", "For 15 min, your card is in the window on everyone's home screen."],
      },
      T: {
        "T-1": "Black Friday Queue", "T-2": "Payment Declined", "T-3": "Mandatory Update", "T-4": "Premium Subscription", "T-5": "Endless CAPTCHA",
        pause: "Closed for stocktaking",
      },
      file: (n) => `You are number ${n.toLocaleString("en-CA")} in line.`, fileAide: "Thank you for your patience. Your scan is important to us.",
      refuse: "Card declined. Please wait before trying again.", maj: "Do not turn off your phone.", majEtape: (p) => `Installing update… ${p}%`,
      premium: "Unlock scanning for $9.99/month.", sabonner: "Subscribe", refuser: "Decline", premiumNon: "Payment declined. Obviously.",
      captcha: "Prove you're not a robot. Select all images that contain tags.", verifier: "Verify", captchaNon: "Wrong answer. Try again.",
      pause: (m) => `CLOSED FOR STOCKTAKING. The GM is on a break. Your scanner is locked for 2 min. ${m ? `Reopening in ${m} min.` : "Reopening: when the GM is back."}`,
      sanctionBloque: "Back to checkout. The GM locked your scanner.", surconso: "Patience, loyal customer. This scan doesn't count.",
      suspendu: "Banned from the store. Your character is suspended. Go see the GM.",
      sanctions: [
        "The GM is watching you. Next time it won't be funny. Badge: Difficult Customer.",
        "Back to checkout. Your scanner is locked for 5 min.",
        "Defective item. You're glitching for 10 min and you've lost memories.",
        "Product recall. Scanner locked for 30 min, faction points removed, memory wiped.",
        "Banned from the store. Your character is suspended. Go see the GM.",
      ],
      sanctionAnnulee: "The GM cancelled your sanction. What was taken is given back.", messageMJ: "The GM",
      missionAnnonce: (m) => `The GM has a mission for you. You have ${m} min.`, missionReussie: "Mission accomplished. Badge: Employee of the Month.",
      missionEchouee: "Time's up. The GM isn't mad. Not too mad.", missionAnnulee: "The GM cancelled your mission.",
      recompenses: { points: "+20 faction points for your factions.", souvenirs: "+3 memories.", solde: "Your next 5 new cards count double.", indice: "A bonus clue about your double." },
      missions: {
        "M-1": ["Bring me customers", () => "Scan 3 people you've never scanned."],
        "M-2": ["Faction tour", () => "Scan a member of each of the 5 factions."],
        "M-3": ["After-sales service", () => "Find and rescan the very first person you met tonight."],
        "M-4": ["Quality control", (a, b) => `Find someone wearing ${a} and ${b}, and scan them.`],
        "M-5": ["Express delivery", () => "Send me 2 people who've never scanned me."],
        "M-6": ["Private sale", () => "Your next 5 new cards count double. On the house."],
        "M-7": ["Special GM mission", () => "You know what to do."],
      },
      vitrine: "🪟 In the window", effets: { "S-3": "⚠️ Defective item", "M-6": "🎁 Private sale ×2" }, cartesX2: (n) => `${n} card${n > 1 ? "s" : ""} ×2`,
    },
  };
  const M = () => TMJ[L] || TMJ.fr;
  const nomEffet = (e) => (e.startsWith("L") ? M().L[e][0] : M().T[e] || e);
  const minutesJusqua = (iso) => Math.max(1, Math.ceil((Date.parse(iso) - Date.now()) / 60000));

  /** Légendaire obtenue, déjà obtenue ou en rupture de stock (RG-022-2, CA-022-4). */
  function ecranLegendaire(r) {
    const m = M(), [nom, effet] = m.L[r.effet] || [r.effet, ""];
    if (r.mj) return `<span class="chip or">${m.legendaire}</span><h1 class="moyen">${esc(nom)}</h1><p class="muted">${m.vueMJ} <b>${esc(r.effet)}</b>.</p><p>${effet}</p>`;
    if (r.rupture) return `<span class="chip">${m.rupture}</span><h1 class="moyen">${esc(nom)}</h1><div class="boite alerte"><p>${m.ruptureTexte(r.prochaine ? heureCourte(r.prochaine) : null)}</p></div>`;
    if (r.deja) return `<span class="chip or">${m.legendaire}</span><h1 class="moyen">${esc(nom)}</h1><p>${m.deja}</p>`;
    const memoire = r.souvenir ? `<div class="souvenir ticket-infini"><p>${esc(r.souvenir[L] || r.souvenir.fr).replace(/\n\n/g, "</p><p>")}</p></div>` : "";
    return `<div class="legendaire apparait"><span class="chip or">${m.legendaire} · ${esc(r.effet)}</span><h1 class="moyen">${esc(nom)}</h1><p class="effet">${effet}</p>
      ${r.fin ? `<p class="mono petit">⏳ <span data-fin="${r.fin}"></span></p>` : ""}${r.guerison ? `<p class="ok">🦠 ${J().guerison}</p>` : ""}
      <p class="mono petit muted">${r.points ? m.points(15) + " · " : ""}${m.collection(r.collection || 0)}</p></div>${memoire}${(r.badges || []).map(badgeGagne).join("")}`;
  }

  /** Écran d'un piège (T-1…T-5) ou de la pause, avec son compte à rebours et son gag (REQ-003 : pas de flash). */
  function ecranPiege(r) {
    const m = M(), nom = m.T[r.effet] || r.effet;
    if (r.mj) return `<span class="chip">${m.piege}</span><h1 class="moyen">${esc(nom)}</h1><p class="muted">${m.vueMJ} <b>${esc(r.effet)}</b>.</p>`;
    if (r.deja) return `<span class="chip">${m.piege} · ${esc(nom)}</span><h1 class="moyen">DÉJÀ VU</h1><p>${m.pieDeja}</p>`;
    if (r.protege) return `<span class="chip or">✦ ${m.L["L-2"][0]}</span><h1 class="moyen">${esc(nom)}</h1><p>${m.protege}</p>`;
    const compte = r.jusqu_a ? `<p class="mono petit muted" style="margin:12px 0 4px">${m.bloqueDans}</p><div class="compte" data-fin="${r.jusqu_a}" data-recharger="1"></div>` : "";
    const gag = {
      "T-1": `<p class="file-num" id="g-file">${m.file(4812)}</p><p class="muted petit">${m.fileAide}</p>`,
      "T-2": `<div class="carte-refusee">💳</div><p>${m.refuse}</p>`,
      "T-3": `<div class="jauge-maj"><i id="g-maj"></i></div><p class="mono petit" id="g-maj-t">${m.majEtape(0)}</p><p class="muted petit">${m.maj}</p>`,
      "T-4": `<p>${m.premium}</p><div class="rangee-premium"><button class="bouton" id="g-abo">${m.sabonner}</button><button class="bouton sec" id="g-non">${m.refuser}</button></div><p class="petit alerte-ligne" id="g-abo-t" hidden>${m.premiumNon}</p>`,
      "T-5": `<p>${m.captcha}</p><div class="captcha" id="g-captcha"></div><button class="bouton sec" id="g-verif">${m.verifier}</button><p class="petit alerte-ligne" id="g-captcha-t" hidden>${m.captchaNon}</p>`,
      pause: `<p>${m.pause(r.reouverture ? minutesJusqua(r.reouverture) : null)}</p>`,
      sanction: `<p>${m.sanctionBloque}</p>`, surconsommation: `<p>${m.surconso}</p>`,
    }[r.effet] || `<p>${m.surconso}</p>`;
    const titre = r.effet === "sanction" ? m.sanctions[1].split(".")[0] : r.effet === "surconsommation" ? t.bloqueTitre : nom;
    return `<span class="chip">${r.effet.startsWith("T") ? m.piege : "⛔"}</span><h1 class="moyen">${esc(titre)}</h1><div class="boite alerte piege">${gag}${compte}</div>`;
  }
  /** Anime le gag du piège affiché (minuteurs arrêtés quand l'écran change). */
  function animerPiege(effet) {
    if (effet === "T-1") {
      let n = 4812;
      const it = setInterval(() => { const e = document.getElementById("g-file"); if (!e) return clearInterval(it); n = Math.max(1, n - 1 - Math.floor(Math.random() * 3)); e.innerHTML = M().file(n); }, 2000);
    }
    if (effet === "T-3") {
      let p = 0;
      const it = setInterval(() => {
        const e = document.getElementById("g-maj"); if (!e) return clearInterval(it);
        p = Math.random() < 0.25 ? Math.max(0, p - 7) : Math.min(99, p + 3); // recule de temps en temps
        e.style.width = p + "%"; document.getElementById("g-maj-t").textContent = M().majEtape(p);
      }, 1200);
    }
    if (effet === "T-4") {
      let k = 1;
      $("#g-non").onclick = () => { k = Math.max(0.35, k - 0.15); $("#g-non").style.transform = `scale(${k})`; };
      $("#g-abo").onclick = () => { $("#g-abo-t").hidden = false; };
    }
    if (effet === "T-5") {
      const remplir = () => { $("#g-captcha").innerHTML = Array.from({ length: 9 }, () => `<button class="case">${["🏷️", "🔖", "🎫", "🧾"][Math.floor(Math.random() * 4)]}</button>`).join(""); };
      remplir();
      $("#g-captcha").onclick = (ev) => { const c = ev.target.closest(".case"); if (c) c.classList.toggle("choisie"); };
      $("#g-verif").onclick = () => { $("#g-captcha-t").hidden = false; remplir(); };
    }
  }

  /** Scan bloqué : on remontre l'écran de la cause (piège, pause, sanction, surconsommation). */
  const piegeDeBlocage = (r) => ({ type: "piege", effet: r.cause || "surconsommation", jusqu_a: r.jusqu_a, reouverture: r.reouverture });

  /** Mission personnelle (ADM-19) : titre et consigne, pour l'encadré « Missions actives ». */
  function missionMJ(mm) {
    const [titre, texte] = M().missions[mm.code] || [mm.code, () => ""];
    const at = (mm.donnees && mm.donnees.attributs) || mm.attributs || [];
    const noms = at.map((a) => { const x = attrDe(a); return x ? `${x.e} ${lib(x).toLowerCase()}` : a; });
    return { titre, condition: texte(noms[0], noms[1]), fin: mm.fin };
  }

  // Messages personnels : sanctions et missions (relevés avec le direct, toutes les 10 s)
  const CLE_NOTIFS = "dv-notifs" + SUFFIXE;
  async function releverNotifs() {
    if (!etat.moi || !etat.moi.personnage) return;
    const apres = lire(CLE_NOTIFS);
    let r;
    try { r = await api("/api/notifs" + (apres !== null ? "?apres=" + encodeURIComponent(apres) : "")); } catch { return; }
    ecrire(CLE_NOTIFS, String(r.dernier || 0));
    Object.assign(etat.moi, { mission_mj: r.mission_mj, effets: r.effets, jumeau: r.jumeau, contagion: r.contagion, pilule: r.pilule });
    etat.moi.personnage.bloque_jusqu_a = r.bloque_jusqu_a; etat.moi.personnage.suspendu = r.suspendu;
    ecrire(CLE.moi, JSON.stringify(etat.moi));
    const m = M();
    for (const n of r.notifs || []) {
      if (notifRoles(n)) continue; // LOT-4 : jumeaux, retrouvailles, chat noir, corruption
      const d = n.donnees || {};
      let html = null, classe = "";
      if (n.type === "sanction") { html = `<small>⚠️ ${m.messageMJ}</small><p>${m.sanctions[d.niveau - 1] || ""}</p>`; classe = "alerte"; }
      if (n.type === "sanction_annulee") html = `<small>${m.messageMJ}</small><p>${m.sanctionAnnulee}</p>`;
      if (n.type === "mission") {
        const mm = missionMJ({ code: d.code, attributs: d.attributs, fin: d.fin });
        html = `<small>🎯 ${m.messageMJ}</small><p>${d.offerte ? "" : m.missionAnnonce(d.fin ? minutesJusqua(d.fin) : 15) + "<br>"}<b>${esc(mm.titre)}</b> : ${esc(mm.condition)}</p>`;
      }
      if (n.type === "mission_reussie") html = `<small>🏷️ ${m.messageMJ}</small><p>${m.missionReussie}<br>${m.recompenses[d.recompense] || ""}</p>`;
      if (n.type === "eclair_reussie") html = `<small>⚡ ${t.eclairTitre}</small><p>${t.eclairReussie(d.points)}</p>`;
      if (n.type === "mission_echouee") html = `<small>⏳ ${m.messageMJ}</small><p>${m.missionEchouee}</p>`;
      if (n.type === "mission_annulee") html = `<small>${m.messageMJ}</small><p>${m.missionAnnulee}</p>`;
      if (n.type === "suggestion") html = `<small>🎛️ Suggestion de réglage</small><p>${esc(d.texte || "")}</p><p><a class="bouton sec" href="/admin#suggestions">Ouvrir l'admin</a></p>`; // MJ seulement
      if (html) { vibrer([60, 80, 60]); banniere("notif-" + n.id, `${html}<button class="lien" data-fermer>${t.fermer}</button>`, classe); }
    }
    if ((r.notifs || []).length && location.pathname === "/collection") collection();
    verifierIndices(etat.moi);
    majEffets();
  }

  /** Effets en cours (légendaires, solde privée) et vitrine L-10 : bandeau de l'accueil. */
  function blocEffets(d) {
    const m = M(), now = Date.now();
    const puces = (d.effets || []).map((x) => {
      const nom = x.effet.startsWith("L") ? `✦ ${m.L[x.effet][0]}` : m.effets[x.effet] || x.effet;
      const quoi = x.fin && Date.parse(x.fin) > now ? `<span data-fin="${x.fin}"></span>` : x.reste ? (["L-5", "M-6"].includes(x.effet) ? m.cartesX2(x.reste) : m.pret) : m.actif;
      return `<span class="puce-effet">${esc(nom)} · ${quoi}</span>`;
    }).join("");
    const v = ((etat.direct && etat.direct.evenements) || []).filter((e) => e.type === "vitrine" && e.fin && Date.parse(e.fin) > now).pop();
    const vitrine = v ? `<div class="vitrine apparait"><small>${m.vitrine}</small><b>${typeDe(v.donnees.type).e} ${esc(v.donnees.pseudo)}</b><span class="mono petit" data-fin="${v.fin}"></span></div>` : "";
    const ec = ((etat.direct && etat.direct.evenements) || []).filter((e) => e.type === "mission" && e.fin && Date.parse(e.debut) <= now && Date.parse(e.fin) > now).pop();
    const eclair = ec ? `<div class="vitrine eclair apparait"><small>⚡ ${t.eclairTitre} · ${t.eclairPts(ec.donnees.points)}</small><b>${esc(texteEclair(ec.donnees))}</b><span class="mono petit" data-fin="${ec.fin}"></span></div>` : "";
    return `<div id="zone-effets">${eclair}${vitrine}${puces ? `<div class="puces-effets">${puces}</div>` : ""}${blocRoles(d)}</div>`;
  }
  /** Le direct (toutes les 10 s) met à jour la vitrine et les effets sans redessiner l'accueil. */
  function majEffets() {
    const z = document.getElementById("zone-effets");
    if (!z || !etat.moi) return;
    const html = blocEffets(etat.moi).replace(/^<div id="zone-effets">|<\/div>$/g, "");
    if (z.innerHTML !== html) { z.innerHTML = html; demarrerComptes(); }
  }

  /** Section « Légendes » de la collection (RG-022-1). */
  function blocLegendes(r) {
    const m = M();
    if (!r.legendes || !r.legendes.length) return "";
    return `<h3>${m.legendes} · ${r.legendes.length}/10</h3><div class="legendes">${r.legendes.map((x, i) => `<button class="legende${x.actif ? " active" : ""}" data-l="${i}">
      <b>${esc(m.L[x.effet][0])}</b><small>${esc(x.effet)}${x.actif ? " · " + m.actif : ""}</small></button>`).join("")}</div>`;
  }
  function brancherLegendes(r) {
    app.querySelectorAll(".legende").forEach((b) => (b.onclick = () => {
      const x = r.legendes[+b.dataset.l], [nom, effet] = M().L[x.effet];
      rendre(`<button class="retour" id="b-retour">${t.retour}</button><span class="chip or">${M().legendaire} · ${esc(x.effet)}</span><h1 class="moyen">${esc(nom)}</h1><p>${effet}</p>
        ${x.fin && Date.parse(x.fin) > Date.now() ? `<p class="mono petit">⏳ <span data-fin="${x.fin}"></span></p>` : ""}
        ${x.souvenir ? `<div class="souvenir ticket-infini"><p>${esc(x.souvenir[L] || x.souvenir.fr).replace(/\n\n/g, "</p><p>")}</p></div>` : ""}`, { onglet: "collection" });
      $("#b-retour").onclick = collection;
    }));
  }

  // ---------- Jumeaux et triplés (FEAT-007), chats noirs et glitch contagieux (FEAT-008) ----------
  const TJ = {
    fr: {
      double: "Ton double", doubles: "Tes doubles", doubleN: (i) => `Double n° ${i}`,
      attribue: "Ton double existe. Trouve-le.", attribueTriples: "Vous êtes des triplés. Trouve tes deux doubles.",
      dejaCroise: "Tu as déjà croisé ton double ! Les retrouvailles exigent tout de même un nouveau scan mutuel.",
      avantMinuit: "Premier indice à minuit.", prochain: "Prochain indice dans", nouvelIndice: "Nouvel indice sur ton double",
      tousIndices: "Tous les indices sont tombés.", voirIndices: "Voir tous les indices",
      type: (e, n) => `Costume : ${e} ${n}`, couleur: (n) => `Couleur dominante : ${n}`, porte: (x) => `Porte : ${x}`, porteP: (x) => `Ne porte pas : ${x}`, pseudo: (p) => `Pseudo : ${p}`,
      attenteTitre: "C'est peut-être ton double…", attente: "Fais-toi scanner à ton tour, vite !",
      attenteFinie: "Trop tard pour cette fois. Rescannez-vous tous les deux, dans les 90 s.",
      fusion: "RETROUVAILLES", fusionTexte: "Jumeaux retrouvés !", fusionTriples: "Le lot est complet !", fusionPartielle: "Deux sur trois. Il te reste un double à retrouver.",
      premiers: "Premiers doubles réunis de la soirée !", premiersTous: (n) => `Premiers doubles réunis : ${n}.`, retrouve: "retrouvé",
      fui: "Ton double a fui la Matrice.",
      mChat: "Tu es un chat noir. Ne le dis à personne. Contamine 3 personnes en 10 min.",
      mJumeau: (i) => `Ton double est quelque part. Dernier indice : ${i}.`, mJumeauAttente: "Ton double est quelque part. Premier indice à minuit.",
      mCorrompu: "Tu glitches. Chaque scan peut contaminer.",
      chatTitre: "🐈‍⬛ Rôle secret", chat: "Tu es un chat noir. Ne le dis à personne. Contamine 3 personnes en 10 min. Ta contagion dure toute la soirée.",
      corrompu: "Corruption détectée. Tu glitches.", corrompuChat: "Tu as croisé un chat noir. Tu glitches.", corrompuAide: "Chaque scan peut contaminer, dans les deux sens.",
      protege: "Retour sans reçu ! Ta légendaire a annulé la corruption.", contamine: "Contamination réussie. Miaou.", guerison: "Ta corruption est annulée.",
      puceChat: "🐈‍⬛ Chat noir · secret", puceCorrompu: "🦠 Corrompu", puceImmunise: "🛡️ Immunisé", pilule: (p, n) => `💊 ${p} % de corrompus · ${n} chat${n > 1 ? "s" : ""} noir${n > 1 ? "s" : ""}`,
      indiceBonus: "Un indice bonus sur ton double.",
      revContagion: "🦠 Contagion", revConstellation: "✦ Constellation", revChat: "🐈‍⬛ Chat noir", revSurvivant: "🛡️ Dernier survivant", revJumeau: "👯 Double retrouvé",
      revContStats: (c, k, n) => `${c} corrompu${c > 1 ? "s" : ""} · ${k} chat${k > 1 ? "s" : ""} noir${k > 1 ? "s" : ""} · ${n} transmission${n > 1 ? "s" : ""}`,
    },
    en: {
      double: "Your double", doubles: "Your doubles", doubleN: (i) => `Double #${i}`,
      attribue: "Your double exists. Find them.", attribueTriples: "You're triplets. Find your two doubles.",
      dejaCroise: "You've already crossed paths with your double! A new mutual scan is still needed to reunite.",
      avantMinuit: "First clue at midnight.", prochain: "Next clue in", nouvelIndice: "New clue about your double",
      tousIndices: "All the clues are out.", voirIndices: "See all clues",
      type: (e, n) => `Costume: ${e} ${n}`, couleur: (n) => `Main colour: ${n}`, porte: (x) => `Wearing: ${x}`, porteP: (x) => `Not wearing: ${x}`, pseudo: (p) => `Name: ${p}`,
      attenteTitre: "This might be your double…", attente: "Get them to scan you back, quick!",
      attenteFinie: "Too late this time. Scan each other again, within 90 s.",
      fusion: "REUNITED", fusionTexte: "Twins reunited!", fusionTriples: "The set is complete!", fusionPartielle: "Two out of three. One double left to find.",
      premiers: "First doubles reunited tonight!", premiersTous: (n) => `First doubles reunited: ${n}.`, retrouve: "found",
      fui: "Your double has fled the Matrix.",
      mChat: "You're a black cat. Tell no one. Infect 3 people in 10 min.",
      mJumeau: (i) => `Your double is out there. Latest clue: ${i}.`, mJumeauAttente: "Your double is out there. First clue at midnight.",
      mCorrompu: "You're glitching. Every scan can infect.",
      chatTitre: "🐈‍⬛ Secret role", chat: "You're a black cat. Tell no one. Infect 3 people in 10 min. You stay contagious all night.",
      corrompu: "Corruption detected. You're glitching.", corrompuChat: "You crossed a black cat. You're glitching.", corrompuAide: "Every scan can infect, both ways.",
      protege: "Return without receipt! Your legendary cancelled the corruption.", contamine: "Infection successful. Meow.", guerison: "Your corruption is cancelled.",
      puceChat: "🐈‍⬛ Black cat · secret", puceCorrompu: "🦠 Corrupted", puceImmunise: "🛡️ Immune", pilule: (p, n) => `💊 ${p}% corrupted · ${n} black cat${n > 1 ? "s" : ""}`,
      indiceBonus: "A bonus clue about your double.",
      revContagion: "🦠 Contagion", revConstellation: "✦ Constellation", revChat: "🐈‍⬛ Black cat", revSurvivant: "🛡️ Last survivor", revJumeau: "👯 Double found",
      revContStats: (c, k, n) => `${c} corrupted · ${k} black cat${k > 1 ? "s" : ""} · ${n} transmission${n > 1 ? "s" : ""}`,
    },
  };
  const J = () => TJ[L] || TJ.fr;

  /** Texte d'un indice { k, v, vrai } (RG-007-5). */
  function texteIndice(x) {
    const j = J();
    if (x.k === "type") { const ty = typeDe(x.v); return j.type(ty.e, lib(ty)); }
    if (x.k === "couleur") return j.couleur(lib(couleurDe(x.v)));
    if (x.k === "attribut") { const a = attrDe(x.v), n = a ? `${a.e} ${lib(a).toLowerCase()}` : x.v; return x.vrai ? j.porte(n) : j.porteP(n); }
    return j.pseudo(x.v);
  }
  const dernierIndice = (jm) => {
    const d = jm.doubles.find((x) => !x.retrouve && x.indices.length);
    return d ? texteIndice(d.indices[d.indices.length - 1]) : null;
  };
  const actif = (iso) => iso && Date.parse(iso) > Date.now();
  const contagionDe = (d) => d.contagion || {};
  const estCorrompu = (d) => actif(contagionDe(d).corrompu_jusqu_a);
  /** Chat noir depuis moins de 10 min : la ligne « Et maintenant ? » l'incite à contaminer. */
  const chatRecent = (d) => contagionDe(d).chat_noir && contagionDe(d).chat_noir_le && Date.now() - Date.parse(contagionDe(d).chat_noir_le) < 10 * 60_000;

  /** Ligne « Et maintenant ? » du LOT-4 (textes §5.2), ou null. */
  function ligneRoles(d, aucuneCarte) {
    const jm = d.jumeau, j = J();
    if (chatRecent(d)) return j.mChat;
    if (jm && !jm.reuni && !jm.fui) { const i = dernierIndice(jm); return i ? j.mJumeau(i) : jm.nb_indices ? null : j.mJumeauAttente; }
    if (aucuneCarte) return null;
    if (estCorrompu(d)) return j.mCorrompu;
    return null;
  }

  /** Puces de rôle (chat, corruption, immunité, pilule rouge) et encadré du double : dans la zone qui se met à jour. */
  function blocRoles(d) {
    const j = J(), c = contagionDe(d), puces = [];
    if (c.chat_noir) puces.push(`<span class="puce-effet puce-chat">${j.puceChat}</span>`);
    if (actif(c.corrompu_jusqu_a)) puces.push(`<span class="puce-effet puce-corrompu">${j.puceCorrompu} · <span data-fin="${c.corrompu_jusqu_a}"></span></span>`);
    else if (actif(c.immunise_jusqu_a)) puces.push(`<span class="puce-effet puce-immun">${j.puceImmunise} · <span data-fin="${c.immunise_jusqu_a}"></span></span>`);
    if (d.pilule) puces.push(`<span class="puce-effet">${j.pilule(d.pilule.part, d.pilule.chats)}</span>`);
    document.body.classList.toggle("corrompu", !!actif(c.corrompu_jusqu_a));
    return (puces.length ? `<div class="puces-effets">${puces.join("")}</div>` : "") + encadreDouble(d.jumeau, true);
  }

  /** Encadré du double : dernier indice (accueil) ou tous les indices (fiche). */
  function encadreDouble(jm, court) {
    if (!jm) return "";
    const j = J(), triples = jm.taille === 3;
    const titre = `👯 ${triples ? j.doubles : j.double}`;
    if (jm.reuni) {
      const noms = jm.doubles.map((x) => x.carte ? `${typeDe(x.carte.type).e} ${esc(x.carte.pseudo)}` : "").join(" · ");
      return court ? "" : `<div class="boite double reuni"><b>${titre}</b><p>✅ ${triples ? j.fusionTriples : j.fusionTexte}</p><p>${noms}</p></div>`;
    }
    if (jm.fui) return `<div class="boite double"><b>${titre}</b><p>${j.fui}</p></div>`;
    const prochain = jm.prochain ? `<p class="mono petit muted" style="margin:8px 0 0">${jm.nb_indices ? j.prochain : j.avantMinuit} ${jm.nb_indices ? `<span data-fin="${jm.prochain}"></span>` : ""}</p>` : `<p class="petit muted">${j.tousIndices}</p>`;
    if (court) {
      const i = dernierIndice(jm);
      return `<a class="boite double" href="/moi" data-nav><b>${titre}</b><p>${i ? esc(i) : j.avantMinuit}</p>${jm.prochain && jm.nb_indices ? prochain : ""}<small class="lien">${j.voirIndices} →</small></a>`;
    }
    const listes = jm.doubles.map((x, k) => `${triples ? `<p class="petit muted" style="margin:10px 0 4px">${j.doubleN(k + 1)}${x.retrouve ? ` · ✅ ${j.retrouve}` : ""}</p>` : ""}
      ${x.retrouve && x.carte ? `<p>${typeDe(x.carte.type).e} <b>${esc(x.carte.pseudo)}</b></p>` : `<ol class="indices">${x.indices.map((i) => `<li>${esc(texteIndice(i))}</li>`).join("")}</ol>`}`).join("");
    return `<div class="boite double" id="double"><b>${titre}</b>${listes}${prochain}</div>`;
  }

  /** Glitch personnel (RG-008-2) : le même effet que le glitch global (REQ-003 : 1 changement par seconde au plus). */
  function glitchPerso(texte) { glitchGlobal(texte); vibrer([50, 40, 50, 40, 120]); }

  /** Après un scan : retrouvailles, attente du scan mutuel, contagion. */
  function apresScanRoles(r) {
    const j = J();
    if (r.jumeau && r.jumeau.retrouvailles) { setTimeout(() => ecranFusion(r.jumeau.retrouvailles), 700); return; }
    const haut = [];
    if (r.jumeau && r.jumeau.attente_jusqu_a) {
      viderBannieres(); // le compte à rebours de 90 s passe avant tout
      haut.push(`<div class="boite double attente apparait"><b>👯 ${j.attenteTitre}</b><p>${j.attente}</p>
        <div class="compte" data-fin="${r.jumeau.attente_jusqu_a}" data-fini="${esc(j.attenteFinie)}"></div></div>`);
      attendreRetrouvailles(r.jumeau.attente_jusqu_a);
    }
    const c = r.contagion || {};
    if (c.corrompu) { haut.push(`<div class="boite alerte"><b>🦠 ${c.corrompu.par_chat ? j.corrompuChat : j.corrompu}</b><p class="petit">${j.corrompuAide}</p></div>`); glitchPerso(c.corrompu.par_chat ? j.corrompuChat : j.corrompu); }
    if (c.protege) haut.push(`<div class="boite"><b>✦ ${j.protege}</b></div>`);
    if (c.contamine) toast("🐈‍⬛ " + j.contamine);
    if ((c.badges || []).length) haut.push(c.badges.map(badgeGagne).join(""));
    if (haut.length) {
      const barre = document.getElementById("barre-quete"), m = app.querySelector("main") || app;
      barre && m.contains(barre) ? barre.insertAdjacentHTML("afterend", haut.join("")) : m.insertAdjacentHTML("afterbegin", haut.join(""));
      demarrerComptes();
    }
  }

  const viderBannieres = () => document.querySelectorAll(".annonce").forEach((x) => x.remove());
  /** Pendant la fenêtre de 90 s, on relève les messages toutes les 2 s : les retrouvailles s'affichent chez les deux au même moment. */
  let minuteurAttente = null;
  function attendreRetrouvailles(fin) {
    clearInterval(minuteurAttente); attenteJusqua = Date.parse(fin);
    minuteurAttente = setInterval(() => { if (Date.now() > Date.parse(fin) + 3000) return clearInterval(minuteurAttente); releverNotifs(); }, 2000);
  }

  /** Animation de fusion des cartes, souvenir d'origine et badges (RG-007-9, RG-007-10). */
  function ecranFusion(x) {
    clearInterval(minuteurAttente); attenteJusqua = 0;
    const j = J(), pe = etat.moi && etat.moi.personnage;
    if (!pe) return;
    vibrer([60, 60, 60, 60, 200]); viderBannieres();
    const mini = (c, cote) => `<div class="mini fusion-${cote}" style="--teinte:${couleurDe(c.couleur).hex}"><div class="e">${typeDe(c.type).e}</div><div class="pseudo">${esc(c.pseudo)}</div></div>`;
    const texte = x.complet ? (x.triples ? j.fusionTriples : j.fusionTexte) : j.fusionPartielle;
    rendre(`<div class="fusion"><div class="fusion-cartes">${mini(pe, "g")}${mini(x.avec, "d")}</div>
      <h1 class="moyen">${j.fusion}</h1><p class="fusion-texte">${texte}</p>${x.premier ? `<p class="or">🏆 ${j.premiers}</p>` : ""}</div>
      ${x.souvenir ? `<div class="souvenir origine"><p>${esc(x.souvenir[L] || x.souvenir.fr)}</p></div>` : ""}
      ${(x.badges || []).map(badgeGagne).join("")}
      <a class="bouton" href="/" data-nav>${t.accueil}</a>`, { onglet: "accueil" });
    chargerMoi();
  }

  /** Messages personnels du LOT-4 (relevés avec le direct). Renvoie true si le message est traité. */
  function notifRoles(n) {
    const j = J(), d = n.donnees || {};
    if (n.type === "jumeau") {
      banniere("notif-" + n.id, `<small>👯</small><p><b>${d.taille === 3 ? j.attribueTriples : j.attribue}</b>${d.deja_croise ? `<br>${j.dejaCroise}` : ""}</p><button class="lien" data-fermer>${t.fermer}</button>`);
      vibrer([80, 60, 80]); return true;
    }
    if (n.type === "retrouvailles") { ecranFusion(d); return true; }
    if (n.type === "chat_noir") { banniere("notif-" + n.id, `<small>${j.chatTitre}</small><p>${j.chat}</p><button class="lien" data-fermer>${t.fermer}</button>`, "alerte"); vibrer([100, 50, 100]); return true; }
    if (n.type === "corrompu") {
      glitchPerso(d.par_chat ? j.corrompuChat : j.corrompu);
      if ((d.badges || []).length) banniere("notif-" + n.id, `${d.badges.map(badgeGagne).join("")}<button class="lien" data-fermer>${t.fermer}</button>`);
      return true;
    }
    return false;
  }

  /** Nouvel indice (calendrier de 10 min, palier P-3, L-4, M-5) : bannière quand le nombre d'indices augmente. */
  const CLE_INDICES = "dv-indices" + SUFFIXE;
  function verifierIndices(d) {
    const jm = d.jumeau;
    if (!jm || jm.reuni) return;
    const vu = Number(lire(CLE_INDICES) || 0);
    if (jm.nb_indices > vu) {
      ecrire(CLE_INDICES, String(jm.nb_indices));
      const i = dernierIndice(jm);
      if (i) { vibrer(60); banniere("indice-" + jm.nb_indices, `<small>👯 ${J().nouvelIndice}</small><p>${esc(i)}</p><button class="lien" data-fermer>${t.fermer}</button>`); }
    }
  }

  // ---------- Révélation de 5 h (FEAT-009, RG-009-5 à RG-009-16, RG-015-5) ----------
  // Le serveur fige un instantané commun ; chaque téléphone calcule la même disposition (d3-force déterministe),
  // anime la construction de la constellation, sa transformation en dessin caché, puis zoome sur le joueur.
  const CLE_REV = "dv-revelation" + SUFFIXE, CLE_REV_VUE = "dv-revelation-vue" + SUFFIXE;
  const TEINTES_FACTIONS = { ordre: "#4da3ff", chaos: "#ff5a3d", friperie: "#3dff8a", influence: "#ff4fd8", necro: "#b48cff" };
  const PAGES_REVELATION_AUTO = ["/", "/collection", "/moi", "/medailles", "/badges", "/saisie"];

  /** CA-009-3 : à l'heure, tout appareil ouvert bascule une fois sur la révélation ; à la réouverture aussi. */
  function ouvrirRevelationSiHeure(h) {
    if (!h || !h.revelation) return;
    const now = Date.now(), rev = Date.parse(h.revelation);
    if (now < rev || now > Date.parse(h.fin) + 12 * 3600e3) return;
    if (lire(CLE_REV_VUE) === h.revelation || !PAGES_REVELATION_AUTO.includes(location.pathname)) return;
    ecrire(CLE_REV_VUE, h.revelation); vibrer([60, 120, 60]);
    aller("/revelation");
  }

  let d3Pret = null;
  const chargerD3 = () => d3Pret || (d3Pret = new Promise((ok, ko) => {
    if (window.d3) return ok();
    const s = document.createElement("script"); s.src = "/vendor/d3-7.9.0.min.js";
    s.onload = () => ok(); s.onerror = () => { d3Pret = null; ko({ erreur: "reseau" }); };
    document.head.appendChild(s);
  }));

  async function donneesRevelation(apercu) {
    if (apercu) {
      const r = await fetch("/admin/revelation/apercu.json", { cache: "no-store", credentials: "same-origin" }).catch(() => null);
      if (!r || !r.ok) throw { erreur: "apercu" };
      return r.json();
    }
    const h = etat.heures;
    // Réseau d'abord (le serveur peut refaire l'instantané) ; la copie locale ne sert que hors ligne
    const local = lireJson(CLE_REV);
    // Pile à l'heure, tous les téléphones demandent en même temps : on étale sur quelques secondes
    if (h && Date.now() - Date.parse(h.revelation) < 20_000) await new Promise((ok) => setTimeout(ok, Math.random() * 6000));
    try {
      const d = await api("/api/revelation");
      ecrire(CLE_REV, JSON.stringify(d));
      return d;
    } catch (e) {
      if (local && e.erreur === "reseau" && (!h || local.revelation === h.revelation)) return local;
      throw e;
    }
  }

  /** Hachage 32 bits (FNV-1a + finaliseur) : mêmes positions de départ sur tous les téléphones. */
  function hache(s) {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
    return h >>> 0;
  }

  /** Disposition commune : constellation (d3-force, 300 pas), puis cible dans le dessin caché (RG-009-16). */
  function disposer(R) {
    const n = R.noeuds.length, etendue = 40 * Math.sqrt(n + 1);
    const N = R.noeuds.map((x, i) => {
      const h = hache(x.id);
      return { i, d: x, e: typeDe(x.type).e, deg: 0, x: ((h & 0xffff) / 65535 - 0.5) * etendue, y: ((h >>> 16) / 65535 - 0.5) * etendue, voisins: [] };
    });
    for (const [a, b] of R.liens) { N[a].deg++; N[b].deg++; N[a].voisins.push(b); N[b].voisins.push(a); }
    if (n) {
      const sim = d3.forceSimulation(N)
        .force("charge", d3.forceManyBody().strength(-30).distanceMax(400))
        .force("lien", d3.forceLink(R.liens.map(([a, b]) => ({ source: a, target: b }))).distance(30))
        .force("x", d3.forceX(0).strength(0.06)).force("y", d3.forceY(0).strength(0.06))
        .stop();
      for (let k = 0; k < 300; k++) sim.tick();
    }
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of N) { p.lx = p.x; p.ly = p.y; x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    if (!n) { x0 = y0 = -100; x1 = y1 = 100; }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, taille = Math.max(x1 - x0, y1 - y0, 200);
    const img = R.image, s = (taille * 1.1) / Math.max(img.l, img.h);
    const P = img.p.map(([a, b]) => [cx + (a - img.l / 2) * s, cy + (b - img.h / 2) * s]);
    // Joueurs aimantés : une part qui dépend des paliers, choisis par hachage, appariés de gauche à droite
    const k = Math.round(n * R.part);
    const tries = N.slice().sort((a, b) => hache(a.d.id + "·") - hache(b.d.id + "·"));
    const aimantes = tries.slice(0, k).sort((a, b) => a.lx - b.lx || a.ly - b.ly);
    const Ps = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    for (const p of N) { p.fx = cx + (p.lx - cx) * 1.25; p.fy = cy + (p.ly - cy) * 1.25; }
    aimantes.forEach((p, j) => {
      const q = Ps[Math.floor(((j + 0.5) * Ps.length) / k) % Ps.length], h = hache(p.d.id);
      const dec = k > Ps.length ? s * 0.4 : 0;
      p.fx = q[0] + ((h & 15) / 15 - 0.5) * dec; p.fy = q[1] + (((h >>> 4) & 15) / 15 - 0.5) * dec;
    });
    // Poussière : le reste du dessin, d'autant plus complet et net que la quête a avancé
    const flou = (1 - R.part) * s * 4;
    const poussiere = P.map((q, i) => [q, hache("p" + i)]).sort((a, b) => a[1] - b[1]).slice(0, Math.round(P.length * R.part))
      .map(([q, h]) => [q[0] + ((h & 255) / 255 - 0.5) * flou, q[1] + (((h >>> 8) & 255) / 255 - 0.5) * flou]);
    // Ordre d'apparition : les plus connectés d'abord
    N.slice().sort((a, b) => b.deg - a.deg || a.i - b.i).forEach((p, r) => (p.delai = n ? (r / n) * 2600 : 0));
    // Deux cadrages : la constellation, puis le dessin final (le dessin remplit l'écran à la fin)
    const boite = (pts) => {
      let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
      for (const [x, y] of pts) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); }
      return a === Infinity ? [-100, -100, 100, 100] : [a, b, c, d];
    };
    return { N, poussiere, centre: [cx, cy], pas: s, boiteL: boite(N.map((p) => [p.lx, p.ly])), boiteF: boite([...N.map((p) => [p.fx, p.fy]), ...P]) };
  }

  const borne = (x) => Math.max(0, Math.min(1, x));
  const adoucir = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const DUREE_REV = { morphe: 4200, morpheFin: 7200, zoom: 7800, vue: 10600, fin: 12400 };

  async function revelation() {
    const apercu = new URLSearchParams(location.search).has("apercu");
    rendre(`<div class="rev"><canvas id="rev-canvas"></canvas>
      <div class="rev-haut"><a class="rev-fermer" href="${apercu ? "/admin" : "/"}"${apercu ? "" : " data-nav"} aria-label="${t.fermer}">✕</a>
        <div><span class="chip">✦ ${t.revTitre}</span><div class="mono petit" id="rev-stats"></div>${apercu ? `<div class="petit or">${t.revApercu}</div>` : ""}</div></div>
      <p class="rev-charge" id="rev-charge">${t.revCharge}</p>
      <div class="rev-carte" id="rev-carte" hidden></div>
      <div class="rev-bas" id="rev-bas" hidden><p id="rev-ecran"></p><p id="rev-faction"></p>
        <div class="rev-boutons"><button class="bouton sec" id="rev-moi" hidden>${t.revMoi}</button><button class="bouton sec" id="rev-vue">${t.revVue}</button><button class="bouton sec" id="rev-cont" hidden>${J().revContagion}</button></div></div></div>`, { classe: "rev-page" });
    if (!etat.heures) await chargerMoi();
    let R;
    try {
      [R] = await Promise.all([donneesRevelation(apercu), chargerD3()]);
    } catch (e) {
      $("#rev-charge").textContent = e && e.erreur === "pas_encore" ? t.revPasEncore : t.revErreur;
      return;
    }
    if (location.pathname !== "/revelation") return;
    $("#rev-charge").remove();
    const L0 = disposer(R);
    const moiId = etat.moi && etat.moi.personnage && etat.moi.personnage.id;
    const moi = L0.N.find((p) => p.d.id === moiId) || null;
    const voisins = new Set(moi ? moi.voisins : []);
    // LOT-4 : jumeaux retrouvés (RG-009-14), graphe de propagation et chats noirs dévoilés (RG-008-9), dernier survivant (BDG-6b)
    const jumeaux = R.jumeaux || [], propagation = R.contagion || [], chats = new Set(R.chats || []), corrompus = new Set(R.corrompus || []);
    let vueCont = false;
    const cleJ = (a, b) => (a < b ? a + "-" + b : b + "-" + a), paireJ = new Set(jumeaux.map(([a, b]) => cleJ(a, b)));
    $("#rev-stats").textContent = `${t.revStats(R.noeuds.length, R.liens.length)} · ${t.revImage(Math.round(R.part * 100), R.franchis)}`;

    const canvas = $("#rev-canvas"), ctx = canvas.getContext("2d");
    let W = 0, H = 0, dpr = 1, Z = d3.zoomIdentity;
    // Cadrage courant : interpolé entre celui de la constellation et celui du dessin final
    let F = 1, Cx = 0, Cy = 0;
    const cadrage = ([x0, y0, x1, y1]) => [Math.min((W - 32) / Math.max(1, x1 - x0), (H - 300) / Math.max(1, y1 - y0)), (x0 + x1) / 2, (y0 + y1) / 2];
    const cadrer = (m) => {
      const a = cadrage(L0.boiteL), b = cadrage(L0.boiteF);
      F = a[0] + (b[0] - a[0]) * m; Cx = a[1] + (b[1] - a[1]) * m; Cy = a[2] + (b[2] - a[2]) * m;
    };
    const ajuster = () => {
      dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + "px"; canvas.style.height = H + "px";
    };
    ajuster();
    // Monde → écran : cadrage, puis zoom de d3
    const ecranX = (x) => Z.applyX((x - Cx) * F + W / 2);
    const ecranY = (y) => Z.applyY((y - Cy) * F + H / 2 - 50);
    // Mouvement réduit : l'image finale directement, sans animation ni travelling
    const calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const debut = performance.now() - (calme ? DUREE_REV.fin : 0);
    let fini = calme;

    function dessiner() {
      const tm = fini ? DUREE_REV.fin : performance.now() - debut;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#07060a"; ctx.fillRect(0, 0, W, H);
      const m = adoucir(borne((tm - DUREE_REV.morphe) / (DUREE_REV.morpheFin - DUREE_REV.morphe)));
      cadrer(m);
      if (m > 0) {
        const c = Math.max(1.4, Math.min(6, L0.pas * F * Z.k * 0.75));
        ctx.fillStyle = `rgba(61,255,138,${0.45 * m})`;
        for (const [x, y] of L0.poussiere) ctx.fillRect(ecranX(x) - c / 2, ecranY(y) - c / 2, c, c);
      }
      const [cx, cy] = L0.centre;
      for (const p of L0.N) {
        const b = adoucir(borne((tm - p.delai) / 1200));
        const x = cx + (p.lx - cx) * b, y = cy + (p.ly - cy) * b;
        p.sx = ecranX(x + (p.fx - x) * m); p.sy = ecranY(y + (p.fy - y) * m); p.a = b;
      }
      // Les liens s'estompent pendant la transformation pour laisser lire le dessin
      ctx.lineWidth = 1; ctx.strokeStyle = `rgba(255,255,255,${(vueCont ? 0.03 : moi ? 0.05 : 0.09) * (1 - 0.7 * m)})`;
      ctx.beginPath();
      const miens = [];
      for (const [a, b] of R.liens) {
        const p = L0.N[a], q = L0.N[b];
        if (p.a < 0.6 || q.a < 0.6) continue;
        if (!vueCont && paireJ.has(cleJ(a, b))) continue; // dessiné en pointillés dorés
        if (moi && (p === moi || q === moi)) { miens.push([p, q]); continue; }
        ctx.moveTo(p.sx, p.sy); ctx.lineTo(q.sx, q.sy);
      }
      ctx.stroke();
      if (miens.length && !vueCont) {
        ctx.lineWidth = 1.5; ctx.strokeStyle = `rgba(61,255,138,${0.75 - 0.45 * m})`; ctx.beginPath();
        for (const [p, q] of miens) { ctx.moveTo(p.sx, p.sy); ctx.lineTo(q.sx, q.sy); }
        ctx.stroke();
      }
      const trait = (liste, style, largeur, tirets) => {
        ctx.setLineDash(tirets); ctx.lineWidth = largeur;
        for (const [a, b] of liste) {
          const p = L0.N[a], q = L0.N[b];
          if (!p || !q || p.a < 0.6 || q.a < 0.6) continue;
          ctx.strokeStyle = style(p, q); ctx.beginPath(); ctx.moveTo(p.sx, p.sy); ctx.lineTo(q.sx, q.sy); ctx.stroke();
        }
        ctx.setLineDash([]);
      };
      if (vueCont) {
        // Chaque transmission : un trait rose, et un petit point du côté de la personne contaminée
        trait(propagation, () => "rgba(255,79,138,0.75)", 1.4, []);
        ctx.fillStyle = "#ff4f8a";
        for (const [, b] of propagation) { const q = L0.N[b]; if (q && q.a) { ctx.beginPath(); ctx.arc(q.sx, q.sy, 3.2, 0, 7); ctx.fill(); } }
      } else {
        trait(jumeaux, (p, q) => `rgba(255,205,70,${(moi && (p === moi || q === moi) ? 1 : 0.6) * (1 - 0.25 * m)})`, 2, [5, 4]);
      }
      const k = Z.k, emojis = k >= 2.5, pseudos = k >= 5;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const p of L0.N) {
        if (!p.a || p === moi) continue;
        const r = 2 + Math.min(3, Math.sqrt(p.deg) * 0.6);
        if (vueCont) { ctx.globalAlpha = p.a * (corrompus.has(p.i) ? 1 : 0.4); ctx.fillStyle = corrompus.has(p.i) ? "#ff4f8a" : "#5a5560"; }
        else { ctx.globalAlpha = p.a * (moi && !voisins.has(p.i) ? 0.45 : 1); ctx.fillStyle = TEINTES_FACTIONS[p.d.faction] || "#cfc8d8"; }
        ctx.beginPath(); ctx.arc(p.sx, p.sy, r, 0, 7); ctx.fill();
        if (emojis) { ctx.font = `${Math.min(26, 6 + k * 2.4)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`; ctx.fillText(p.e, p.sx, p.sy - r - 9); }
        if (pseudos) { ctx.font = "11px ui-monospace, monospace"; ctx.fillStyle = "#f2eef8"; ctx.fillText(p.d.pseudo, p.sx, p.sy + r + 9); }
      }
      ctx.globalAlpha = 1;
      if (vueCont) {
        ctx.font = `16px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
        for (const i of chats) {
          const p = L0.N[i]; if (!p || !p.a) continue;
          ctx.fillStyle = "rgba(255,79,138,0.35)"; ctx.beginPath(); ctx.arc(p.sx, p.sy - 14, 12, 0, 7); ctx.fill(); // halo : le chat se voit sur le fond sombre
          ctx.fillText("🐈‍⬛", p.sx, p.sy - 14);
        }
        const sv = R.survivant != null && L0.N[R.survivant];
        if (sv && sv.a) ctx.fillText("🛡️", sv.sx, sv.sy - 14);
      }
      if (moi && moi.a) {
        // RG-009-14 : le point du joueur, plus gros, lumineux, avec son emoji et « TOI »
        ctx.shadowColor = "#3dff8a"; ctx.shadowBlur = 18; ctx.fillStyle = "#3dff8a";
        ctx.beginPath(); ctx.arc(moi.sx, moi.sy, 7, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        ctx.font = `22px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`; ctx.fillText(moi.e, moi.sx, moi.sy - 22);
        ctx.font = "bold 12px ui-monospace, monospace"; ctx.fillStyle = "#3dff8a"; ctx.fillText(t.revToi, moi.sx, moi.sy + 18);
      }
    }

    const zoom = d3.zoom().scaleExtent([0.7, 8]).on("zoom", (ev) => { Z = ev.transform; if (fini) dessiner(); });
    const sel = d3.select(canvas).call(zoom);
    const versMoi = () => {
      const [Ff, cx, cy] = cadrage(L0.boiteF);
      const x = (moi.fx - cx) * Ff + W / 2, y = (moi.fy - cy) * Ff + H / 2 - 50;
      return d3.zoomIdentity.translate(W / 2, H / 2 - 60).scale(4).translate(-x, -y);
    };
    const boucle = () => {
      if (!canvas.isConnected) return;
      dessiner();
      if (performance.now() - debut < DUREE_REV.fin) requestAnimationFrame(boucle);
      else { fini = true; dessiner(); }
    };
    requestAnimationFrame(boucle);
    if (moi && !calme) {
      setTimeout(() => canvas.isConnected && sel.transition().duration(1600).call(zoom.transform, versMoi()), DUREE_REV.zoom);
      setTimeout(() => canvas.isConnected && sel.transition().duration(1600).call(zoom.transform, d3.zoomIdentity), DUREE_REV.vue);
    }
    const surRedim = () => { if (!canvas.isConnected) return removeEventListener("resize", surRedim); ajuster(); dessiner(); };
    addEventListener("resize", surRedim);

    // RG-009-15 : toucher un point affiche la carte du joueur
    canvas.addEventListener("click", (ev) => {
      const r = canvas.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top;
      let best = null, dmin = 22 * 22;
      for (const p of L0.N) { const d = (p.sx - x) ** 2 + (p.sy - y) ** 2; if (p.a && d < dmin) { dmin = d; best = p; } }
      const c = $("#rev-carte");
      if (!best) { c.hidden = true; return; }
      const f = FACTIONS[best.d.faction];
      c.innerHTML = `<span class="e">${best.e}</span><div><b>${esc(best.d.pseudo)}</b>${best === moi ? ` <span class="or">· ${t.revToi}</span>` : ""}
        <div class="petit muted">${f ? `${f.e} ${esc(lib(f))}` : t.revSansFaction} · ${t.revConnexions(best.deg)}</div>
        ${[chats.has(best.i) && J().revChat, R.survivant === best.i && J().revSurvivant, jumeaux.some(([a, b]) => a === best.i || b === best.i) && J().revJumeau].filter(Boolean).map((x) => `<div class="petit or">${x}</div>`).join("")}</div>`;
      c.hidden = false; c.onclick = () => (c.hidden = true);
    });
    $("#rev-vue").onclick = () => sel.transition().duration(900).call(zoom.transform, d3.zoomIdentity);
    if (propagation.length || chats.size) {
      const b = $("#rev-cont"), stats = $("#rev-stats").textContent;
      b.hidden = false;
      b.onclick = () => {
        vueCont = !vueCont;
        b.textContent = vueCont ? J().revConstellation : J().revContagion;
        $("#rev-stats").textContent = vueCont ? J().revContStats(corrompus.size, chats.size, propagation.length) : stats;
        dessiner();
      };
    }
    if (moi) { $("#rev-moi").hidden = false; $("#rev-moi").onclick = () => sel.transition().duration(900).call(zoom.transform, versMoi()); }

    // RG-015-5 et RG-009-12 : temps d'écran de la soirée et faction de rattachement
    setTimeout(async () => {
      if (!canvas.isConnected) return;
      const bas = $("#rev-bas");
      if (moi && !apercu) {
        await envoyerEcran(); await chargerMoi();
        const pe = etat.moi && etat.moi.personnage;
        if (pe && canvas.isConnected) {
          const s = (pe.temps_ecran_s || 0) + (Number(lire(CLE.ecran)) || 0);
          const fin = Math.min(Date.now(), Date.parse((etat.heures || {}).fin) || Date.now());
          const pct = Math.min(100, Math.round((s * 1000 * 100) / Math.max(60_000, fin - Date.parse(pe.cree_le))));
          const h = Math.floor(s / 3600), mn = Math.floor((s % 3600) / 60);
          const duree = h ? (L === "en" ? `${h}h ${String(mn).padStart(2, "0")}` : `${h} h ${String(mn).padStart(2, "0")}`) : `${mn} min`;
          $("#rev-ecran").innerHTML = t.revEcran(duree, pct);
        }
      }
      const f = moi && FACTIONS[moi.d.faction];
      $("#rev-faction").innerHTML = f ? `${t.revFaction(`<b>${f.e} ${esc(lib(f))}</b>`)}${moi.d.multi ? `<br><span class="petit muted">${t.revFactionAide}</span>` : ""}` : "";
      if (canvas.isConnected) bas.hidden = false;
    }, moi && !calme ? DUREE_REV.morpheFin : 600);
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
    try {
      r = await api("/api/collection");
      ecrire(CLE.collection, JSON.stringify(r));
    } catch (e) {
      r = lireJson(CLE.collection); // CA-004-3 : consultable hors ligne, dernière version synchronisée
      if (!r || e.erreur !== "reseau") return ecranErreur(e, collection);
    }
    const missions = etat.moi && etat.moi.personnage ? blocMissions(etat.moi) : "";
    if (!r.cartes.length) { rendre(`<h2>${t.collectionTitre}</h2>${missions}<p class="maintenant">${t.vide}</p><a class="bouton" href="/saisie" data-nav>📷 ${t.scanner}</a>${blocLegendes(r)}`, { onglet: "collection" }); return brancherLegendes(r); }
    rendre(`<h2>${t.collectionTitre} · ${r.cartes.length}</h2>${missions}${blocLegendes(r)}<div class="grille-cartes">${r.cartes.map((c, i) => `<button class="mini" data-i="${i}" style="--teinte:${couleurDe(c.couleur).hex}">
        ${c.nb_scans > 1 ? `<span class="n">×${c.nb_scans}</span>` : ""}<div class="e">${typeDe(c.type).e}</div><div class="pseudo">${esc(c.pseudo)}</div></button>`).join("")}</div>`, { onglet: "collection" });
    brancherLegendes(r);
    app.querySelectorAll(".mini").forEach((x) => (x.onclick = () => {
      const c = r.cartes[+x.dataset.i];
      rendre(`<button class="retour" id="b-retour">${t.retour}</button>${carte(c)}${souvenirBloc(c.souvenir)}
        ${reactionsBloc(c.id, c.mes_reactions || [])}
        <ul class="liste"><li>${(c.attributs || []).map((a) => attrDe(a)).filter(Boolean).map((a) => `${a.e} ${lib(a)}`).join("<br>") || "—"}</li>
        <li class="mono petit">${t.premierScan} : ${new Date(c.premier_scan_le).toLocaleTimeString(L === "en" ? "en-CA" : "fr-CA", { hour: "2-digit", minute: "2-digit" })}</li>
        <li class="mono petit">${t.rescans(c.nb_scans)}</li></ul>`, { onglet: "collection" });
      $("#b-retour").onclick = collection;
      brancherReactions((_, mes) => { c.mes_reactions = mes; ecrire(CLE.collection, JSON.stringify(r)); });
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
    rendre(`<h2>${t.moiTitre}</h2>${carte({ ...pe, factions: d.etiquettes.map((e) => e.faction) })}${encadreDouble(d.jumeau, false)}
      <h3>${t.jauge}</h3><div class="jauge" style="--n:${Math.min(20, pe.souvenirs ?? 10)}"><b>🧠 ${pe.souvenirs ?? 10}</b><i></i></div><p class="petit muted">${t.jaugeAide}</p>
      <h3>${t.reactionsRecues}</h3>${Object.keys(d.reactions || {}).length ? `<p class="reactions-recues">${Object.entries(d.reactions).map(([e, n]) => `<span>${e} <b>${n}</b></span>`).join("")}</p>` : `<p class="muted petit">${t.aucuneReaction}</p>`}
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

  // Service worker : interface disponible hors ligne après une première visite (RG-021-2, RG-021-4)
  if ("serviceWorker" in navigator && !SUFFIXE) navigator.serviceWorker.register("/sw.js").catch(() => {});
  route();
  synchroniser();
  chargerMoi().then(rafraichirDirect);
})();
