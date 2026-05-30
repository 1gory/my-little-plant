#!/usr/bin/env bash
#
# Build the Chrome Web Store ZIP — the single source of truth for packaging.
#
# WHITELIST approach: only the files the extension needs at runtime are added.
# Anything else — docs/, tools/, images/, _raw/ source sheets, *.md, and any
# dev harness like _preview.html — simply never gets in, because it's not on
# the list. New stray files in the repo root can't leak into a release.
#
# Usage:  bash tools/pack.sh
# Output: my-little-plant-v<version>.zip  in the repo root.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION=$(grep '"version"' manifest.json | head -1 | sed 's/.*"\([0-9.]*\)".*/\1/')
OUT="my-little-plant-v${VERSION}.zip"

# --- Gate: the one mistake that ruins a release ---
if grep -q 'export const DEV = true' src/config.js; then
  echo "[FAIL] src/config.js has DEV = true — set it to false before packing." >&2
  exit 1
fi

# --- Runtime whitelist: the ONLY things that ship ---
rm -f "$OUT"
zip -r "$OUT" \
  manifest.json \
  popup.html \
  styles.css \
  src/ \
  icons/ \
  fonts/ \
  LICENSE \
  -x 'icons/*/_raw/*' -x '*.DS_Store' >/dev/null
#   ^ icons/ ships whole, so exclude the _raw/ source sheets inside it.
#     (Reserved "_" names also break `Load unpacked`, and must never ship.)

# --- Verify nothing unwanted slipped in, and nothing required is missing ---
# Use grep -c (counts, no early exit) — `grep -q` would SIGPIPE `unzip` and,
# with pipefail, the pipeline would look failed and give false results.
LIST=$(unzip -l "$OUT")
problems=0
count() { printf '%s\n' "$LIST" | grep -c "$1" || true; }
check_absent()  { if [ "$(count "$1")" -ne 0 ]; then echo "[FAIL] $2 present in zip ($1)"; problems=1; fi; }
check_present() { if [ "$(count "$1")" -eq 0 ]; then echo "[FAIL] $2 missing from zip ($1)"; problems=1; fi; }

check_absent  '_raw/'              'source sheets'
check_absent  '/_'                 'reserved "_" path'
check_absent  '\.md'               'markdown docs'
check_present 'fonts/Jersey25.ttf' 'pixel font'
check_present 'icons/weather/'     'weather icons'
check_present 'icons/icon128.png'  'app icon'
if [ "$(unzip -p "$OUT" src/config.js | grep -c 'DEV = false' || true)" -eq 0 ]; then
  echo "[FAIL] DEV is not false inside the zip"; problems=1
fi

n=$(unzip -l "$OUT" | tail -1 | awk '{print $2}')
if [ "$problems" -ne 0 ]; then
  echo "Packed WITH PROBLEMS — inspect above and re-pack." >&2
  exit 1
fi
echo "[OK] $OUT — $n files, $(du -h "$OUT" | cut -f1). DEV=false, no _raw/reserved/docs, font+weather+icon present."

# --- Size watch: flag files >50KB so something super-heavy can't sneak in ---
# (Pixel-art PNGs rarely need >50KB; an overscaled asset or unsubset font shows here.)
FAT=$(printf '%s\n' "$LIST" | awk '$4 ~ /\.[a-z0-9]+$/ && ($1+0) > 51200 { printf "      %4dKB  %s\n", $1/1024, $4 }')
if [ -n "$FAT" ]; then
  echo "  [size] files >50KB — consider shrinking (pngquant / resize / font subset):"
  printf '%s\n' "$FAT"
fi
