#!/usr/bin/env bash
#
# Screenshot the popup to a file (for viewing in the IDE — inline images aren't visible in the terminal).
#
# Usage:
#   bash tools/shot.sh [name] [width] [height]
# Examples:
#   bash tools/shot.sh                 # -> docs/shots/popup.png  (340x720)
#   bash tools/shot.sh seed-select     # -> docs/shots/seed-select.png
#   bash tools/shot.sh growing 340 760
#
# Captures the current popup screen (by default — the seed-selection screen, as
# the fresh state). Requires Google Chrome and python3.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAME="${1:-popup}"
W="${2:-340}"
H="${3:-720}"
PORT=8765
OUT="$ROOT/docs/shots/$NAME.png"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

mkdir -p "$ROOT/docs/shots"

# Start a local server (ES modules don't load from file://).
( cd "$ROOT" && python3 -m http.server "$PORT" >/tmp/mlp-shot-server.log 2>&1 ) &
SRV=$!
trap 'kill $SRV 2>/dev/null || true' EXIT
sleep 1

"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size="${W},${H}" \
  --virtual-time-budget=3000 \
  --screenshot="$OUT" "http://localhost:${PORT}/popup.html" 2>/dev/null

echo "Saved: docs/shots/$NAME.png (${W}x${H}, @2x)"
