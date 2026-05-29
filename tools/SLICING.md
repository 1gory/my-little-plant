# Нарезка спрайт-листов на отдельные PNG

Как правильно резать лист иконок (от нейросети) на отдельные прозрачные PNG.
Главный вывод из практики: **НЕ резать фиксированными ячейками** (делением холста
на равные колонки/ряды) — иконки в листе не центрированы, контент вылезает за
границы ячейки → части срезаются и иконки «кривые». Резать по **реальным
bounding-box объектов** через connected-components.

## Алгоритм

1. **Найти bounding-box каждой иконки** по непрозрачным «островам»:
   ```bash
   magick SHEET.png -alpha extract -threshold 15% [-morphology Close Disk:R] -type bilevel \
     -define connected-components:verbose=true \
     -define connected-components:area-threshold=8000 \
     -define connected-components:mean-color=true \
     -connected-components 8 null:
   ```
   Выводит строки `id: WxH+X+Y centroid area`. Игнорировать объект `0` (весь холст / фон).

2. **Close Disk:R — только если у иконки есть ОТДЕЛЬНЫЕ части** (капли под облаком,
   лучи/зной у солнца, градусник рядом). Close склеивает их в один объект.
   - R подбирать: достаточно большой, чтобы соединить части ВНУТРИ иконки,
     но меньше, чем зазор МЕЖДУ иконками. Иначе соседние сольются
     (грабли: два облака в верхнем ряду погоды слиплись при Disk:20).
   - Если частей нет (росток, капля, сердце, ножницы) — Close не нужен.
   - **Всегда сверять число объектов с ожидаемым.** Не сошлось → менять R.

3. **Сопоставить объекты порядку**: сортировать по рядам (бакеты по Y центроида),
   внутри ряда — по X. Маппить на список имён слева-направо / сверху-вниз.

4. **Вырезать из ОРИГИНАЛА** (не из маски) по bbox с небольшим запасом (+6px),
   затем tight-trim вплотную:
   ```bash
   magick SHEET.png -crop ${W+12}x${H+12}+${X-6}+${Y-6} +repage \
     -fuzz 8% -trim +repage  ... 
   ```

5. **Привести к единому виду** (одинаковый размер, без полей): длинная сторона
   заполняет канвас, центрируем на прозрачном квадрате:
   ```bash
   -resize NxN -background none -gravity center -extent NxN  out.png
   ```
   `-resize NxN` (fit) → длинная сторона = N (полей по ней нет). N: погода/UI 96–128.

6. **Проверить монтажом** перед тем как считать готовым:
   ```bash
   magick montage a.png b.png ... -tile Kx1 -geometry 128x128+6+6 -background "#ddd" /tmp/check.png
   ```

## Готовый шаблон (объект без отдельных частей)

```bash
fill() { magick "$1" -fuzz 8% -trim +repage -resize 96x96 -background none -gravity center -extent 96x96 "$2"; }
magick SHEET.png -crop ${W}x${H}+${X}+${Y} +repage /tmp/c.png; fill /tmp/c.png icons/.../name.png
```

## Показ в CSS

- Пиксель-арт иконки — `image-rendering: pixelated`.
- Фиксированный размер показа задаётся в CSS (`.w-icon`, `.stat-ico-img`, `.act-ico-img`,
  `.pot-img`, `.seed-img`), PNG крупнее → чёткость на retina.

## Что уже так нарезано

- `icons/weather/*` — 8 иконок (Close Disk:20 для капель/зноя; верхние облака
  пришлось добивать вручную из-за слипания).
- `icons/pots/*`, `icons/seeds/*` — без Close.
- `icons/ui/{growth,droplet,heart,scissors}.png` — без Close.

Исходные листы всегда сохранять в соседний `_raw/` (например `icons/ui/_raw/`).
