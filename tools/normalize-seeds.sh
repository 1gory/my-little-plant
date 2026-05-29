#!/usr/bin/env bash
#
# Нормализатор семечек: единый коэффициент «исходник → показ» (supersample).
#
# Семечки показываются ГЛАДКО (без image-rendering: pixelated) — у них мягкая
# заливка/тень. Чтобы зерно сжатия было одинаковым у всех, ужимаем каждое до
# (размер показа × SS) по длинной стороне: браузер сжимает все одинаково.
#
# Использование:
#   1. Исходники в icons/seeds/_raw/ (radish.png, basil.png, tomato.png, sunflower.png).
#   2. bash tools/normalize-seeds.sh
#   3. Результат в icons/seeds/.
#
# Требует ImageMagick.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$ROOT/icons/seeds/_raw"
OUT="$ROOT/icons/seeds"

# Супердискретизация: исходник = (размер показа) × SS, одинаково для всех.
SS=2

# Имя : размер показа в CSS px (длинная сторона) = iconSize в src/data.js.
SEEDS=( "radish:50" "basil:30" "tomato:52" "sunflower:92" )

[ -d "$RAW" ] || { echo "Нет папки $RAW"; exit 1; }

echo "Нормализация (supersample ×$SS):"
for entry in "${SEEDS[@]}"; do
  name="${entry%%:*}"; disp="${entry##*:}"
  src="$RAW/$name.png"
  [ -f "$src" ] || { echo "  SKIP $name — нет $src"; continue; }

  target=$(( disp * SS ))
  sdims=$(magick "$src" -trim +repage -format "%w %h" info:)
  sw=${sdims% *}; sh=${sdims#* }
  smax=$(( sw > sh ? sw : sh ))
  [ "$smax" -lt "$target" ] && echo "  ⚠ $name — исходник ${sw}x${sh} меньше ${target}px: зерно грубее. Перегенерь крупнее."

  magick "$src" -trim +repage -resize "${target}x${target}>" \
    -bordercolor none -border 2 "$OUT/$name.png"
  odims=$(magick "$OUT/$name.png" -format "%w %h" info:)
  echo "  $name: показ ${disp}px → исходник ${odims// /x}"
done
echo "Готово. У .seed-img в CSS НЕ должно быть image-rendering: pixelated (гладкий показ)."
