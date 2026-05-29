# First publication checklist

One-time steps to get **My Little Plant** from "code on disk" to "live on the
Chrome Web Store". Do this once. Every release *after* the first uses
`RELEASE.md` instead.

> ✅ **Done — v1.0.0 is live:**
> <https://chromewebstore.google.com/detail/my-little-plant/nmfppnlojcllbcokdpbcfaofhdbckoaa>
> The remaining open item is the matching GitHub Release (step H).

Work top to bottom — later steps depend on earlier ones (e.g. the GitHub repo
must exist before GitHub Pages, the privacy policy must be hosted before you can
paste its URL into the store form).

---

## 0. Pre-submission audit (run first)

Mechanical compliance check — catches the most common Chrome Web Store
rejection reasons before you build:

```
bash tools/preflight.sh
```

It must end with **no `[FAIL]`** before you proceed. It verifies: `DEV = false`,
no `console.*`, minimal permissions (`storage` only), no remote code / external
fonts, manifest↔package version match, extension icons present, CSP is `self`,
and warns about dev-only folders that must not ship.

**Manual policy review (not auto-checkable):**

- [ ] **Single purpose** is clear and matches the listing (a plant-growing game).
- [ ] **Permission justified:** `storage` is the only permission and is used
      (save game state). No unused permissions.
- [ ] **No data collection** — nothing is sent anywhere; privacy policy says so.
- [ ] **No remote code** — all JS/fonts/images are bundled locally (`remote code: No`).
- [ ] **No trademarked / third-party IP in shipped assets** — art is original;
      references like "Stardew Valley" live only in dev docs (`DESIGN-PROMPT.md`),
      which must NOT be in the ZIP.
- [ ] **Screenshots reflect the real current app** (re-shoot after any UI change;
      use `bash tools/shot.sh`). No mockups passed off as the product.
- [ ] **Content is all-ages** — no objectionable content; metadata not misleading.
- [ ] **ZIP excludes dev files:** `tools/`, `docs/`, `icons/seeds/_raw/`, `*.md`,
      `*.mjs`, `package.json` dev bits (see `RELEASE.md` build step).

---

## A. Code readiness

- [ ] 🔴 **`src/config.js` → `DEV = false`** (no time-warp buttons for players)
- [ ] `manifest.json` and `package.json` both at `1.0.0`
- [ ] No `console.log` in `src/*.js` (`grep -rn "console.log" src/`)
- [ ] Icons present and square: `icons/icon16.png`, `icon48.png`, `icon128.png`
- [ ] Loaded unpacked in Chrome and played a full loop (seed → pot → care →
      finale), with the dev bar confirmed gone

## B. Assets

- [ ] At least **2 screenshots** at 1280×800 (the growing screen and the
      seed-select screen — see the screenshots table in `STORE_LISTING.md`),
      taken with `DEV = false`
- [ ] (Optional) 440×280 promo tile
- [ ] (Optional) 1400×560 marquee promo tile — only if you want featured
      placement; not required to publish

## C. GitHub repository

- [ ] Create the repo `1gory/my-little-plant` (the manifest, README, and docs
      already point at this URL — keep the name or update those references)
- [ ] `git init`, commit everything **except** what `.gitignore` should exclude
      (create a `.gitignore` for `.DS_Store`, `node_modules/`, `*.zip`,
      `.idea/`), push to `main`
- [ ] Repo description + topics (`chrome-extension`, `game`, `manifest-v3`)

## D. GitHub Pages (privacy policy needs a public URL)

- [ ] Settings → Pages → Source: **`main` / `/docs`**
- [ ] Wait for the deploy, then open `https://1gory.github.io/my-little-plant/`
      and `…/privacy-policy.html` — both must load
- [ ] This privacy-policy URL is what you paste into the store form (step F)

## E. Chrome Web Store developer account

- [ ] Have a Google account for publishing
- [ ] Register at the [Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
      and pay the **one-time $5 registration fee** (if not already done for the
      other extensions — the fee is per developer account, not per extension)
- [ ] Set up the developer's verified contact email (required before publishing)

## F. Build and create the listing

- [ ] Build the ZIP per `RELEASE.md` step 9, and run the
      `unzip -p … | grep "DEV = "` check — it **must** say `false`
- [ ] Dashboard → **New item** → upload the ZIP
- [ ] **Store listing tab:**
  - [ ] Name: `My Little Plant`
  - [ ] Short description (≤132 chars) and detailed description — copy from
        `STORE_LISTING.md`
  - [ ] Category: **Fun** (or Games, if available in your locale)
  - [ ] Language: primary language **English** (matches the UI and the copy)
  - [ ] Upload screenshots (≥1, ideally the recommended 5)
  - [ ] Icon 128×128 (pulled from the package, but confirm it shows)
- [ ] **Privacy tab:**
  - [ ] Single purpose: paste from `STORE_LISTING.md`
  - [ ] Permission justification for `storage`: paste from `STORE_LISTING.md`
  - [ ] Data usage: **does not collect user data** — tick the matching boxes
  - [ ] Privacy policy URL: the GitHub Pages URL from step D
  - [ ] Remote code: **No**
- [ ] **Distribution:** Public (or Unlisted if you want a soft launch first)

## G. Submit

- [ ] Re-read the listing preview once more
- [ ] **Submit for review** (first review can take longer than updates —
      anywhere from hours to a few days)

## H. After it goes live

- [x] Copy the live listing URL and add it to:
  - [x] `README.md` (badge + the "From the Chrome Web Store" line)
  - [x] `docs/index.html` (store badge in the header, URL filled in)
- [x] Create the matching **GitHub Release** (`RELEASE.md` step 11) with the ZIP
      attached — done: tag `v1.0.0`, latest, `my-little-plant-v1.0.0.zip` attached
- [ ] Install the live version and play one full loop to confirm

---

## Future enhancement (not a launch blocker)

**Localization.** The UI ships in **English**, matching the store copy — no
language mismatch to manage at launch. Adding more languages (Russian, etc.) is
an optional later release: extract the inline strings in `src/render.js` /
`src/settings.js` into a small i18n map keyed off the browser locale. Wider
reach, but purely additive — it does not gate v1.
