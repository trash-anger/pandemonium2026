// Worker « Déjà vu ! » — LOT-0 : étiquettes, page provisoire, panneau du MJ.
import { debutConnexion, deconnexion, retourConnexion, utilisateurConnecte, type EnvAuth } from "./auth";
import { genererCodes, normaliserCode } from "./codes";
import { ecrireConfig, lireConfig, HEURES_PAR_DEFAUT, type CleConfig, type Heures } from "./config";
import { csvNiimbot } from "./csv";
import {
  langue, pageAccueil, pageAdmin, pageConnexion, pageEtiquette, pageInconnue,
  type Compte, type EtiquetteVue, type Lot,
} from "./pages";
import { localVersIso } from "./temps";
import { avecAgent, devActif, routeDev } from "./dev";

export interface Env extends EnvAuth {
  DB: D1Database;
}

const FORMATS = ["petit", "grand"];
const ROLES = ["normale", "personnelle_mj", "speciale_mj"];
const ETATS = ["vierge", "reclamee", "desactivee"];

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (devActif(env)) {
      // Banc d'essai et simulation : uniquement en local (PUBLIC_ORIGIN = http://localhost…)
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
          return code ? Response.redirect(`${url.origin}/${code}${suffixeLangue(url)}`, 302) : pageInconnue(langue(req), saisie);
        }
        return pageAccueil(langue(req));
      }
      if (chemin === "/auth/connexion") return debutConnexion(env);
      if (chemin === "/auth/retour") return retourConnexion(req, env);
      if (chemin === "/auth/deconnexion") return deconnexion(env);
      if (chemin === "/admin" || chemin.startsWith("/admin/")) return admin(req, env, url);

      const m = chemin.match(/^\/([^/]{4,6})\/?$/);
      if (m) return etiquette(req, env, m[1]);
      return pageInconnue(langue(req), "");
    } catch (e) {
      console.error(e);
      return new Response("Erreur interne", { status: 500 });
    }
  }
}

async function etiquette(req: Request, env: Env, brut: string): Promise<Response> {
  const code = normaliserCode(decodeURIComponent(brut));
  if (!code) return pageInconnue(langue(req), brut);
  if (code !== brut) return Response.redirect(new URL(`/${code}${suffixeLangue(new URL(req.url))}`, req.url).toString(), 301);
  const e = await env.DB.prepare("SELECT etat FROM etiquettes WHERE code = ?").bind(code).first<{ etat: string }>();
  if (!e) return pageInconnue(langue(req), code);
  const heures = (await lireConfig(env.DB, "heures")) as Heures;
  return pageEtiquette(langue(req), code, e.etat, localVersIso(heures.debut || HEURES_PAR_DEFAUT.debut));
}

async function admin(req: Request, env: Env, url: URL): Promise<Response> {
  const u = await utilisateurConnecte(req, env);
  if (!u) return url.pathname === "/admin" ? pageConnexion() : new Response("Non autorisé", { status: 401 });
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

    if (url.pathname === "/admin/etiquette") {
      const code = normaliserCode(String(f.get("code") || ""));
      const role = String(f.get("role")), etat = String(f.get("etat"));
      if (!code || !ROLES.includes(role) || !ETATS.includes(etat)) return retour({ erreur: "Modification invalide" });
      await env.DB.prepare("UPDATE etiquettes SET role = ?, etat = ? WHERE code = ?").bind(role, etat, code).run();
      await journal(env, email, "modifier_etiquette", { code, role, etat });
      return retour({ code, message: `Étiquette ${code} mise à jour.` });
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
      ? env.DB.prepare("SELECT code FROM etiquettes WHERE lot = ? ORDER BY rowid").bind(Number(lot))
      : env.DB.prepare("SELECT code FROM etiquettes WHERE format = ? ORDER BY lot, rowid").bind(format === "grand" ? "grand" : "petit");
    const codes = (await q.all<{ code: string }>()).results.map((r) => r.code);
    const nom = lot ? `etiquettes-lot-${Number(lot)}.csv` : `etiquettes-${format === "grand" ? "grand" : "petit"}.csv`;
    await journal(env, email, "export", { lot, format, n: codes.length });
    return new Response(csvNiimbot(codes), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${nom}"`, "Cache-Control": "no-store" },
    });
  }

  if (url.pathname !== "/admin") return new Response("Introuvable", { status: 404 });
  const comptes = (await env.DB.prepare("SELECT format, role, etat, COUNT(*) AS n FROM etiquettes GROUP BY format, role, etat").all<Compte>()).results;
  const lots = (await env.DB.prepare("SELECT lot, format, role, COUNT(*) AS n, MIN(cree_le) AS cree_le FROM etiquettes GROUP BY lot, format, role ORDER BY lot DESC").all<Lot>()).results;
  const recherche = url.searchParams.get("code") || "";
  const code = recherche ? normaliserCode(recherche) : null;
  const etiquette = code
    ? await env.DB.prepare("SELECT code, format, role, etat, lot, cree_le FROM etiquettes WHERE code = ?").bind(code).first<EtiquetteVue>()
    : null;
  return pageAdmin({
    email, role: u.role, comptes, lots, etiquette, recherche,
    heures: await lireConfig(env.DB, "heures"),
    parametres: await lireConfig(env.DB, "parametres"),
    message: url.searchParams.get("message") || undefined,
    erreur: url.searchParams.get("erreur") || undefined,
  });
}

/** Conserve ?lang= lors des redirections. */
function suffixeLangue(url: URL): string {
  const l = url.searchParams.get("lang");
  return l === "fr" || l === "en" ? `?lang=${l}` : "";
}

async function journal(env: Env, qui: string, action: string, details: unknown) {
  await env.DB.prepare("INSERT INTO journal_mj (qui, action, details) VALUES (?, ?, ?)").bind(qui, action, JSON.stringify(details)).run();
}
