#!/usr/bin/env bash
#
# Предпубликационная проверка на типовые нарушения Chrome Web Store.
# Механические проверки — НЕ заменяет ручной чек-лист в PUBLISH-CHECKLIST.md,
# но ловит то, что чаще всего приводит к отклонению.
#
#   bash tools/preflight.sh
#
# Коды: [PASS] ок · [WARN] посмотреть глазами · [FAIL] блокер публикации.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
fail=0; warn=0

pass(){ echo "  [PASS] $1"; }
warns(){ echo "  [WARN] $1"; warn=$((warn+1)); }
fails(){ echo "  [FAIL] $1"; fail=$((fail+1)); }

echo "Preflight: $ROOT"
echo

# 1. DEV-режим выключен (нет кнопок перемотки времени у игроков).
echo "1) Dev-режим"
if grep -q "export const DEV = false" src/config.js; then pass "DEV = false";
else fails "src/config.js: DEV должен быть false перед публикацией"; fi

# 2. Нет отладочных console.* в коде.
echo "2) Отладочный вывод"
if grep -rn "console\.\(log\|debug\|warn\|error\)" src/ >/dev/null; then
  fails "найдены console.* в src/:"; grep -rn "console\.\(log\|debug\|warn\|error\)" src/ | sed 's/^/        /';
else pass "console.* нет"; fi

# 3. Permissions — только storage (минимум прав = меньше вопросов на ревью).
echo "3) Permissions"
perms=$(grep -o '"permissions"[^]]*]' manifest.json)
if echo "$perms" | grep -q '"storage"' && ! echo "$perms" | grep -qE '"(tabs|<all_urls>|history|cookies|webRequest|scripting|activeTab|notifications|alarms)"'; then
  pass "только минимально нужные: $perms";
else warns "проверь права вручную: $perms"; fi

# 4. Нет удалённого кода (внешние скрипты/шрифты/CDN). xmlns SVG — не сетевой запрос, игнорируем.
echo "4) Удалённый код / внешние ресурсы"
remote=$(grep -rnoE "https?://[^\"' )]+" src/ popup.html styles.css 2>/dev/null | grep -v "www.w3.org/2000/svg")
if [ -n "$remote" ]; then
  warns "внешние URL — убедись, что это не загрузка кода/шрифтов:"; echo "$remote" | sed 's/^/        /';
else pass "внешних URL нет (шрифты локальные, remote code = No)"; fi
if grep -q "fonts.googleapis\|fonts.gstatic\|cdn" popup.html styles.css 2>/dev/null; then
  fails "ссылка на внешние шрифты/CDN — нарушение (нужно всё локально)"; fi

# 5. Версии manifest и package совпадают.
echo "5) Версии"
mv=$(grep -m1 '"version"' manifest.json | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
pv=$(grep -m1 '"version"' package.json | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
if [ "$mv" = "$pv" ] && [ -n "$mv" ]; then pass "manifest и package: $mv";
else warns "версии расходятся: manifest=$mv package=$pv"; fi

# 6. Иконки расширения на месте.
echo "6) Иконки расширения"
miss=""
for i in 16 48 128; do [ -f "icons/icon${i}.png" ] || miss="$miss icon${i}.png"; done
if [ -z "$miss" ]; then pass "icon16/48/128 на месте"; else fails "нет иконок:$miss"; fi

# 7. Дев-артефакты не должны попасть в сборку (должны быть в .gitignore / исключены из zip).
echo "7) Дев-артефакты (не должны уехать в стор)"
artifacts=""
[ -d "icons/seeds/_raw" ] && artifacts="$artifacts icons/seeds/_raw/(исходники листов)"
[ -d "tools" ] && artifacts="$artifacts tools/"
[ -d "docs/shots" ] && artifacts="$artifacts docs/shots/"
ls *.mjs >/dev/null 2>&1 && artifacts="$artifacts *.mjs"
if [ -n "$artifacts" ]; then warns "при сборке zip ИСКЛЮЧИ:$artifacts (см. RELEASE.md)"; else pass "лишних дев-папок нет"; fi

# 8. CSP в манифесте не разрешает удалённые источники.
echo "8) Content Security Policy"
if grep -q "content_security_policy" manifest.json; then
  if grep -A3 "content_security_policy" manifest.json | grep -qE "https?://"; then
    fails "CSP разрешает внешние источники — убери";
  else pass "CSP только 'self'"; fi
else warns "CSP не задан (для MV3 обычно ок, проверь)"; fi

echo
if [ "$fail" -gt 0 ]; then echo "ИТОГ: $fail блокер(ов), $warn предупреждение(й) — публиковать НЕЛЬЗЯ, пока есть [FAIL].";
elif [ "$warn" -gt 0 ]; then echo "ИТОГ: блокеров нет, $warn предупреждение(й) — посмотри [WARN] глазами.";
else echo "ИТОГ: всё чисто."; fi
