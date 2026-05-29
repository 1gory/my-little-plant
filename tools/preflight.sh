#!/usr/bin/env bash
#
# Pre-publication check for common Chrome Web Store violations.
# Mechanical checks — does NOT replace the manual checklist in PUBLISH-CHECKLIST.md,
# but catches what most often leads to rejection.
#
#   bash tools/preflight.sh
#
# Codes: [PASS] ok · [WARN] inspect manually · [FAIL] publication blocker.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
fail=0; warn=0

pass(){ echo "  [PASS] $1"; }
warns(){ echo "  [WARN] $1"; warn=$((warn+1)); }
fails(){ echo "  [FAIL] $1"; fail=$((fail+1)); }

echo "Preflight: $ROOT"
echo

# 1. DEV mode is off (no time-skip buttons for players).
echo "1) Dev mode"
if grep -q "export const DEV = false" src/config.js; then pass "DEV = false";
else fails "src/config.js: DEV must be false before publishing"; fi

# 2. No debug console.* in the code.
echo "2) Debug output"
if grep -rn "console\.\(log\|debug\|warn\|error\)" src/ >/dev/null; then
  fails "found console.* in src/:"; grep -rn "console\.\(log\|debug\|warn\|error\)" src/ | sed 's/^/        /';
else pass "no console.*"; fi

# 3. Permissions — storage only (fewer permissions = fewer review questions).
echo "3) Permissions"
perms=$(grep -o '"permissions"[^]]*]' manifest.json)
if echo "$perms" | grep -q '"storage"' && ! echo "$perms" | grep -qE '"(tabs|<all_urls>|history|cookies|webRequest|scripting|activeTab|notifications|alarms)"'; then
  pass "only minimally required: $perms";
else warns "check permissions manually: $perms"; fi

# 4. No remote code (external scripts/fonts/CDN). xmlns SVG is not a network request, ignore it.
echo "4) Remote code / external resources"
remote=$(grep -rnoE "https?://[^\"' )]+" src/ popup.html styles.css 2>/dev/null | grep -v "www.w3.org/2000/svg")
if [ -n "$remote" ]; then
  warns "external URLs — make sure these don't load code/fonts:"; echo "$remote" | sed 's/^/        /';
else pass "no external URLs (fonts local, remote code = No)"; fi
if grep -q "fonts.googleapis\|fonts.gstatic\|cdn" popup.html styles.css 2>/dev/null; then
  fails "reference to external fonts/CDN — a violation (everything must be local)"; fi

# 5. manifest and package versions match.
echo "5) Versions"
mv=$(grep -m1 '"version"' manifest.json | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
pv=$(grep -m1 '"version"' package.json | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
if [ "$mv" = "$pv" ] && [ -n "$mv" ]; then pass "manifest and package: $mv";
else warns "versions differ: manifest=$mv package=$pv"; fi

# 6. Extension icons in place.
echo "6) Extension icons"
miss=""
for i in 16 48 128; do [ -f "icons/icon${i}.png" ] || miss="$miss icon${i}.png"; done
if [ -z "$miss" ]; then pass "icon16/48/128 in place"; else fails "missing icons:$miss"; fi

# 7. Dev artifacts must not end up in the build (should be in .gitignore / excluded from zip).
echo "7) Dev artifacts (must not ship to the store)"
artifacts=""
[ -d "icons/seeds/_raw" ] && artifacts="$artifacts icons/seeds/_raw/(sheet sources)"
[ -d "tools" ] && artifacts="$artifacts tools/"
[ -d "docs/shots" ] && artifacts="$artifacts docs/shots/"
ls *.mjs >/dev/null 2>&1 && artifacts="$artifacts *.mjs"
if [ -n "$artifacts" ]; then warns "when building the zip, EXCLUDE:$artifacts (see RELEASE.md)"; else pass "no stray dev folders"; fi

# 8. CSP in the manifest does not allow remote sources.
echo "8) Content Security Policy"
if grep -q "content_security_policy" manifest.json; then
  if grep -A3 "content_security_policy" manifest.json | grep -qE "https?://"; then
    fails "CSP allows external sources — remove them";
  else pass "CSP is 'self' only"; fi
else warns "CSP not set (usually ok for MV3, check)"; fi

echo
if [ "$fail" -gt 0 ]; then echo "RESULT: $fail blocker(s), $warn warning(s) — DO NOT publish while there are [FAIL].";
elif [ "$warn" -gt 0 ]; then echo "RESULT: no blockers, $warn warning(s) — inspect [WARN] manually.";
else echo "RESULT: all clean."; fi
