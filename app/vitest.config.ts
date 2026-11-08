// Les tests lisent les .csv et .html (texte) et les .png (octets) comme wrangler (module texte, voir "rules" dans wrangler.jsonc).
import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [{
    name: "csv-texte",
    enforce: "pre",
    load: (id) =>
      id.endsWith(".csv") || id.endsWith(".html") ? `export default ${JSON.stringify(readFileSync(id, "utf8"))};`
      : id.endsWith(".png") ? `export default Uint8Array.from(atob(${JSON.stringify(readFileSync(id).toString("base64"))}), (c) => c.charCodeAt(0)).buffer;`
      : null,
  }],
});
