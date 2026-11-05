# Régénère app/src/souvenirs-textes.ts depuis specs/textes.md §3 (lieux, chutes, gabarits).
# Usage, depuis la racine du dépôt : python3 app/scripts/textes-souvenirs.py
import json, re

src = open("specs/textes.md", encoding="utf-8").read()

def section(debut, fin):
    a = src.index(debut); b = src.index(fin, a)
    lignes = []
    for l in src[a:b].splitlines():
        m = re.match(r"^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$", l)
        if m: lignes.append([m.group(2), m.group(3)])
    return lignes

def tab(lignes, i): return json.dumps([r[i] for r in lignes], ensure_ascii=False, indent=2)

lieux, chutes, gab = section("### 3.2 Lieux", "### 3.3"), section("### 3.3 Chutes", "### 3.4"), section("### 3.4 Gabarits", "### 3.5")
open("app/src/souvenirs-textes.ts", "w", encoding="utf-8").write(f"""// Textes des faux souvenirs (FEAT-006), générés depuis specs/textes.md §3. Ne pas modifier à la main :
// corriger textes.md, puis relancer : python3 app/scripts/textes-souvenirs.py
export const LIEUX = {{ fr: {tab(lieux, 0)}, en: {tab(lieux, 1)} }};
export const CHUTES = {{ fr: {tab(chutes, 0)}, en: {tab(chutes, 1)} }};
export const GABARITS = {{ fr: {tab(gab, 0)}, en: {tab(gab, 1)} }};
""")
print(len(lieux), "lieux,", len(chutes), "chutes,", len(gab), "gabarits")
