import { describe, it, expect } from 'vitest';
import { SEEDS, POTS, WATER_NEED, getSeed, getPot } from '../src/data.js';

describe('SEEDS integrity', () => {
  it('has at least one seed and unique ids', () => {
    expect(SEEDS.length).toBeGreaterThan(0);
    const ids = SEEDS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each seed has required, well-typed fields', () => {
    for (const s of SEEDS) {
      expect(typeof s.id).toBe('string');
      expect(typeof s.plantName).toBe('string');
      expect(s.growthDays).toBeGreaterThan(0);
      expect(s.growthSpeed).toBeGreaterThan(0);
      expect(['warm', 'mild', 'cold']).toContain(s.idealTemp);
      // waterNeed must key into the WATER_NEED table.
      expect(WATER_NEED).toHaveProperty(s.waterNeed);
      expect(s.overwaterSens).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(s.facts)).toBe(true);
      expect(s.facts.length).toBeGreaterThan(0);
    }
  });
});

describe('POTS integrity', () => {
  it('has unique ids and positive decayFactors', () => {
    expect(POTS.length).toBeGreaterThan(0);
    const ids = POTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of POTS) {
      expect(typeof p.id).toBe('string');
      expect(typeof p.name).toBe('string');
      expect(p.decayFactor).toBeGreaterThan(0);
    }
  });
});

describe('WATER_NEED table', () => {
  it('every tier has positive decay and a non-negative minWater', () => {
    for (const key of Object.keys(WATER_NEED)) {
      const n = WATER_NEED[key];
      expect(n.decay).toBeGreaterThan(0);
      expect(n.minWater).toBeGreaterThanOrEqual(0);
      expect(n.minWater).toBeLessThanOrEqual(100);
    }
  });
});

describe('getSeed() / getPot()', () => {
  it('returns the matching entry by id', () => {
    expect(getSeed('basil')).toBe(SEEDS.find((s) => s.id === 'basil'));
    expect(getPot('wood')).toBe(POTS.find((p) => p.id === 'wood'));
  });

  it('returns null for unknown ids', () => {
    expect(getSeed('does-not-exist')).toBeNull();
    expect(getPot('does-not-exist')).toBeNull();
    expect(getSeed(null)).toBeNull();
  });
});
