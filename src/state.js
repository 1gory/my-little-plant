import { STORAGE_KEY } from './config.js';

// Storage: chrome.storage.local in the extension, localStorage when opening
// popup.html directly (convenient for testing).
const hasChrome =
  typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

// Version of the saved state SHAPE. Bump by 1 on an INCOMPATIBLE shape
// change and add a step in migrate(). Adding a new field with a default
// value does NOT require a version bump — hydrate() will pick it up.
const CURRENT_VERSION = 1;

export async function loadState() {
  let stored = null;
  if (hasChrome) {
    const res = await chrome.storage.local.get(STORAGE_KEY);
    stored = res[STORAGE_KEY] || null;
  } else {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      stored = raw ? JSON.parse(raw) : null;
    } catch {
      stored = null;
    }
  }
  return hydrate(stored);
}

// Brings saved state (possibly old/incomplete) up to the current shape
// WITHOUT losing player progress. This is the main safeguard on updates.
function hydrate(stored) {
  if (!stored || typeof stored !== 'object') return defaultState();
  // 1) Merge in defaults: any NEW fields from future versions appear with their
  //    default value, while the player's real values override them.
  let s = { ...defaultState(), ...stored };
  // 2) Step-by-step migrations for incompatible shape changes.
  s = migrate(s);
  s.version = CURRENT_VERSION;
  return s;
}

// Version-based migration chain. Each step brings an old version's shape to the next.
// Future example (if you rename the field water -> moisture):
//   if (s.version < 2) { s.moisture = s.water ?? 50; delete s.water; s.version = 2; }
function migrate(s) {
  return s;
}

export async function saveState(state) {
  if (hasChrome) {
    await chrome.storage.local.set({ [STORAGE_KEY]: state });
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function defaultState() {
  return {
    version: CURRENT_VERSION,
    phase: 'choose-seed', // choose-seed | choose-pot | growing | finished | withered
    seedId: null,
    potId: null,
    potTier: 0,
    startedAt: null,
    lastTick: null,
    growth: 0,
    water: 50,   // start at the center of the moisture scale (marker centered), not in the overflow zone
    health: 100,
    driedLeaves: 0,
    _driedProgress: 0,
    lowHealthHours: 0,
    lastWeather: 'sunny',
    weatherSeed: Math.floor(Math.random() * 0xffffffff),
  };
}
