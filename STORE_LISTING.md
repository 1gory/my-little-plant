# Chrome Web Store — Publishing Info

> The game UI is in English, matching this store copy. Additional languages
> (e.g. Russian) are a future option — see [Localization](#) notes in `README.md`.

## Extension name

My Little Plant

---

## Short description (132 chars max)

Grow your own plant in a browser popup: pick a seed, water it, watch the weather. A cozy tamagotchi played over a month.

*(118 characters — within the 132 limit.)*

---

## Detailed description

My Little Plant is a tiny, calm game that lives in your browser toolbar. Click
the icon and a real little plant is growing in the popup — pick a seed, choose a
pot, and look after it a little each day over about a month.

How it plays:

- Pick a seed — four seeds to choose from. You only see a hint in the
  description (sun-lover, cold-hardy, thirsty, patient) — the actual plant stays
  a secret until the finale. Some sprout in a couple of weeks, others take up to
  two months.
- Choose a pot — terracotta, ceramic, wood, or plastic. Each holds moisture
  differently, so your watering rhythm changes with the pot you pick.
- Care for it — water when the soil dries out, trim dried leaves, and repot
  into a deeper pot when the roots get cramped. Neglect it and it slowly wilts.
- Read the weather — sunny, hot, cold, and rainy spells roll through and
  change how fast the soil dries and how fast your plant grows. A small forecast
  shows what's coming so you can plan your watering.
- Reach the finale — grow it all the way and the game finally reveals which
  plant you raised, and how many days it took. Let it wither and you can always
  plant again.

The plant keeps growing in real time even when the popup is closed — open it
whenever you like and it catches up to the present moment. A full, well-tended
run takes roughly a month of gentle, low-pressure check-ins.

No reminders, no notifications, no nagging. Remembering to water is part of the
charm — and the challenge.

Privacy: No accounts, no tracking, no network requests. Your single plant's
state is saved locally in your browser. Nothing ever leaves your device.

---

## Single purpose description (for Chrome Web Store review)

This extension has a single purpose: it is a small plant-growing game played in
the browser action popup, where the user raises one virtual plant over real time
by watering, trimming, and repotting it.

---

## Privacy practices (Data use disclosures)

- Does not collect any user data
- Does not transmit any data to external servers
- Game state (chosen seed, pot, growth, water, health) is stored locally via
  `chrome.storage` on the user's device only
- No analytics, tracking, or third-party scripts
- No network requests of any kind

---

## Permissions justification

- `storage` — Required to save the player's single plant between sessions
  (chosen seed and pot, growth/water/health levels, timestamps used to advance
  the simulation while the popup is closed). All data stays on the device; none
  is transmitted or shared.
- No host permissions
- No content scripts
- No background service worker
- No external network reque sts of any kind

Remote code: No. Data collection: No.

---

## Screenshots guide

Chrome Web Store allows up to 5 screenshots. Required size: 1280×800 (or
640×400). This is a popup extension — the popup is narrow, so center each
popup screenshot on an 1280×800 canvas (a soft solid or gradient background
reads best) rather than stretching it.

### Recommended set (priority order)

| # | What to show | State |
|---|---|---|
| 1 | Growing screen — healthy plant mid-growth, with the growth/water/health bars, weather and forecast visible | The core experience; this is the most important slot |
| 2 | Seed selection — the four seed cards with their hint descriptions | Shows the "what will it be?" hook |
| 3 | Pot selection — the four pots | Shows customization / depth |
| 4 | A care moment — e.g. the "repot" prompt highlighted, or low water with the watering hint | Shows the gameplay loop |

> The finale (win screen revealing the plant name) is **deliberately NOT a
> screenshot** — the plant's identity is a reveal, and a store screenshot would
> spoil it. The shipped set is 4 shots (`images/screenshots/screenshot_1280x800_1..4.jpg`).

Tip: Screenshots 1 and 2 carry the listing. Make sure `DEV` is `false`
before shooting — the dev time-warp buttons must not appear in any screenshot
(building via `tools/pack.sh` keeps `DEV` honest, but screenshots are shot separately).

### Small promo tile (optional but recommended)

✅ Done: **`images/promo/tile_440x280.png`** — cozy pixel-art key art (pot + happy
sprout mascot on a sunny windowsill) with the "My Little Plant" title set in the
game's Jersey 25 font. Source art in `images/promo/_raw/`. Upload it under the
Promo tile field to help the listing stand out in category browsing.

---

## Packaging (ZIP for Chrome Web Store)

Run from the repo root. The ZIP must contain only the files the extension
needs at runtime — `tools/pack.sh` enforces that (whitelist + self-check), so
just run it instead of hand-writing a `zip` command:

```bash
bash tools/pack.sh
```

It refuses to run with `DEV = true`, adds only the whitelisted runtime files
(so docs, tools, `_raw/` sheets and stray files can't leak in), and verifies
the result. The table below documents *what* that whitelist is and why.

### What's included
| Path | Why |
|------|-----|
| `manifest.json` | Extension config |
| `popup.html` | Popup UI shell |
| `styles.css` | Styles + `@font-face` (loads the bundled font) |
| `src/` | All game logic (config, data, engine, render, state, weather, plant-svg, settings, main) |
| `icons/icon16/48/128.png` | Toolbar / store icons referenced by the manifest |
| `icons/weather/*.png` | Pixel-art weather icons — loaded at runtime by `weather.js` (`icon:` paths), so they must ship |
| `fonts/Jersey25.ttf` | The bundled Jersey 25 pixel font, loaded via `@font-face`. Without it the published extension falls back to a system font. OFL (SIL Open Font License) — free to redistribute; `fonts/Jersey25-LICENSE.txt` ships alongside. |
| `LICENSE` | Good practice; required by some store guidelines |

### What's excluded (must NOT be in ZIP)
| Path | Why |
|------|-----|
| `node_modules/` | Dev tooling only (if ever added) |
| `package.json` / `package-lock.json` | Dev tooling only |
| `docs/` | GitHub Pages landing — lives on the repo, not in the extension |
| `images/` | Store screenshots + `icon-master.png` — upload screenshots separately in the dashboard |
| `icons/*/_raw/` | Source sheets the icons are sliced from (incl. the 450px app-icon master in `icons/ui/_raw/`) — source art, not runtime assets (the `-x 'icons/*/_raw/*'` flag drops them) |
| `.git/`, `.idea/`, `.claude/` | Dev metadata |
| `*.md` (README, STORE_LISTING, RELEASE, PRIVACY_POLICY, DECISIONS, DESIGN-PROMPT…) | Docs, not part of the extension |
| `.DS_Store` | macOS metadata (the `-x` flag drops it) |

> ⚠️ Audit `icons/` before zipping. It must ship `icon16/48/128.png` and
> the `icons/weather/*.png` set (those are loaded at runtime). The `_raw/` source
> sheets (incl. the app-icon master in `icons/ui/_raw/`) must NOT ship — the
> `-x 'icons/*/_raw/*'` flag handles that. After zipping, confirm with `unzip -l`:
> weather PNGs present, no `_raw/` paths.

---

## Pre-publish checklist (quick)

The authoritative, step-by-step list is in `RELEASE.md`. This is the short
version of the things that have actually bitten this kind of project:

- [ ] `src/config.js` → `DEV = false` (no dev time-warp buttons in the build)
- [ ] Version in `manifest.json` matches `package.json`
- [ ] No `console.log` left in `src/*.js`
- [ ] All icon files present: `icon16.png`, `icon48.png`, `icon128.png`
- [ ] `fonts/` and `icons/weather/` are inside the ZIP (font + weather icons load
      at runtime); the `icons/*/_raw/` source sheets are not
- [ ] ZIP contains only the files listed above (and not `src/config.js`
      with `DEV = true`)
- [ ] Screenshots taken with `DEV = false`, uploaded (at least #1 and #2)
- [ ] Store description and privacy answers filled in the dashboard
