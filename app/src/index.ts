// Worker « Déjà vu ! » : application du joueur (/api/*), étiquettes et panneau du MJ.
import { debutConnexion, deconnexion, retourConnexion, utilisateurConnecte, type EnvAuth } from "./auth";
import { genererCodes, normaliserCode } from "./codes";
import { arreterEclair, bilanEclair, ECLAIRS, lancerEclair } from "./eclair";
import { chargerCodesJeu } from "./codes-jeu";
import { ecrireConfig, HEURES_PAR_DEFAUT, lireConfig, lireParametres, PREREGLAGES, type CleConfig } from "./config";
import { etatDirect, evenement, isoVersLocal } from "./direct";
import { csvNiimbot } from "./csv";
import { etatRoles, relancerFoyer } from "./jumeaux";
import { annulerMission, annulerSanction, confierMission, etatMJ, fermerPause, heureDuJoueur, heureGlobale, MISSIONS, ouvrirPause, RECOMPENSES_M7, reussirMission, sanctionner } from "./mj";
import { construireInstantane, ecrireImage, lireImage, SANS_BORNE, validerImage } from "./revelation";
import { langue, pageAdmin, pageApp, pageConnexion, pageGalerie, type Compte, type EtiquetteVue, type Lot } from "./pages";
import { definirPin, routeApi } from "./jeu";
import { localVersIso } from "./temps";
import { avecAgent, devActif, routeDev, TABLES_PARTIE } from "./dev";
import { avecPhotos, masquerPhoto, murAdmin, photosRevelation } from "./mur";
import { bancEnvironnement, bancProd, peutOuvrirBanc } from "./mode";
import { etatPush, pushTest, routeLotInterne, tickPush } from "./push";
import { frise, suggestionsEnCours, tickSuggestions, traiterSuggestion } from "./suivi";

export interface Env extends EnvAuth {
  DB: D1Database;
  BANC?: string;
  /** Posé par requête quand la personne connectée a droit au banc (voir mode.ts). */
  BANC_SESSION?: boolean;
  /** LOT-3 D : clé privée VAPID (secret) et liaison vers ce même Worker pour répartir les envois. */
  VAPID_JWK?: string;
  SOI?: Fetcher;
}

const FORMATS = ["petit", "grand"];
const ROLES = ["normale", "personnelle_mj", "speciale_mj"];
const ETATS = ["vierge", "reclamee", "desactivee"];

export default {
  /** Cron Trigger, chaque minute : annonces et notifications push (LOT-3 D). */
  async scheduled(_c: ScheduledController, env: Env, ctx: ExecutionContext) {
    // Suggestions d'abord (toutes les 10 min) : leur notification au MJ part dans le même tick
    ctx.waitUntil(tickSuggestions(env, Date.now()).then(() => tickPush(env, Date.now())).then(() => undefined));
  },
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/__push/lot" && req.method === "POST") return routeLotInterne(req, env);
    // Banc derrière Google : MJ et lecteur en local et sur l'aperçu, fermé en production
    env = { ...env, BANC_SESSION: false };
    const bancDemande = url.pathname === "/banc" || url.pathname.startsWith("/__dev/");
    if (bancDemande || req.headers.has("Cookie") || bancEnvironnement(env)) {
      const u = await utilisateurConnecte(req, env).catch(() => null);
      if (peutOuvrirBanc(env, u?.role)) env = { ...env, BANC_SESSION: true };
      else if (url.pathname === "/banc") return u ? new Response(bancEnvironnement(env) ? "Banc réservé au panneau." : "Banc fermé en production.", { status: 403 }) : Response.redirect(`${url.origin}/admin`, 302);
    }
    if (devActif(env)) {
      if (req.method === "POST" && url.pathname.startsWith("/__dev/") && req.headers.get("Origin") !== url.origin) {
        return new Response("Origine refusée", { status: 403 });
      }
      const r = await routeDev(req, env, url);
      if (r) return r;
      return avecAgent(await servir(req, env, url));
    }
    return servir(req, env, url);
  },
};

async function servir(req: Request, env: Env, url: URL): Promise<Response> {
  {
    const chemin = url.pathname;
    try {
      if (chemin === "/") {
        const saisie = url.searchParams.get("code");
        if (saisie !== null) {
          const code = normaliserCode(saisie);
          if (!code) return pageApp(langue(req), 404);
          const q = new URLSearchParams({ s: "m" });
          const l = url.searchParams.get("lang");
          if (l === "fr" || l === "en") q.set("lang", l);
          return Response.redirect(`${url.origin}/${code}?${q}`, 302);
        }
        return pageApp(langue(req));
      }
      if (chemin.startsWith("/api/")) return routeApi(req, env, url);
      if (["/collection", "/moi", "/saisie", "/mur", "/tuto", "/badges", "/medailles", "/revelation"].includes(chemin)) return pageApp(langue(req));
      if (/^\/duel\/\d{1,9}$/.test(chemin)) return pageApp(langue(req));
      if (chemin === "/auth/connexion") return debutConnexion(env);
      if (chemin === "/auth/retour") return retourConnexion(req, env);
      if (chemin === "/auth/deconnexion") return deconnexion(env);
      if (chemin === "/admin" || chemin.startsWith("/admin/")) return admin(req, env, url);

      const m = chemin.match(/^\/([^/]{4,6})\/?$/);
      if (m) return etiquette(req, env, m[1]);
      return pageApp(langue(req), 404);
    } catch (e) {
      console.error(e);
      return new Response("Erreur interne", { status: 500 });
    }
  }
}

async function etiquette(req: Request, env: Env, brut: string): Promise<Response> {
  // La page de l'étiquette est l'application : elle traite le scan via /api/scan.
  let code: string | null = null;
  try { code = normaliserCode(decodeURIComponent(brut)); } catch { /* encodage invalide */ }
  if (!code) return pageApp(langue(req), 404);
  if (code !== brut) {
    const u = new URL(req.url);
    return Response.redirect(`${u.origin}/${code}${u.search}`, 301);
  }
  const e = await env.DB.prepare("SELECT 1 AS x FROM etiquettes WHERE code = ?").bind(code).first();
  return pageApp(langue(req), e ? 200 : 404);
}

async function admin(req: Request, env: Env, url: URL): Promise<Response> {
  const u = await utilisateurConnecte(req, env);
  if (!u) return url.pathname === "/admin" ? pageConnexion(url.searchParams.has("connexion")) : new Response("Non autorisé", { status: 401 });
  const email = u.email;
  // Lecture seule : ni modification, ni export des codes (qui permettraient de réclamer des étiquettes)
  if (u.role !== "mj" && (req.method !== "GET" || url.pathname === "/admin/export.csv")) {
    return new Response("Lecture seule : action réservée au maître du jeu.", { status: 403 });
  }

  if (req.method === "POST") {
    // Protection CSRF : les formulaires viennent forcément de notre origine
    if (req.headers.get("Origin") !== url.origin) return new Response("Origine refusée", { status: 403 });
    const f = await req.formData();
    const retour = (q: Record<string, string>) =>
      Response.redirect(`${url.origin}/admin?${new URLSearchParams(q)}`, 303);

    if (url.pathname === "/admin/mur/masquer") {
      // Galerie des photos (appui long) : réponse JSON ; sinon retour à la galerie
      const id = Number(f.get("id")), masquee = String(f.get("masquee")) === "1";
      const ok = await masquerPhoto(env.DB, id, masquee);
      if (ok) await journal(env, email, "photo", { id, masquee });
      if (req.headers.get("X-Galerie")) return new Response(JSON.stringify({ ok, masquee }), { status: ok ? 200 : 404, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
      return Response.redirect(`${url.origin}/admin/photos`, 303);
    }
    if (url.pathname === "/admin/generer") {
      const n = Number(f.get("n")), format = String(f.get("format")), role = String(f.get("role"));
      if (!Number.isInteger(n) || n < 1 || n > 2000 || !FORMATS.includes(format) || !ROLES.includes(role)) {
        return retour({ erreur: "Paramètres de génération invalides" });
      }
      const existants = new Set(
        (await env.DB.prepare("SELECT code FROM etiquettes").all<{ code: string }>()).results.map((r) => r.code),
      );
      const lot = ((await env.DB.prepare("SELECT MAX(lot) AS m FROM etiquettes").first<{ m: number | null }>())?.m ?? 0) + 1;
      const codes = genererCodes(n, existants);
      const stmt = env.DB.prepare("INSERT INTO etiquettes (code, format, role, lot) VALUES (?, ?, ?, ?)");
      for (let i = 0; i < codes.length; i += 100) {
        await env.DB.batch(codes.slice(i, i + 100).map((c) => stmt.bind(c, format, role, lot)));
      }
      await journal(env, email, "generer", { lot, n, format, role });
      return retour({ message: `Lot #${lot} : ${n} étiquettes ${format} (${role}) générées.` });
    }

    if (url.pathname === "/admin/charger-jeu") {
      const r = await chargerCodesJeu(env.DB);
      await journal(env, email, "charger_jeu", r);
      return retour({ message: r.ajoutes
        ? `Codes du jeu chargés : ${r.ajoutes} étiquette(s) ajoutée(s) (lots ${r.lots.map((l) => `#${l}`).join(", ")}), ${r.deja} déjà en base.`
        : `Codes du jeu déjà chargés : les ${r.deja} étiquettes sont en base.` });
    }

    if (url.pathname === "/admin/etiquette") {
      const code = normaliserCode(String(f.get("code") || ""));
      const role = String(f.get("role")), etat = String(f.get("etat"));
      if (!code || !ROLES.includes(role) || !ETATS.includes(etat)) return retour({ erreur: "Modification invalide" });
      await env.DB.prepare("UPDATE etiquettes SET role = ?, etat = ? WHERE code = ?").bind(role, etat, code).run();
      await journal(env, email, "modifier_etiquette", { code, role, etat });
      return retour({ code, message: `Étiquette ${code} mise à jour.` });
    }

    if (url.pathname === "/admin/pin") {
      const code = normaliserCode(String(f.get("code") || "")), pin = String(f.get("pin") || "");
      const e = code ? await env.DB.prepare("SELECT personnage_id FROM etiquettes WHERE code = ?").bind(code).first<{ personnage_id: string | null }>() : null;
      if (!e?.personnage_id || !/^\d{4}$/.test(pin)) return retour({ code: code || "", erreur: "PIN invalide ou étiquette sans personnage" });
      await definirPin(env, e.personnage_id, pin);
      await env.DB.prepare("DELETE FROM pin_essais WHERE code IN (SELECT code FROM etiquettes WHERE personnage_id = ?)").bind(e.personnage_id).run();
      await journal(env, email, "pin", { code });
      return retour({ code: code!, message: `PIN réinitialisé pour le personnage de ${code}.` });
    }

    if (url.pathname === "/admin/detacher") {
      const code = normaliserCode(String(f.get("code") || ""));
      if (!code) return retour({ erreur: "Code invalide" });
      await env.DB.prepare("UPDATE etiquettes SET etat = 'vierge', personnage_id = NULL, faction_id = NULL, reclamee_le = NULL WHERE code = ?").bind(code).run();
      await journal(env, email, "detacher", { code });
      return retour({ code, message: `Étiquette ${code} détachée : elle est de nouveau vierge.` });
    }

    if (url.pathname === "/admin/partie-zero") {
      if (String(f.get("confirmation")).trim().toUpperCase() !== "ZERO") return retour({ erreur: "Confirmation manquante : rien n'a été effacé." });
      await env.DB.batch([
        ...TABLES_PARTIE.map((x) => env.DB.prepare(`DELETE FROM ${x}`)),
        env.DB.prepare("UPDATE etiquettes SET etat = 'vierge', personnage_id = NULL, faction_id = NULL, reclamee_le = NULL WHERE etat = 'reclamee'"),
      ]);
      await journal(env, email, "partie_zero", {});
      return retour({ message: "Partie remise à zéro." });
    }

    // ---------- En direct (ADM-3, ADM-5, ADM-6, ADM-15) ----------
    const t = Date.now(), iso = new Date(t).toISOString();
    if (url.pathname === "/admin/direct/message") {
      const texte = String(f.get("texte") || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 200);
      if (!texte) return retour({ erreur: "Message vide : rien n'a été envoyé." });
      await evenement(env.DB, { type: "message", donnees: { texte }, debut: iso, fin: new Date(t + 15 * 60_000).toISOString(), auteur: email });
      await journal(env, email, "message", { texte });
      return retour({ message: "Message envoyé à tous les joueurs (visible 15 min)." });
    }
    if (url.pathname === "/admin/direct/eclair") {
      const code = String(f.get("code"));
      const err = await lancerEclair(env, code, email, t);
      if (err) return retour({ erreur: err });
      await journal(env, email, "mission_eclair", { code });
      return retour({ message: `Mission éclair lancée : ${ECLAIRS[code].nom} (${ECLAIRS[code].duree} min).` });
    }
    if (url.pathname === "/admin/direct/eclair-stop") {
      const ok = await arreterEclair(env.DB, t);
      if (ok) await journal(env, email, "mission_eclair_stop", {});
      return retour(ok ? { message: "Mission éclair arrêtée." } : { erreur: "Aucune mission éclair en cours." });
    }
    if (url.pathname === "/admin/direct/glitch") {
      const texte = String(f.get("texte") || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 120);
      await evenement(env.DB, { type: "glitch", donnees: texte ? { texte } : {}, debut: iso, fin: new Date(t + 5000).toISOString(), auteur: email });
      await journal(env, email, "glitch", { texte });
      return retour({ message: "Glitch global déclenché." });
    }
    if (url.pathname === "/admin/direct/revelation") {
      const action = String(f.get("action"));
      const h = { ...HEURES_PAR_DEFAUT, ...((await lireConfig(env.DB, "heures")) as object) } as typeof HEURES_PAR_DEFAUT;
      const actuelle = Date.parse(localVersIso(h.revelation));
      const nouvelle = action === "maintenant" ? isoVersLocal(t)
        : action === "plus15" ? isoVersLocal(actuelle + 15 * 60_000)
        : action === "moins15" ? isoVersLocal(actuelle - 15 * 60_000)
        : action === "defaut" ? HEURES_PAR_DEFAUT.revelation : null;
      if (!nouvelle) return retour({ erreur: "Action inconnue" });
      await ecrireConfig(env.DB, "heures", { ...h, revelation: nouvelle });
      await journal(env, email, "revelation", { action, revelation: nouvelle });
      return retour({ message: `Révélation fixée à ${nouvelle.replace("T", " ")}.` });
    }
    if (url.pathname === "/admin/revelation/image") {
      if (String(f.get("action")) === "defaut") {
        await ecrireImage(env.DB, null);
        await journal(env, email, "revelation_image", { nom: "défaut" });
        return retour({ message: "Image cachée : retour à « DÉJÀ VU ! »." });
      }
      let img = null;
      try { img = validerImage(JSON.parse(String(f.get("points") || "null"))); } catch { /* invalide */ }
      if (!img) return retour({ erreur: "Image cachée invalide (20 à 5000 points sur une grille de 400 × 400 au plus) : rien n'a été enregistré." });
      await ecrireImage(env.DB, img);
      await journal(env, email, "revelation_image", { nom: img.nom, points: img.p.length });
      return retour({ message: `Image cachée « ${img.nom} » enregistrée (${img.p.length} points).` });
    }
    // ---------- Costume du MJ : pause, sanctions, missions (ADM-17 à ADM-19) ----------
    if (url.pathname === "/admin/mj/pause") {
      const minutes = Number(f.get("minutes"));
      if (![0, 5, 10, 15].includes(minutes)) return retour({ erreur: "Durée de pause invalide" });
      await ouvrirPause(env, minutes, email);
      await journal(env, email, "pause", { minutes });
      return retour({ message: minutes ? `Fermé pour inventaire pendant ${minutes} min.` : "Fermé pour inventaire jusqu'à réouverture." });
    }
    if (url.pathname === "/admin/mj/rouvrir") {
      await fermerPause(env);
      await journal(env, email, "pause_fin", {});
      return retour({ message: "Magasin rouvert : les légendaires et les pièges reprennent." });
    }
    const perso = String(f.get("personnage") || "");
    const nomDe = async (id: string) => (await env.DB.prepare("SELECT pseudo FROM personnages WHERE id = ?").bind(id).first<{ pseudo: string }>())?.pseudo;
    if (url.pathname === "/admin/mj/sanction") {
      const niveau = Number(f.get("niveau")), nom = await nomDe(perso);
      if (!nom || !(niveau >= 1 && niveau <= 5)) return retour({ erreur: "Sanction invalide" });
      // RG-020-8 : niveau 5, confirmation renforcée (le bouton maintenu 2 s envoie « confirme »)
      if (niveau === 5 && f.get("confirme") !== "oui") return retour({ erreur: "Niveau 5 : maintiens le bouton 2 s pour confirmer." });
      await sanctionner(env, perso, niveau, email);
      await journal(env, email, "sanction", { personnage: perso, pseudo: nom, niveau });
      return retour({ message: `Sanction de niveau ${niveau} appliquée à ${nom}.` });
    }
    if (url.pathname === "/admin/mj/sanction/annuler") {
      const s = await annulerSanction(env, Number(f.get("id")));
      if (!s) return retour({ erreur: "Sanction introuvable ou déjà annulée" });
      await journal(env, email, "sanction_annulee", { id: Number(f.get("id")), niveau: s.niveau });
      return retour({ message: `Sanction de niveau ${s.niveau} annulée.` });
    }
    if (url.pathname === "/admin/mj/mission") {
      const code = String(f.get("code")), nom = await nomDe(perso);
      if (!nom || !(code in MISSIONS)) return retour({ erreur: "Mission invalide" });
      const err = await confierMission(env, perso, code, email, Number(f.get("duree")) || undefined);
      if (err) return retour({ erreur: err });
      await journal(env, email, "mission", { personnage: perso, pseudo: nom, code });
      return retour({ message: code === "M-6" ? `Solde privée offerte à ${nom}.` : `Mission ${code} confiée à ${nom}.` });
    }
    if (url.pathname === "/admin/mj/mission/reussie") {
      const r = String(f.get("recompense") || "points");
      if (!(RECOMPENSES_M7 as readonly string[]).includes(r)) return retour({ erreur: "Récompense inconnue" });
      if (!(await reussirMission(env, Number(f.get("id")), undefined, r))) return retour({ erreur: "Mission introuvable ou déjà terminée" });
      await journal(env, email, "mission_reussie", { id: Number(f.get("id")), recompense: r });
      return retour({ message: "Mission validée : récompense et badge « Employé du mois » donnés." });
    }
    if (url.pathname === "/admin/mj/mission/annuler") {
      if (!(await annulerMission(env, Number(f.get("id"))))) return retour({ erreur: "Mission introuvable ou déjà terminée" });
      await journal(env, email, "mission_annulee", { id: Number(f.get("id")) });
      return retour({ message: "Mission annulée." });
    }
    // ---------- Contagion en direct (ADM-7, RG-008-7) ----------
    if (url.pathname === "/admin/contagion") {
      const tr = Number(f.get("transmission")), d = Number(f.get("corruption_min"));
      if (!(tr >= 0 && tr <= 100) || !(d >= 1 && d <= 60)) return retour({ erreur: "Réglage de contagion invalide" });
      const p = await lireParametres(env.DB);
      await ecrireConfig(env.DB, "parametres", { ...p, bareme: { ...p.bareme, transmission: tr / 100 }, contagion: { ...p.contagion, corruption_min: d } });
      await journal(env, email, "contagion", { transmission: tr, corruption_min: d });
      return retour({ message: `Contagion : transmission ${tr} %, corruption ${d} min. Les prochains scans appliquent ces valeurs.` });
    }
    if (url.pathname === "/admin/suggestion") {
      const r = await traiterSuggestion(env, Number(f.get("id")), f.get("action") === "appliquer", email, (id) => heureDuJoueur(env.DB, id));
      await journal(env, email, "suggestion", { id: Number(f.get("id")), action: f.get("action") });
      return retour(r.erreur ? { erreur: r.erreur } : { message: r.message! });
    }
    if (url.pathname === "/admin/push/test") {
      const r = (await env.DB.prepare("SELECT a.endpoint FROM abonnements_push a JOIN personnages p ON p.id = a.personnage_id WHERE p.est_mj = 1").all<{ endpoint: string }>()).results;
      if (!r.length) return retour({ erreur: "Aucun appareil du MJ abonné : active les notifications dans l'app avec ton personnage de MJ." });
      const x = await pushTest(env, r.map((a) => a.endpoint));
      return retour({ message: `Push de test : ${x.ok} envoyé(s), ${x.rates} échec(s), ${x.morts} abonnement(s) expiré(s).` });
    }
    if (url.pathname === "/admin/contagion/foyer") {
      const n = await relancerFoyer(env, (id) => heureDuJoueur(env.DB, id), 3);
      await journal(env, email, "foyer", { n });
      return retour({ message: n ? `Foyer relancé : ${n} joueur(s) corrompu(s).` : "Aucun joueur sain à corrompre." });
    }
    if (url.pathname === "/admin/prereglage") {
      const nom = String(f.get("nom"));
      if (!(nom in PREREGLAGES)) return retour({ erreur: "Préréglage inconnu" });
      const p = await lireParametres(env.DB);
      await ecrireConfig(env.DB, "parametres", { ...p, prereglage: nom, bareme: {} });
      await journal(env, email, "prereglage", { nom });
      return retour({ message: `Préréglage « ${nom} » appliqué ; saisies manuelles du barème effacées.` });
    }

    if (url.pathname === "/admin/config") {
      const cle = String(f.get("cle")) as CleConfig;
      if (cle !== "heures" && cle !== "parametres") return retour({ erreur: "Clé inconnue" });
      let valeur: unknown;
      try {
        valeur = JSON.parse(String(f.get("valeur")));
      } catch {
        return retour({ erreur: "JSON invalide : rien n'a été enregistré." });
      }
      if (cle === "heures") {
        try {
          for (const v of Object.values(valeur as Record<string, string>)) localVersIso(v);
        } catch (e) {
          return retour({ erreur: (e as Error).message });
        }
      }
      await ecrireConfig(env.DB, cle, valeur);
      await journal(env, email, "config", { cle });
      return retour({ message: `Réglages « ${cle} » enregistrés.` });
    }
    return new Response("Introuvable", { status: 404 });
  }

  if (url.pathname === "/admin/export.csv") {
    const lot = url.searchParams.get("lot"), format = url.searchParams.get("format");
    const q = lot
      ? env.DB.prepare("SELECT code FROM etiquettes WHERE lot = ? AND banc = 0 ORDER BY rowid").bind(Number(lot))
      : env.DB.prepare("SELECT code FROM etiquettes WHERE format = ? AND banc = 0 ORDER BY lot, rowid").bind(format === "grand" ? "grand" : "petit");
    const codes = (await q.all<{ code: string }>()).results.map((r) => r.code);
    const nom = lot ? `etiquettes-lot-${Number(lot)}.csv` : `etiquettes-${format === "grand" ? "grand" : "petit"}.csv`;
    await journal(env, email, "export", { lot, format, n: codes.length });
    return new Response(csvNiimbot(codes), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${nom}"`, "Cache-Control": "no-store" },
    });
  }

  // Aperçu de la révélation pour le MJ : instantané à l'instant présent, jamais enregistré
  if (url.pathname === "/admin/revelation/apercu.json") {
    return new Response(avecPhotos(JSON.stringify(await construireInstantane(env, new Date().toISOString(), SANS_BORNE)), await photosRevelation(env.DB)), {
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  // Galerie des photos de scan (RG-017-6) ; l'ancienne adresse du mur y mène aussi
  if (url.pathname === "/admin/mur") return Response.redirect(`${url.origin}/admin/photos`, 302);
  if (url.pathname === "/admin/photos") return pageGalerie(await murAdmin(env.DB, undefined, 40), u.role !== "mj");
  if (url.pathname === "/admin/photos.json") {
    const m = await murAdmin(env.DB, Number(url.searchParams.get("avant")) || undefined, 40);
    return new Response(JSON.stringify({ ...m, photos: m.photos.map((x) => ({ ...x, heure: new Date(x.le).toLocaleTimeString("fr-CA", { timeZone: "America/Toronto", hour: "2-digit", minute: "2-digit" }) })) }), {
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  if (url.pathname !== "/admin") return new Response("Introuvable", { status: 404 });
  const comptes = (await env.DB.prepare("SELECT format, role, etat, COUNT(*) AS n FROM etiquettes WHERE banc = 0 GROUP BY format, role, etat").all<Compte>()).results;
  const lots = (await env.DB.prepare("SELECT lot, format, role, COUNT(*) AS n, MIN(cree_le) AS cree_le, MAX(banc) AS banc FROM etiquettes GROUP BY lot, format, role ORDER BY lot DESC").all<Lot>()).results;
  const recherche = url.searchParams.get("code") || "";
  const code = recherche ? normaliserCode(recherche) : null;
  const etiquette = code
    ? await env.DB.prepare(
        `SELECT e.code, e.format, e.role, e.etat, e.lot, e.cree_le, e.personnage_id, e.faction_id, p.pseudo,
           (SELECT COUNT(*) FROM etiquettes x WHERE x.personnage_id = e.personnage_id) AS nb_etiquettes
         FROM etiquettes e LEFT JOIN personnages p ON p.id = e.personnage_id WHERE e.code = ?`,
      ).bind(code).first<EtiquetteVue>()
    : null;
  return pageAdmin({
    email, role: u.role, comptes, lots, etiquette, recherche, banc: peutOuvrirBanc(env, u.role),
    joueurs: {
      personnages: (await env.DB.prepare("SELECT COUNT(*) AS n FROM personnages").first<{ n: number }>())?.n ?? 0,
      scans: (await env.DB.prepare("SELECT COUNT(*) AS n FROM scans").first<{ n: number }>())?.n ?? 0,
      cartes: (await env.DB.prepare("SELECT COUNT(*) AS n FROM collection").first<{ n: number }>())?.n ?? 0,
    },
    heures: await lireConfig(env.DB, "heures"),
    parametres: await lireParametres(env.DB),
    direct: await etatDirect(env, Date.now()),
    eclair: await bilanEclair(env.DB, Date.now()),
    image: await lireImage(env.DB),
    mj: await etatMJ(env),
    roles: await etatRoles(env, await heureGlobale(env)),
    push: await etatPush(env),
    frise: await frise(env, await heureGlobale(env)),
    suggestions: await suggestionsEnCours(env.DB),
    message: url.searchParams.get("message") || undefined,
    erreur: url.searchParams.get("erreur") || undefined,
  });
}

async function journal(env: Env, qui: string, action: string, details: unknown) {
  await env.DB.prepare("INSERT INTO journal_mj (qui, action, details) VALUES (?, ?, ?)").bind(qui, action, JSON.stringify(details)).run();
}
