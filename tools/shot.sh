#!/usr/bin/env bash
#
# Скриншот попапа в файл (для просмотра в IDE — инлайн-картинки в терминале не видны).
#
# Использование:
#   bash tools/shot.sh [имя] [ширина] [высота]
# Примеры:
#   bash tools/shot.sh                 # -> docs/shots/popup.png  (340x720)
#   bash tools/shot.sh seed-select     # -> docs/shots/seed-select.png
#   bash tools/shot.sh growing 340 760
#
# Снимает текущий экран попапа (по умолчанию — экран выбора семечка, т.к.
# свежее состояние). Требует Google Chrome и python3.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAME="${1:-popup}"
W="${2:-340}"
H="${3:-720}"
PORT=8765
OUT="$ROOT/docs/shots/$NAME.png"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

mkdir -p "$ROOT/docs/shots"

# Поднимаем локальный сервер (ES-модули не грузятся с file://).
( cd "$ROOT" && python3 -m http.server "$PORT" >/tmp/mlp-shot-server.log 2>&1 ) &
SRV=$!
trap 'kill $SRV 2>/dev/null || true' EXIT
sleep 1

"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size="${W},${H}" \
  --virtual-time-budget=3000 \
  --screenshot="$OUT" "http://localhost:${PORT}/popup.html" 2>/dev/null

echo "Сохранено: docs/shots/$NAME.png (${W}x${H}, @2x)"
