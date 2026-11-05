#!/bin/sh
# Rend une page HTML en WebP : ./render.sh <nom> <largeur> <hauteur>
# Exemple : ./render.sh avatars 1360 820  →  ../avatars.webp (2×, qualité 88)
set -e
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
TMP="$(mktemp -d)"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
  --allow-file-access-from-files --virtual-time-budget=4000 \
  --window-size="$2,$3" --screenshot="$TMP/$1.png" "file://$PWD/$1.html" >/dev/null 2>&1
cwebp -quiet -q 88 "$TMP/$1.png" -o "../$1.webp"
rm -rf "$TMP"
echo "../$1.webp"
