import { describe, it, expect } from 'vitest';
import { weatherAt, WEATHER } from '../src/weather.js';
import { WEATHER_BLOCK_HOURS } from '../src/config.js';

const VALID_IDS = new Set(Object.keys(WEATHER));

describe('weatherAt() determinism', () => {
  it('returns the identical object for the same seed + hour', () => {
    const a = weatherAt(42, 100);
    const b = weatherAt(42, 100);
    expect(a).toBe(b); // same WEATHER entry reference
    expect(a.id).toBe(b.id);
  });

  it('is stable across a range of hours for a fixed seed', () => {
    for (let h = 0; h < 1000; h += 7) {
      expect(weatherAt(777, h)).toBe(weatherAt(777, h));
    }
  });

  it('is constant within a single weather block', () => {
    const seed = 9001;
    const blockStart = 3 * WEATHER_BLOCK_HOURS;
    const first = weatherAt(seed, blockStart).id;
    for (let h = blockStart; h < blockStart + WEATHER_BLOCK_HOURS; h++) {
      expect(weatherAt(seed, h).id).toBe(first);
    }
  });
});

describe('weatherAt() output validity', () => {
  it('always returns a known weather type with required fields', () => {
    for (let seed = 0; seed < 50; seed++) {
      for (let h = 0; h < 2000; h += 13) {
        const w = weatherAt(seed * 1234567, h);
        expect(w).toBeDefined();
        expect(VALID_IDS.has(w.id)).toBe(true);
        expect(w).toHaveProperty('temp');
        expect(w).toHaveProperty('rain');
        expect(w).toHaveProperty('decayMult');
        expect(w).toHaveProperty('growthMult');
        expect(['warm', 'mild', 'cold']).toContain(w.temp);
        expect(w.rain).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('starts in the mild zone (no extremes) at hour 0', () => {
    // blockIndex seeds idx in 1..3 -> sunny..rain-light, never hot/storm/cold.
    const milder = new Set(['sunny', 'partly-cloudy', 'cloudy']);
    for (let seed = 0; seed < 30; seed++) {
      const w = weatherAt(seed * 31, 0);
      expect(milder.has(w.id)).toBe(true);
    }
  });

  it('normalizes negative/large seeds via unsigned coercion (no throw, valid output)', () => {
    expect(VALID_IDS.has(weatherAt(-1, 50).id)).toBe(true);
    expect(VALID_IDS.has(weatherAt(0xffffffff + 5, 50).id)).toBe(true);
  });
});
