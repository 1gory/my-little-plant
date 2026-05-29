# My Little Plant — спецификация ассетов и промпты

Полный справочник по всем иконкам/спрайтам игры. Генерация — во внешней нейросети, **пачками-рядами** (sprite sheet: несколько иконок в одну строку). Нарезку на отдельные прозрачные PNG делаю я (ImageMagick) — тебе резать не нужно.

> **Контекст:** попап Chrome-расширения, ширина **340px**, портретная. Уютная медитативная игра-тамагочи: вырасти растение за ~30 дней. Стиль — тёплый cottagecore пиксель-арт, как Stardew Valley / Animal Crossing. Референс — `art.png` в корне.

---

## Как генерить (важно!)

1. **По одной пачке за раз.** Каждая пачка ниже — отдельный готовый промпт. Копируешь блок целиком → генеришь → присылаешь мне картинку-ряд → я нарезаю и подключаю.
2. **Настоящий пиксель-арт без сглаживания.** Жёсткие квадратные края, без размытия и плавных градиентов, тень — дизерингом. Размытые края = мягкие блоки при нарезке (главная причина рассинхрона с чёткими иконками погоды).
3. **Максимальное разрешение.** Чем больше пикселей в исходнике, тем чище я снапаю на нужную сетку. Ряд из 4 — 2048px+; ряд из 8 — 4096px, если тянет.
4. **Стиль между пачками.** Первую пачку сгенерь как нравится (эталон). Дальше к каждому следующему промпту **прикладывай уже готовую иконку как референс стиля** (Midjourney `--cref`/image prompt, Nano Banana / SDXL — image-to-image). Так контур/палитра/зерно не разъедутся.
5. **Прозрачный фон обязательно.** И **большие промежутки между иконками** в ряду — чтобы я чисто разрезал по гэпам.
6. **Не клади текст** в картинку.
7. Порядок иконок в ряду — строго слева направо как в промпте (я нарезаю по этому порядку).

Резать на отдельные файлы (а не один CSS-спрайт), потому что иконки показываются в разных размерах и семечки проходят отдельную нормализацию.

---

## Стандарт разрешения и консистентности

Измерено по концепту `art.png` (992×1586 = масштаб ~3×):

- **Арт-пиксель** (пиксельный блок) ≈ **1 CSS-px** на экране.
- **Консистентность = одинаковый размер арт-пикселя**, не размер файла. Объект на 30px → ~30 арт-пикселей; на 170px → ~170. Крупнее предмет = БОЛЬШЕ пикселей, а не крупнее каждый.
- **Экспорт ×4** для retina (иконки погоды = сетка 32 × 4 = 128px — текущий эталон).

Базовая палитра для всех промптов: cream `#f3f0e7`, greens `#5d9c4a / #4a7d3b`, terracotta-orange `#e08a3c`, water-blue `#4aa3d8`, coral-red `#e05a6a`. Bold 1px dark outline, soft dithered shading.

---

## Сводная таблица ассетов

| # | Ассет | Кол-во | Папка / имя | Показ (CSS px) | PNG (ряд по высоте) |
|---|---|---|---|---|---|
| 1 | Семечки | 4 | `icons/seeds/{radish,basil,tomato,sunflower}.png` | 30 / 50 / 52 / 92 | ~512/шт |
| 2 | Горшки | 4 | `icons/pots/{terracotta,ceramic,wood,plastic}.png` | 64 / ~130 (сцена) | ~256/шт |
| 3 | Погода | 8 | `icons/weather/*.png` | 34 / 22 | 128/шт ✅ есть |
| 4 | Бар-иконки | 3 | `icons/ui/{growth,droplet,heart}.png` | 18 | ~128/шт |
| 5 | Действия | 2 | `icons/ui/{scissors,gear}.png` | 32 / 22 | ~128/шт |
| 6 | Статус растения | 6 | `icons/status/*.png` | 20 | ~128/шт |

> Капля (`droplet.png`) используется дважды: иконка влажности у бара и кнопка Water. Горшок для кнопки Repot — переиспользуем выбранный горшок из `icons/pots/`.

---

## ПАЧКА 1 — Семечки (ряд из 4)

⚠️ Три требования:
1. **Настоящий пиксель-арт, БЕЗ сглаживания** — жёсткие квадратные края, без размытия и градиентов, тень — дизерингом.
2. **Одна общая пиксельная сетка на весь лист** — один и тот же размер «пикселя» у всех четырёх (это и есть консистентность).
3. **Рисуй семечки в их РЕАЛЬНЫХ относительных размерах**, НЕ одинаковыми: базилик самый маленький, подсолнух самый крупный (примерно ×3 от базилика), редис и томат между. Поскольку сетка общая, у крупного будет БОЛЬШЕ пикселей, а РАЗМЕР пикселя — такой же, как у мелкого. Я потом масштабирую весь лист одним коэффициентом.

Порядок слева направо: **radish, basil, tomato, sunflower**

```
True pixel art sprite sheet, one horizontal row of 4 plant SEEDS, highest possible resolution.
HARD aliased pixel edges, NO anti-aliasing, NO blur, NO smooth gradients — flat blocks of color,
shading by dithering only. ONE single consistent pixel size / grid shared across the WHOLE sheet,
every pixel a crisp square of the same size. Fully transparent background, big even gaps, no text,
bold dark outline, warm cozy cottagecore palette.
Draw the seeds at their TRUE RELATIVE SIZES (do NOT make them equal): the bigger a real seed,
the more pixels it gets — but the pixel SIZE stays identical for all.
IMPORTANT: only the seeds — no sprout, no leaves, no plant.
Left to right:
1) radish — small round plump seed, reddish-brown chestnut (#7b3f1e), tiny pale tip (medium size);
2) basil — the SMALLEST: a tiny slender dark seed, almost black (#1a0a00), elongated grain;
3) tomato — flat wide teardrop seed, pale sandy beige (#d4b896), fuzzy edge (medium size);
4) sunflower — the LARGEST (about 3x the basil): tall narrow ELONGATED seed, pointed top, rounded
   bottom (almond silhouette), cream (#e8e0cc) with dark charcoal lengthwise stripes.
```

### Перегенерация одного семечка (с референсом)

Если переснимаешь только одно (например, подсолнух) — генерь его **одного**, но **приложи текущий лист `docs/shots/seed-select.png` или 3 других семечка как style-reference**, чтобы контур/зерно совпали. Промпт для подсолнуха:

```
True pixel art of a SINGLE sunflower SEED, highest possible resolution, transparent background, no text.
HARD aliased pixel edges, NO anti-aliasing, NO blur, NO smooth gradients — flat color blocks,
shading by dithering only, every pixel a crisp square, bold dark outline.
Shape: tall and narrow, elongated almond / teardrop silhouette, pointed at the top, rounded bottom,
clearly longer than wide. Cream (#e8e0cc) shell with dark charcoal lengthwise stripes.
Match the art style of the reference image (same outline weight, palette and pixel size).
```

---

## ПАЧКА 2 — Горшки (ряд из 4)

🔑 Главные требования:
1. **Жёсткий пиксель-арт без сглаживания** + **одна общая пиксельная сетка** на весь лист (как сработало с семечками).
2. Для переиспользования на экране роста: **все 4 строго одинаковы по форме/габариту и позиции устья** — здесь размер НЕ относительный, а идентичный (меняется только материал).
3. Пустые (без земли и растения), прозрачный фон.

Порядок: **terracotta, ceramic, wood, plastic**

```
True pixel art sprite sheet: EXACTLY 4 empty flower POTS in one horizontal row. ONLY pots —
no seeds, no plants, no soil, no other objects, no text. Highest possible resolution.
HARD aliased pixel edges, NO anti-aliasing, NO blur, NO smooth gradients — flat color blocks,
shading by dithering only. Clean pixel grid, each pot drawn at about 112-128 pixels tall —
crisp square pixels, the same pixel size across all four, detailed enough (NOT coarse/blocky).
Fully transparent background, big even gaps, cozy cottagecore palette with SOFT MUTED colors —
gentle low-contrast tones, soft pastel shading, a softer (not harsh black) outline.
Front view slightly from above so the round rim opening (ellipse) is visible.
ALL FOUR pots IDENTICAL in size, shape and rim position — only the material/color differs.
Empty: nothing inside. Left to right:
1) terracotta clay pot, warm matte orange (#c96f4a), porous unglazed, darker rim (#b05c39);
2) glazed ceramic pot, glossy blue (#3f7cac), shiny smooth, painted rim, water-tight look;
3) wooden planter, natural brown wood (#9c7a52), vertical planks with metal hoops, rustic;
4) modern plastic pot, light matte grey (#cfd3d6), clean smooth cylinder, slight sheen.
```

---

## ПАЧКА 3 — Погода (ряд из 8)

Порядок (тёплое → холодное), сеткой 2×4 — **верхний ряд:** hot, sunny, partly-cloudy, cloudy; **нижний ряд:** rain-light, rain, storm, cold.

Текущие иконки тонковаты — здесь упор на **плотные, полные формы** и единый стиль с семечками/горшками. Сетка надёжнее строки: генератор не теряет счёт.

```
True pixel art sprite sheet: EXACTLY 8 weather icons arranged in a 2x4 GRID (2 rows, 4 columns).
ONLY weather icons, no text, no other objects. Highest possible resolution. HARD aliased pixel edges,
NO anti-aliasing, NO blur, NO smooth gradients — flat color blocks, shading by dithering only.
ONE single consistent pixel size / grid across the whole sheet, every pixel a crisp square.
All 8 icons the SAME size, big even gaps between them, fully transparent background.
Bold, PLUMP, FULL chunky shapes (not thin or spindly), soft muted low-contrast cottagecore colors,
a soft (not harsh black) outline.
Keep the SAME iconography as the current set (just plumper / softer / better):
TOP ROW, left to right:
1) HOT: a round orange-gold sun with rays AND small wavy heat-shimmer lines below it;
2) CLEAR: a bright cheerful round yellow sun with rays, nothing else;
3) PARTLY CLOUDY: a yellow sun half-hidden behind one plump white cloud;
4) CLOUDY: a single plump grey-white cloud, no sun and no rain;
BOTTOM ROW, left to right:
5) DRIZZLE: a plump cloud with a few light-blue raindrops underneath;
6) RAIN: a plump cloud with many blue raindrops (steady rain);
7) STORM: a fuller dark-grey cloud with a bold yellow lightning bolt and rain;
8) COLD: a blue-white snow cloud next to a small RED THERMOMETER, a few snowflakes (frost).
```

---

## ПАЧКА 4 — Бар-иконки (ряд из 3)

Маленькие глифы для подписей баров (рост / влажность / здоровье). Капля потом используется и на кнопке Water.

Порядок: **growth, droplet, heart**

```
True pixel art sprite sheet: EXACTLY 3 simple UI icons in one horizontal row. ONLY these icons,
no text, no other objects. Highest possible resolution. HARD aliased pixel edges, NO anti-aliasing,
NO blur, NO smooth gradients — flat color blocks, shading by dithering only. ONE consistent pixel
size / grid across the sheet, every pixel a crisp square. All 3 the SAME size, big even gaps,
fully transparent background. Bold PLUMP shapes, soft muted low-contrast colors, soft (not harsh
black) outline, clean and readable. Left to right:
1) a fresh green sprout with two little leaves (#5d9c4a);
2) a single plump water droplet, sky-blue (#4aa3d8) with a tiny white highlight;
3) a plump heart, warm coral-red (#e05a6a) with a small white shine.
```

---

## ПАЧКА 5 — Действия (ряд из 2)

Порядок: **scissors, gear**

```
True pixel art sprite sheet: EXACTLY 2 UI icons in one horizontal row. ONLY these icons,
no text, no other objects. Highest possible resolution. HARD aliased pixel edges, NO anti-aliasing,
NO blur, NO smooth gradients — flat color blocks, shading by dithering only. ONE consistent pixel
size / grid, both the SAME size, big even gaps, fully transparent background. Bold chunky shapes,
soft muted low-contrast colors, soft (not harsh black) outline. Left to right:
1) garden pruning shears (scissors), soft grey metal blades (#cfd3d6) with green handles (#5d9c4a), slightly open;
2) a settings gear / cogwheel, muted warm grey-brown (#6b6450), 6-8 teeth, a hole in the center.
```

### Кнопочные иконки покрупнее — ножницы + капля (отдельная пара)

Для кнопок Trim/Water нужны **крупнее/полнее**, чем мелкие бар-глифы. Капля переиспользуется и на шкале влажности.

```
True pixel art sprite sheet: EXACTLY 2 UI icons side by side — garden scissors and a water droplet.
ONLY these two icons, no text, no other objects. Highest possible resolution, transparent background,
big gap between them. HARD aliased pixel edges, NO anti-aliasing, NO blur, NO smooth gradients —
flat color blocks, shading by dithering only, crisp square pixels. ONE consistent pixel size, both
the SAME size, BOLD, BIG and PLUMP (fill the frame generously, not small or thin). Soft muted
low-contrast cottagecore colors, soft (not harsh black) outline. Match the art style and pixel size
of the reference image.
Left — SCISSORS: garden pruning shears, soft grey metal blades (#cfd3d6) with green handles (#5d9c4a), slightly open.
Right — WATER DROPLET: a single plump teardrop water drop, sky-blue (#4aa3d8) with a small white highlight.
```

---

## ПАЧКА 6 — Статус растения (ряд из 6)

Маскот — **один и тот же росток в маленьком горшочке**, меняется только выражение «лица»/символ. Важно: росток и горшок одинаковые во всех 6, разная только эмоция.

Порядок: **happy, thirsty, rootbound, messy, sick, cold**

```
True pixel art sprite sheet: EXACTLY 6 versions of the SAME cute sprout mascot in a tiny
terracotta pot, in one horizontal row. ONLY the mascot, no text, no other objects.
Highest possible resolution. HARD aliased pixel edges, NO anti-aliasing, NO blur, NO smooth
gradients — flat color blocks, shading by dithering only. ONE consistent pixel size / grid,
all 6 the SAME size, big even gaps, fully transparent background. Soft muted low-contrast colors,
soft (not harsh black) outline. Same sprout and same pot in every frame — only the facial
expression and a small symbol change. Left to right:
1) happy: smiling content face, upright leaves, a tiny sparkle (thriving);
2) thirsty: half-closed eyes, slightly drooping leaves, a small blue droplet;
3) rootbound: surprised face, a small crack in the pot, a root poking out the bottom;
4) messy: mildly annoyed face with a few brown dried leaves around it;
5) sick: unwell pale face, a small sweat drop, droopy;
6) cold: shivering face, light blue tint, a tiny snowflake.
```

> Если 6 много — минимум нужны happy / thirsty / rootbound / messy. sick и cold опциональны.

---

## Спрайт-лист стадий роста (отдельная задача, позже)

Растение на главном экране будет анимироваться, **накладываясь на выбранный горшок** (горшок — отдельный слой снизу). Поэтому растение рисуем **без горшка**, выровненным по линии почвы.

```
Cozy cottagecore pixel-art sprite sheet, transparent background, one horizontal row of 6
growth stages of a {plant} WITHOUT a pot (just the plant rising from the soil line):
sprout → small stem with 2 leaves → taller leafy stem → many leaves → bud → full flower.
Same baseline, equal size and consistent style across all frames, big even gaps, no text.
```

(делается по одному растению за раз: tomato, sunflower, radish, basil)

---

## Технические требования (общее)

- **Прозрачный фон** PNG, большие промежутки между иконками в ряду.
- Палитра — переменные из `styles.css` (`:root`).
- Имена итоговых файлов — строго как в таблице (на них завязан код); раскладываю по папкам я при нарезке.
- Семечки — высокое разрешение (≥512/шт), остальное про размеры не думаешь: нарежу и приведу к нужному.
