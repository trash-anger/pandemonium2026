// Les tests lisent les .csv comme wrangler (module texte, voir "rules" dans wrangler.jsonc).
import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [{
    name: "csv-texte",
    enforce: "pre",
    load: (id) => (id.endsWith(".csv") ? `export default ${JSON.stringify(readFileSync(id, "utf8"))};` : null),
  }],
});
