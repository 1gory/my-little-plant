# Release runbook

Use this every time you publish a new version to the Chrome Web Store.
Going top-to-bottom guarantees nothing is forgotten — the moving parts
(manifest, package.json, the `DEV` flag, ZIP, store listing, screenshots,
GitHub release, and the GitHub Pages landing page) drift apart easily, and
nothing breaks loudly when they do.

> **For the very first publication**, do `PUBLISH-CHECKLIST.md` first (it covers
> the one-time setup: developer account, listing creation, GitHub repo, Pages).
> Use *this* file for that release and every release after.

---

## The single most important gate

🔴 **`src/config.js` → `DEV` must be `false` in every shipped build.**

When `DEV = true`, the popup shows time-warp buttons (+6h / +1d / +5d), a
"freeze stats" toggle, and a reset button. These are dev tools — a player must
never see them, and a reviewer seeing them may reject the listing. This is the
one mistake that silently ruins a release, so it is step 1 and it is also in
the ZIP verification step.

---

## Why there are two version numbers

- **`manifest.json` → `"version"`** — the *real* extension version Chrome Web
  Store uses. **Must be bumped every release.**
- **`package.json` → `"version"`** — for the repo / dev tooling. Chrome never
  sees it, but we keep it in sync so `git log` and GitHub releases stay coherent.

**Rule: both numbers must be identical.** Step 2 enforces this.

## Semantic versioning we use

| Bump  | When                                                          | Example       |
|-------|---------------------------------------------------------------|---------------|
| PATCH | Bug fix, copy tweak, balance tweak, no new feature            | 1.0.0 → 1.0.1 |
| MINOR | New seed, new pot, new mechanic, new screen (compatible)      | 1.0.0 → 1.1.0 |
| MAJOR | Breaking change (storage key rename, removed feature)         | 1.0.0 → 2.0.0 |

> **Storage note:** the save lives under `STORAGE_KEY` (`mlp_state_v1` in
> `config.js`). If a release changes the saved state shape in an incompatible
> way, bump the key suffix (`_v2`) **and** make it a MAJOR release, or migrate
> the old state — otherwise existing players' plants break on update.

---

## Step-by-step release checklist

Walk every line. If a step does not apply, write "n/a" in the PR/commit notes
so future-you can see it was considered.

### 1. DEV flag OFF
- [ ] `src/config.js` → `DEV = false`
- [ ] `grep -n "DEV = " src/config.js` — confirm it reads `false`

### 2. Versions match
- [ ] Decide PATCH / MINOR / MAJOR (table above)
- [ ] Bump `manifest.json` → `"version"`
- [ ] Bump `package.json` → `"version"` to the **same** value
- [ ] `grep '"version"' manifest.json package.json` — confirm they agree

### 3. Pre-flight
- [ ] All feature work finished and committed to `main`
- [ ] No stray `console.log` in `src/*.js` (`grep -rn "console.log" src/`)
- [ ] Loaded unpacked (`chrome://extensions` → Reload) and played a full loop:
      pick seed → pick pot → water → trim → repot → reach an end screen. With
      `DEV = false`, confirm the dev bar is **gone**.
- [ ] Confirmed an existing save still loads after the update (don't break
      players mid-grow — see the storage note above).

### 4. Store listing copy (`STORE_LISTING.md`)
- [ ] Update the **Detailed description** if a seed, pot, mechanic, or screen
      was added, changed, or removed.
- [ ] Re-read the **Single purpose** line — does it still match?
- [ ] If you added a new permission, update **Permissions justification** (today
      it is `storage` only).
- [ ] If you added a new `src/*` module, the `zip -r src/ …` line already
      includes the whole `src/` folder — confirm nothing ships outside `src/`.

### 5. Screenshots (Chrome Web Store)
Required size: **1280×800**, JPG, up to 5 slots. This is a popup — center the
popup on a clean canvas, don't stretch it.

- [ ] **Shoot with `DEV = false`** — the dev bar must not appear in any shot.
- [ ] Re-audit **all** slots, not just the obviously affected one. A new seed
      shows up on the seed-select screen *and* possibly the growing/finale
      shots.
- [ ] For each `images/screenshots/screenshot_1280x800_N.jpg`, compare against
      the current UI and re-shoot if stale. Keep the same file name.
- [ ] Audit the small promo tile `images/screenshots/screenshot_440x280_1.jpg`
      if you use one.

### 6. README
- [ ] Update `README.md` for any feature this release touches (the "What it
      does" list, the dev notes).
- [ ] If localization status changed (e.g. you added a new language), update the
      **Localization** section in `README.md` and the language line in
      `STORE_LISTING.md`.

### 7. GitHub Pages (`docs/`)
The landing page is served from `docs/` on `main` (Settings → Pages → `main`
/ `/docs`). It lives outside the extension and goes stale silently.

- [ ] Open `docs/index.html`. Audit the **feature cards** and **tagline**
      against `STORE_LISTING.md` — every user-visible feature this release
      touched must be reflected.
- [ ] Update `docs/icon128.png` if the icon changed (`cp icons/icon128.png docs/`).
- [ ] If the privacy text changed, mirror it in `docs/privacy-policy.html` and
      `PRIVACY_POLICY.md`.
- [x] Store badge + live listing URL are in place in `docs/index.html` and
      `README.md` (listing ID `nmfppnlojcllbcokdpbcfaofhdbckoaa`). For future
      releases just confirm the link still resolves.
- [ ] After push, open `https://1gory.github.io/my-little-plant/` and confirm.

### 8. Commit + tag
- [ ] `git add` only files that should be tracked
- [ ] Commit: `Release X.Y.Z: <one-line summary>`
- [ ] Tag: `git tag vX.Y.Z`
- [ ] Push: `git push && git push --tags`

### 9. Build ZIP
Run from the repo root.

```bash
VERSION=$(grep '"version"' manifest.json | head -1 | sed 's/.*"\([0-9.]*\)".*/\1/')
zip -r my-little-plant-v${VERSION}.zip \
  manifest.json \
  popup.html \
  styles.css \
  src/ \
  icons/ \
  fonts/ \
  LICENSE \
  -x 'icons/icon.png' -x 'icons/*/_raw/*' -x '*.DS_Store'
```

Verify the contents — re-verify the DEV flag, and confirm the runtime assets are in:
```bash
unzip -l my-little-plant-v${VERSION}.zip
unzip -p my-little-plant-v${VERSION}.zip src/config.js | grep "DEV = "   # must say false
unzip -l my-little-plant-v${VERSION}.zip | grep -E 'fonts/|icons/weather/'  # must be present
unzip -l my-little-plant-v${VERSION}.zip | grep 'icons/icon.png'           # must be EMPTY
```

**Must be inside:** `fonts/Jersey25.ttf` (font loads via `@font-face`) and
`icons/weather/*.png` (loaded at runtime by `weather.js`). If either is missing,
the published extension silently falls back (system font / broken weather icons).

**Must NOT be inside:** `node_modules/`, `package.json`, `package-lock.json`,
`docs/`, `images/`, `tools/`, `icons/seeds/_raw/` (source sheets — heavy),
`icons/icon.png` (the 450px master), `.git/`, `.idea/`, `.claude/`,
any `*.md`, `*.mjs`, `.DS_Store`.

### 10. Chrome Web Store dashboard
- [ ] Upload the ZIP under "Package".
- [ ] Replace **every** stale screenshot (re-audit per step 5).
- [ ] Update the description text if `STORE_LISTING.md` changed.
- [ ] Fill the **What's new in this version** field (1–3 sentences).
- [ ] Confirm Privacy practices (same answers as last time unless permissions
      changed — today: no data collected, `storage` only).
- [ ] **Submit for review.**

### 11. GitHub Release
- [ ] Open `https://github.com/1gory/my-little-plant/releases/new`.
- [ ] Choose the existing tag `vX.Y.Z` (do not create a new one).
- [ ] Title: `vX.Y.Z — <one-line summary>`.
- [ ] Body: highlights / what changed / install instructions.
- [ ] Attach `my-little-plant-vX.Y.Z.zip` for sideloading.
- [ ] Tick **Set as the latest release**. Publish.

### 12. After publish
- [ ] Wait for the email that the CWS update is live (hours to a couple of days).
- [ ] Open the listing and verify version, screenshots, and description.
- [ ] Install the **live** version (not your dev build) and play a loop.
- [ ] `rm my-little-plant-v*.zip` so the local ZIP doesn't drift next release.

---

## Things to never forget again

A running log of mistakes. Read before each release, add to it after.

- **Pre-1.0** — `DEV = true` left in `config.js` would ship time-warp buttons to
  players. Lesson: step 1 + the ZIP grep in step 9 both gate on `DEV = false`.
- *(add new entries here as they happen)*
