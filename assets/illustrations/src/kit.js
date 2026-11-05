// Avatars « glossy » des 8 types de costume, en SVG pur (proposition graphique).
// avatar(type, uid) renvoie une chaîne <svg> carrée (viewBox 200×200).
(function () {
  const TYPES = {
    undead:  { emoji: "🧟", fr: "Mort-vivant",  price: "−90 %" },
    vampire: { emoji: "🧛", fr: "Vampire",      price: "−40 %" },
    mage:    { emoji: "🧙", fr: "Mage",         price: "−20 %" },
    robot:   { emoji: "🤖", fr: "Robot",        price: "−99 %" },
    beast:   { emoji: "🦄", fr: "Bestiole",     price: "−50 %" },
    sexy:    { emoji: "💋", fr: "Uniforme sexy", price: "−69 %" },
    hero:    { emoji: "🦸", fr: "Héros de film", price: "−30 %" },
    ufo:     { emoji: "🤡", fr: "OVNI vestimentaire", price: "−70 %" },
  };

  function lg(id, stops, x2 = 0, y2 = 1) {
    return `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops
      .map((c, i) => `<stop offset="${(i / (stops.length - 1)) * 100}%" stop-color="${c}"/>`)
      .join("")}</linearGradient>`;
  }
  function rg(id, inner, outer, cx = 0.35, cy = 0.3) {
    return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="0.8"><stop offset="0%" stop-color="${inner}"/><stop offset="100%" stop-color="${outer}"/></radialGradient>`;
  }
  // reflet brillant en haut à gauche + liseré rose à droite
  function gloss(u, cx = 82, cy = 78, rx = 26, ry = 14, rot = -30) {
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="url(#${u}gl)"/>`;
  }
  function common(u) {
    return `${lg(u + "gl", ["rgba(255,255,255,.95)", "rgba(255,255,255,0)"])}
      <filter id="${u}sh" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".55"/>
        <feDropShadow dx="3" dy="0" stdDeviation="3" flood-color="#ff4f8b" flood-opacity=".55"/>
      </filter>`;
  }
  const SHOULDERS = "M24 204 Q28 160 100 152 Q172 160 176 204Z";

  const DRAW = {
    undead: (u) => `
      <defs>${common(u)}${rg(u + "sk", "#c9f0b8", "#3f7d5c")}${lg(u + "cl", ["#5a5566", "#2a2633"])}</defs>
      <g filter="url(#${u}sh)">
        <path d="${SHOULDERS}" fill="url(#${u}cl)"/>
        <path d="M60 165 l8 14 l6 -12 l8 16 l6 -15" stroke="#1a1720" stroke-width="3" fill="none"/>
        <circle cx="100" cy="98" r="60" fill="url(#${u}sk)"/>
        <path d="M58 70 Q100 52 140 66" stroke="#1d3a2a" stroke-width="3" fill="none"/>
        <path d="M70 58 v18 M84 54 v18 M98 52 v18 M112 54 v18 M126 58 v16" stroke="#1d3a2a" stroke-width="3"/>
        <circle cx="78" cy="100" r="15" fill="#fffbe8"/><circle cx="82" cy="104" r="5" fill="#18161d"/>
        <ellipse cx="124" cy="104" rx="13" ry="9" fill="#1d3a2a"/><circle cx="124" cy="106" r="3" fill="#ff4f8b"/>
        <path d="M74 132 h52 l-5 10 l-6 -8 l-6 10 l-6 -10 l-6 10 l-6 -9 l-6 9 l-6 -9z" fill="#2a1820"/>
        <circle cx="140" cy="128" r="6" fill="#7aa86c" opacity=".7"/>
        ${gloss(u)}
      </g>`,
    vampire: (u) => `
      <defs>${common(u)}${rg(u + "sk", "#ffffff", "#c7b2db")}${lg(u + "co", ["#ff4f8b", "#a80036"])}${lg(u + "hr", ["#3a3445", "#0b0a0f"])}</defs>
      <g filter="url(#${u}sh)">
        <path d="M18 204 L34 140 L70 162 L100 150 L130 162 L166 140 L182 204Z" fill="url(#${u}co)"/>
        <path d="${SHOULDERS}" fill="#18161d"/>
        <ellipse cx="100" cy="100" rx="54" ry="62" fill="url(#${u}sk)"/>
        <path d="M44 96 Q44 34 100 34 Q156 34 156 96 Q146 66 120 62 L100 84 L80 62 Q54 66 44 96Z" fill="url(#${u}hr)"/>
        <path d="M70 104 l20 4 l-20 6z M130 104 l-20 4 l20 6z" fill="#a80036"/>
        <circle cx="80" cy="109" r="2.5" fill="#ff4f8b"/><circle cx="120" cy="109" r="2.5" fill="#ff4f8b"/>
        <path d="M80 134 Q100 146 120 134" stroke="#7a0029" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M88 137 l3 10 l3 -9z M106 137 l3 9 l3 -10z" fill="#fff"/>
        ${gloss(u, 78, 74)}
      </g>`,
    mage: (u) => `
      <defs>${common(u)}${rg(u + "sk", "#ffe0c8", "#c9876a")}${lg(u + "ht", ["#ff4f8b", "#5a2a8a", "#1e1a27"], 0.3, 1)}${lg(u + "rb", ["#5a2a8a", "#1e1a27"])}</defs>
      <g filter="url(#${u}sh)">
        <path d="${SHOULDERS}" fill="url(#${u}rb)"/>
        <circle cx="100" cy="112" r="50" fill="url(#${u}sk)"/>
        <path d="M30 92 Q100 70 170 92 Q160 104 100 100 Q40 104 30 92Z" fill="#2a1b3d"/>
        <path d="M52 92 L118 4 Q124 0 126 8 L148 92Z" fill="url(#${u}ht)"/>
        <path d="M96 40 l3 7 l7 1 l-5 5 l1 7 l-6 -4 l-6 4 l1 -7 l-5 -5 l7 -1z" fill="#ffd166"/>
        <circle cx="122" cy="66" r="3" fill="#3dff8a"/><circle cx="84" cy="70" r="2" fill="#fff"/>
        <circle cx="82" cy="118" r="9" fill="#3dff8a" opacity=".25"/><circle cx="82" cy="118" r="5" fill="#3dff8a"/>
        <circle cx="118" cy="118" r="9" fill="#3dff8a" opacity=".25"/><circle cx="118" cy="118" r="5" fill="#3dff8a"/>
        <path d="M86 142 Q100 150 114 142" stroke="#7a3a2a" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        ${gloss(u, 104, 36, 18, 8, -55)}
      </g>`,
    robot: (u) => `
      <defs>${common(u)}${lg(u + "cr", ["#ffffff", "#c9c7d8", "#6e6a85", "#d9d6e8"], 0.6, 1)}${lg(u + "vi", ["#0b0a0f", "#2a2633"])}</defs>
      <g filter="url(#${u}sh)">
        <path d="${SHOULDERS}" fill="url(#${u}cr)"/>
        <rect x="88" y="140" width="24" height="20" fill="#6e6a85"/>
        <line x1="100" y1="44" x2="100" y2="18" stroke="#c9c7d8" stroke-width="4"/>
        <circle cx="100" cy="16" r="8" fill="#ff4f8b"/><circle cx="97" cy="13" r="3" fill="#fff" opacity=".8"/>
        <rect x="42" y="42" width="116" height="104" rx="30" fill="url(#${u}cr)"/>
        <rect x="54" y="78" width="92" height="34" rx="17" fill="url(#${u}vi)"/>
        <rect x="64" y="92" width="72" height="6" rx="3" fill="#ff4f8b"/>
        <rect x="64" y="92" width="26" height="6" rx="3" fill="#ffd1e1"/>
        <circle cx="52" cy="56" r="3" fill="#6e6a85"/><circle cx="148" cy="56" r="3" fill="#6e6a85"/>
        <rect x="76" y="124" width="48" height="8" rx="4" fill="#3dff8a" opacity=".85"/>
        ${gloss(u, 78, 58, 26, 9, -12)}
      </g>`,
    beast: (u) => `
      <defs>${common(u)}${rg(u + "sk", "#ffffff", "#ffb3cf")}${lg(u + "ho", ["#ffd166", "#ff4f8b", "#3dff8a", "#9ec5ff"], 0.4, 1)}${lg(u + "mn", ["#ff4f8b", "#a80036"])}</defs>
      <g filter="url(#${u}sh)">
        <path d="${SHOULDERS}" fill="#ffb3cf"/>
        <path d="M62 60 Q40 110 52 176 Q66 140 70 110Z" fill="url(#${u}mn)"/>
        <path d="M86 56 L100 0 L114 56Z" fill="url(#${u}ho)"/>
        <path d="M92 40 L108 34 M90 26 L106 20" stroke="#fff" stroke-width="2.5" opacity=".7"/>
        <path d="M70 70 Q66 40 80 52Z M130 70 Q134 40 120 52Z" fill="#ffd1e1"/>
        <ellipse cx="100" cy="104" rx="50" ry="54" fill="url(#${u}sk)"/>
        <ellipse cx="108" cy="140" rx="30" ry="20" fill="#ffd1e1"/>
        <ellipse cx="98" cy="140" rx="3" ry="4" fill="#a80036"/><ellipse cx="118" cy="140" rx="3" ry="4" fill="#a80036"/>
        <ellipse cx="82" cy="98" rx="9" ry="12" fill="#18161d"/><circle cx="85" cy="94" r="3.5" fill="#fff"/>
        <ellipse cx="124" cy="98" rx="9" ry="12" fill="#18161d"/><circle cx="127" cy="94" r="3.5" fill="#fff"/>
        <path d="M72 88 l-6 -6 M76 85 l-3 -8 M132 88 l6 -6 M128 85 l3 -8" stroke="#18161d" stroke-width="2.5" stroke-linecap="round"/>
        ${gloss(u, 80, 72)}
      </g>`,
    sexy: (u) => `
      <defs>${common(u)}${rg(u + "sk", "#ffd7bd", "#b5765a")}${lg(u + "cp", ["#3a3f66", "#14162b"])}${lg(u + "gl2", ["#ff4f8b", "#ffd166", "#3dff8a"], 1, 1)}${lg(u + "lp", ["#ff6f9f", "#a80036"])}</defs>
      <g filter="url(#${u}sh)">
        <path d="${SHOULDERS}" fill="url(#${u}cp)"/>
        <path d="M84 156 L100 176 L116 156" fill="#efe9df"/>
        <rect x="124" y="172" width="22" height="12" rx="2" fill="#ffd166"/>
        <path d="M50 92 Q48 150 70 160 Q60 120 64 96Z M150 92 Q152 150 130 160 Q140 120 136 96Z" fill="#2a1820"/>
        <ellipse cx="100" cy="110" rx="46" ry="52" fill="url(#${u}sk)"/>
        <path d="M44 74 Q100 26 156 74 L160 86 L40 86Z" fill="url(#${u}cp)"/>
        <path d="M44 86 L156 86 Q170 92 166 98 L34 98 Q30 92 44 86Z" fill="#0b0a0f"/>
        <path d="M92 46 l8 -6 l8 6 l-2 14 l-6 4 l-6 -4z" fill="#ffd166"/>
        <rect x="58" y="102" width="36" height="20" rx="9" fill="url(#${u}gl2)"/>
        <rect x="106" y="102" width="36" height="20" rx="9" fill="url(#${u}gl2)"/>
        <path d="M94 110 h12" stroke="#18161d" stroke-width="3"/>
        <path d="M84 140 Q92 134 100 138 Q108 134 116 140 Q108 152 100 150 Q92 152 84 140Z" fill="url(#${u}lp)"/>
        <ellipse cx="94" cy="139" rx="4" ry="1.5" fill="#fff" opacity=".8"/>
        ${gloss(u, 70, 62, 22, 7, -20)}
      </g>`,
    hero: (u) => `
      <defs>${common(u)}${rg(u + "sk", "#f0b58c", "#8a5236")}${lg(u + "cp", ["#ff4f8b", "#a80036"])}${lg(u + "su", ["#2b3cff", "#141a66"])}</defs>
      <g filter="url(#${u}sh)">
        <path d="M14 204 L40 146 L100 160 L160 146 L186 204Z" fill="url(#${u}cp)"/>
        <path d="${SHOULDERS}" fill="url(#${u}su)"/>
        <path d="M104 166 l-14 18 h10 l-6 16 l18 -22 h-10 l6 -12z" fill="#ffd166"/>
        <ellipse cx="100" cy="104" rx="48" ry="54" fill="url(#${u}sk)"/>
        <path d="M52 92 Q52 44 100 44 Q150 44 150 84 Q128 56 96 70 Q118 58 128 52 Q90 50 70 74 Q60 82 52 92Z" fill="#18161d"/>
        <path d="M54 100 Q100 86 146 100 Q148 122 126 120 Q110 118 100 110 Q90 118 74 120 Q52 122 54 100Z" fill="#ff4f8b"/>
        <ellipse cx="78" cy="106" rx="10" ry="6" fill="#fff"/><ellipse cx="122" cy="106" rx="10" ry="6" fill="#fff"/>
        <path d="M84 138 Q100 148 116 136" stroke="#5a2a1a" stroke-width="4" fill="none" stroke-linecap="round"/>
        ${gloss(u, 78, 70)}
      </g>`,
    ufo: (u) => `
      <defs>${common(u)}${lg(u + "bg", ["#e7c99c", "#a87b4a"], 0.5, 1)}</defs>
      <g filter="url(#${u}sh)">
        <path d="${SHOULDERS}" fill="#2a2633"/>
        <path d="M40 30 L160 30 L170 170 L30 170Z" fill="url(#${u}bg)"/>
        <path d="M40 30 L160 30 L156 46 L44 46Z" fill="#c9a274"/>
        <path d="M30 170 L170 170" stroke="#8a6238" stroke-width="3"/>
        <path d="M100 46 L100 170" stroke="#b48b5a" stroke-width="2" opacity=".6"/>
        <ellipse cx="76" cy="92" rx="13" ry="15" fill="#0b0a0f"/><circle cx="80" cy="88" r="3" fill="#3dff8a"/>
        <ellipse cx="124" cy="92" rx="13" ry="15" fill="#0b0a0f"/><circle cx="128" cy="88" r="3" fill="#ff4f8b"/>
        <path d="M66 128 Q100 156 134 124" stroke="#ff4f8b" stroke-width="6" fill="none" stroke-linecap="round"/>
        <text x="100" y="66" text-anchor="middle" font-family="Arial Black,Impact,sans-serif" font-size="13" fill="#5a3a1a" letter-spacing="1">SOLDES</text>
        <line x1="152" y1="54" x2="182" y2="96" stroke="#efe9df" stroke-width="1.5"/>
        <g transform="rotate(18 182 104)"><rect x="166" y="96" width="34" height="20" rx="3" fill="#ff4f8b"/>
        <text x="183" y="110" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="700" font-size="9" fill="#18161d">−70%</text></g>
        ${gloss(u, 70, 58, 24, 7, -8)}
      </g>`,
  };

  window.TYPES = TYPES;
  window.avatar = function (type, uid, size) {
    const u = (uid || type) + "_";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 204" width="${size || 200}" height="${size || 200}">${DRAW[type](u)}</svg>`;
  };

  // QR factice mais crédible (motif pseudo-aléatoire déterministe + 3 repères)
  window.fakeQR = function (seed, size, fg, bg) {
    fg = fg || "#18161d"; bg = bg || "transparent";
    const n = 25; let s = seed * 9301 + 49297; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    let r = "";
    const finder = (x, y) => (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (finder(x, y)) continue;
      if (rnd() > 0.52) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`;
    }
    const f = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="${bg === "transparent" ? "#fff" : bg}"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 ${n + 2} ${n + 2}" width="${size}" height="${size}" shape-rendering="crispEdges"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="${bg === "transparent" ? "#fff" : bg}"/><g fill="${fg}">${r}${f(0, 0)}${f(n - 7, 0)}${f(0, n - 7)}</g></svg>`;
  };
})();
