# My Little Plant 🌱

A cozy, low-pressure little game that lives in your browser toolbar. Click the
icon and a real plant is growing in the popup — pick a seed, choose a pot, and
look after it a little each day over about a month.

[<img src="https://raw.githubusercontent.com/1gory/my-little-plant/main/docs/chrome-webstore-badge.png" alt="Available in the Chrome Web Store" height="58">](https://chromewebstore.google.com/detail/my-little-plant/nmfppnlojcllbcokdpbcfaofhdbckoaa)

**[Website](https://1gory.github.io/my-little-plant/)** &nbsp;·&nbsp; **[Privacy Policy](https://1gory.github.io/my-little-plant/privacy-policy.html)**

## What it does

- **Pick a seed** — four seeds, shown only by a hint (sun-lover, cold-hardy,
  thirsty, patient). The actual plant is a secret until the finale.
- **Choose a pot** — terracotta, ceramic, wood, plastic — each holds moisture
  differently, so your watering rhythm changes with your choice.
- **Care for it** — water when the soil dries, trim dried leaves, repot when the
  roots get cramped.
- **Read the weather** — sunny / hot / cold / rain spells change growth and how
  fast the soil dries; a small forecast shows what's coming.
- **Reach the finale** — grow it all the way and the game reveals which plant
  you raised and how many days it took. Wilt, and you can plant again.

The plant grows in **real time** even with the popup closed — open it whenever
and it catches up to the present moment. A full, well-tended run takes roughly a
month. No notifications, no reminders: remembering to water is part of the game.

## Privacy & technical details

- No data collection, analytics, or external connections — **no network requests
  at all**
- Game state stored locally via `chrome.storage`
- Built with Manifest V3, vanilla JavaScript, no external libraries
- Only permission requested: `storage`

## Localization

The interface is in **English**. All in-game text lives inline in
`src/render.js` (and `src/settings.js`). Adding more languages (e.g. Russian)
would mean extracting those strings into a small i18n layer keyed off the
browser locale — a clean future enhancement, not a launch blocker.

## Installation

### From the Chrome Web Store
1. Open the [Chrome Web Store listing](https://chromewebstore.google.com/detail/my-little-plant/nmfppnlojcllbcokdpbcfaofhdbckoaa)
2. Click **Add to Chrome**
3. Pin the icon (puzzle icon → pin) and click it to start playing

### Manual installation
1. Go to the [Releases page](https://github.com/1gory/my-little-plant/releases)
   and download the latest `my-little-plant-vX.X.X.zip`
   *(or click **Code → Download ZIP** on the main page)*
2. Unpack the ZIP — you'll get a folder with the extension files
3. Open Chrome and go to `chrome://extensions/`
4. Turn on **Developer mode** (top-right)
5. Click **Load unpacked** and select the unpacked folder
6. Pin the icon (puzzle icon → pin) and click it to start playing

> Works in any Chromium-based browser: Chrome, Brave, Edge, Opera, Vivaldi.

## Development

The game is plain ES modules — no build step. Load the folder unpacked
(`chrome://extensions/` → **Load unpacked**) and reload after edits.

- `src/config.js` — balance knobs and the **`DEV` flag**. `DEV = true` shows
  time-warp buttons (+6h / +1d / +5d) and a "freeze stats" toggle for testing.
  **Set `DEV = false` before building a release** — players must not see these.
- `src/engine.js` — the simulation (growth, water decay, health, wither, repot).
- `src/data.js` — seeds and pots.
- `src/weather.js` — deterministic weather + forecast.
- `src/render.js` / `src/plant-svg.js` — UI and the plant artwork.

### Package for release
See `RELEASE.md` for the authoritative, step-by-step release runbook (it gates
on `DEV = false` and version sync). To build the store ZIP:

```bash
bash tools/pack.sh
```

`tools/pack.sh` is the single source of truth for packaging: it refuses to run
with `DEV = true`, ships a **whitelist** of only the runtime files (so docs,
tools, `_raw/` sheets and any stray files can't leak in), and verifies the
result. Output: `my-little-plant-v<version>.zip`.

## License

MIT © Igor Pershin — see [LICENSE](LICENSE).