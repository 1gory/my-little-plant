#!/usr/bin/env bash
#
# Seed normalizer: a single "source -> display" ratio (supersample).
#
# Seeds are rendered SMOOTHLY (no image-rendering: pixelated) — they have a soft
# fill/shadow. So the compression grain is the same for all, we shrink each one to
# (display size × SS) along the long side: the browser downscales them all the same way.
#
# Usage:
#   1. Sources in icons/seeds/_raw/ (radish.png, basil.png, tomato.png, sunflower.png).
#   2. bash tools/normalize-seeds.sh
#   3. Result in icons/seeds/.
#
# Requires ImageMagick.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$ROOT/icons/seeds/_raw"
OUT="$ROOT/icons/seeds"

# Supersampling: source = (display size) × SS, the same for all.
SS=2

# Name : display size in CSS px (long side) = iconSize in src/data.js.
SEEDS=( "radish:50" "basil:30" "tomato:52" "sunflower:92" )

[ -d "$RAW" ] || { echo "No folder $RAW"; exit 1; }

echo "Normalizing (supersample ×$SS):"
for entry in "${SEEDS[@]}"; do
  name="${entry%%:*}"; disp="${entry##*:}"
  src="$RAW/$name.png"
  [ -f "$src" ] || { echo "  SKIP $name — no $src"; continue; }

  target=$(( disp * SS ))
  sdims=$(magick "$src" -trim +repage -format "%w %h" info:)
  sw=${sdims% *}; sh=${sdims#* }
  smax=$(( sw > sh ? sw : sh ))
  [ "$smax" -lt "$target" ] && echo "  ⚠ $name — source ${sw}x${sh} smaller than ${target}px: coarser grain. Re-export larger."

  magick "$src" -trim +repage -resize "${target}x${target}>" \
    -bordercolor none -border 2 "$OUT/$name.png"
  odims=$(magick "$OUT/$name.png" -format "%w %h" info:)
  echo "  $name: display ${disp}px → source ${odims// /x}"
done
echo "Done. .seed-img in CSS must NOT have image-rendering: pixelated (smooth rendering)."
