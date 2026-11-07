// Retour Google sans cookie d'état valide : redirection vers l'admin, jamais « État OAuth invalide ».
import { describe, expect, it } from "vitest";
import { retourConnexion, signer } from "../src/auth";

const env = { PUBLIC_ORIGIN: "https://p.uyt.re", SESSION_SECRET: "s", ADMIN_EMAILS: "mj@exemple.org", GOOGLE_CLIENT_ID: "x", GOOGLE_CLIENT_SECRET: "y" };
const retour = (cookie?: string) =>
  retourConnexion(new Request("https://p.uyt.re/auth/retour?state=abc&code=c", { headers: cookie ? { Cookie: cookie } : {} }), env as never);

describe("retour de connexion Google", () => {
  it("état absent (retour rejoué, autre fenêtre) : page de connexion avec « Réessayer »", async () => {
    const r = await retour();
    expect(r.status).toBe(302);
    expect(r.headers.get("Location")).toBe("https://p.uyt.re/admin?connexion=interrompue");
  });

  it("état absent mais déjà connecté (1re ouverture réussie) : directement l'admin", async () => {
    const jeton = await signer("s", { email: "mj@exemple.org", exp: Math.floor(Date.now() / 1000) + 3600 });
    const r = await retour(`dv_mj=${jeton}`);
    expect(r.headers.get("Location")).toBe("https://p.uyt.re/admin");
  });

  it("état différent : jamais d'échange de code avec Google", async () => {
    const r = await retour("dv_etat=autre");
    expect(r.headers.get("Location")).toContain("connexion=interrompue");
  });
});
