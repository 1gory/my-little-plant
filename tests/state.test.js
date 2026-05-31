import { describe, it, expect } from 'vitest';
import { defaultState, hydrate, migrate } from '../src/state.js';

// These tests exercise only the PURE helpers. loadState/saveState (which touch
// chrome.storage / localStorage) are intentionally NOT imported or invoked.

const EXPECTED_KEYS = [
  'version', 'phase', 'seedId', 'potId', 'potTier', 'startedAt', 'lastTick',
  'finishedAt', 'witheredAt', 'growth', 'water', 'health', 'driedLeaves',
  '_driedProgress', 'rot', 'lowHealthHours', 'lastWeather', 'weatherSeed',
  'timesWatered', 'timesTrimmed', 'timesRepotted',
];

describe('defaultState()', () => {
  it('has exactly the expected shape', () => {
    const s = defaultState();
    expect(Object.keys(s).sort()).toEqual([...EXPECTED_KEYS].sort());
  });

  it('starts in choose-seed with sensible numeric defaults', () => {
    const s = defaultState();
    expect(s.phase).toBe('choose-seed');
    expect(s.growth).toBe(0);
    expect(s.water).toBe(50);
    expect(s.health).toBe(100);
    expect(s.rot).toBe(0);
    expect(s.finishedAt).toBeNull();
    expect(s.witheredAt).toBeNull();
    expect(s.version).toBe(1);
  });

  it('produces a fresh weatherSeed in unsigned 32-bit range', () => {
    const s = defaultState();
    expect(Number.isInteger(s.weatherSeed)).toBe(true);
    expect(s.weatherSeed).toBeGreaterThanOrEqual(0);
    expect(s.weatherSeed).toBeLessThanOrEqual(0xffffffff);
  });
});

describe('hydrate()', () => {
  it('returns a full default state for null/garbage input', () => {
    expect(Object.keys(hydrate(null)).sort()).toEqual([...EXPECTED_KEYS].sort());
    expect(Object.keys(hydrate('nope')).sort()).toEqual([...EXPECTED_KEYS].sort());
    expect(Object.keys(hydrate(42)).sort()).toEqual([...EXPECTED_KEYS].sort());
  });

  it('default-merges missing fields without losing real player values', () => {
    const partial = {
      phase: 'growing',
      seedId: 'basil',
      growth: 42,
      water: 73,
      // intentionally missing finishedAt, witheredAt, rot, timesWatered, etc.
    };
    const s = hydrate(partial);
    // Player values preserved.
    expect(s.phase).toBe('growing');
    expect(s.seedId).toBe('basil');
    expect(s.growth).toBe(42);
    expect(s.water).toBe(73);
    // Missing fields filled from defaults.
    expect(s.finishedAt).toBeNull();
    expect(s.witheredAt).toBeNull();
    expect(s.rot).toBe(0);
    expect(s.timesWatered).toBe(0);
    // Shape is complete.
    expect(Object.keys(s).sort()).toEqual([...EXPECTED_KEYS].sort());
  });

  it('always stamps the current version', () => {
    expect(hydrate({ version: 0, growth: 5 }).version).toBe(1);
  });

  it('is idempotent: hydrate(hydrate(x)) deep-equals hydrate(x)', () => {
    const partial = { phase: 'growing', seedId: 'tomato', growth: 12, weatherSeed: 999 };
    const once = hydrate(partial);
    const twice = hydrate(once);
    expect(twice).toEqual(once);
  });
});

describe('migrate()', () => {
  it('is an identity pass-through at the current version (no shape change)', () => {
    const s = defaultState();
    expect(migrate({ ...s })).toEqual(s);
  });

  it('is idempotent', () => {
    const s = hydrate({ growth: 7, phase: 'growing' });
    expect(migrate(migrate({ ...s }))).toEqual(migrate({ ...s }));
  });
});
