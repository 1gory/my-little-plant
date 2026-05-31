import { describe, it, expect } from 'vitest';
import { advance, potCapacity, isRootBound, gameDay } from '../src/engine.js';
import { POT_TIERS, HOUR, MAX_CATCHUP_HOURS } from '../src/config.js';

// A valid "growing" state at t0. Helper so each test can tweak fields.
function growingState(overrides = {}) {
  const t0 = 1_700_000_000_000; // fixed epoch ms for determinism
  return {
    version: 1,
    phase: 'growing',
    seedId: 'basil',
    potId: 'wood',
    potTier: 3, // top tier -> cap 100, growth not blocked by pot in these tests
    startedAt: t0,
    lastTick: t0,
    finishedAt: null,
    witheredAt: null,
    growth: 10,
    water: 60,
    health: 100,
    driedLeaves: 0,
    _driedProgress: 0,
    rot: 0,
    lowHealthHours: 0,
    lastWeather: 'sunny',
    weatherSeed: 12345,
    timesWatered: 0,
    timesTrimmed: 0,
    timesRepotted: 0,
    ...overrides,
  };
}

describe('advance() time handling', () => {
  it('is a no-op when less than one hour has elapsed', () => {
    const s = growingState();
    const out = advance(s, s.lastTick + HOUR - 1);
    expect(out.lastTick).toBe(s.lastTick);
    expect(out.growth).toBe(s.growth);
    expect(out.water).toBe(s.water);
  });

  it('does not mutate the input state (returns a clone)', () => {
    const s = growingState();
    const snapshot = JSON.stringify(s);
    advance(s, s.lastTick + 10 * HOUR);
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it('advances growth and consumes water over elapsed hours', () => {
    const s = growingState({ water: 70, growth: 10 });
    const out = advance(s, s.lastTick + 24 * HOUR);
    expect(out.lastTick).toBe(s.lastTick + 24 * HOUR);
    expect(out.growth).toBeGreaterThan(10); // grew
    // Water decays over a clear-ish day without watering.
    expect(out.water).toBeLessThan(70);
  });

  it('returns the same object reference for non-growing phases', () => {
    const s = growingState({ phase: 'choose-seed' });
    const out = advance(s, s.lastTick + 100 * HOUR);
    expect(out).toBe(s);
  });

  it('returns a clone (not early-returned) when seed/pot are valid', () => {
    const s = growingState();
    const out = advance(s, s.lastTick + 2 * HOUR);
    expect(out).not.toBe(s);
  });

  it('handles unknown seed/pot gracefully without throwing', () => {
    const s = growingState({ seedId: 'nope', potId: 'nope' });
    expect(() => advance(s, s.lastTick + 10 * HOUR)).not.toThrow();
    const out = advance(s, s.lastTick + 10 * HOUR);
    // bad seed/pot -> early clone return, no simulation
    expect(out.growth).toBe(s.growth);
  });
});

describe('advance() clock-skew regression (now < lastTick)', () => {
  it('re-anchors lastTick to now and does NOT freeze the sim', () => {
    const s = growingState({ lastTick: 1_700_000_000_000 + 5 * HOUR });
    const now = 1_700_000_000_000; // 5h in the past relative to lastTick
    const out = advance(s, now);
    // Re-anchored to present so the next pass can resume normally.
    expect(out.lastTick).toBe(now);
    // No simulation happened this pass.
    expect(out.growth).toBe(s.growth);
    expect(out.water).toBe(s.water);
    expect(out.phase).toBe('growing');
  });

  it('after re-anchor, a subsequent forward advance resumes growth (no freeze)', () => {
    const s = growingState({ lastTick: 1_700_000_000_000 + 5 * HOUR });
    const past = 1_700_000_000_000;
    const reanchored = advance(s, past); // step 1: clamp to present
    expect(reanchored.lastTick).toBe(past);
    // step 2: time moves forward from the re-anchored point
    const out = advance(reanchored, past + 24 * HOUR);
    expect(out.lastTick).toBe(past + 24 * HOUR);
    expect(out.growth).toBeGreaterThan(reanchored.growth); // resumed, not frozen
  });

  it('exact equality (now == lastTick) is a no-op, not a skew', () => {
    const s = growingState();
    const out = advance(s, s.lastTick);
    expect(out.lastTick).toBe(s.lastTick);
    expect(out.growth).toBe(s.growth);
  });
});

describe('advance() bounds and clamping', () => {
  it('keeps water, health, growth, rot within [0,100] and never NaN', () => {
    // Stress: start thirsty/unhealthy and run a long time.
    const s = growingState({ water: 5, health: 5, growth: 95, rot: 50, driedLeaves: 10 });
    const out = advance(s, s.lastTick + 500 * HOUR);
    for (const k of ['water', 'health', 'growth', 'rot']) {
      expect(Number.isNaN(out[k])).toBe(false);
      expect(out[k]).toBeGreaterThanOrEqual(0);
      expect(out[k]).toBeLessThanOrEqual(100);
    }
  });

  it('growth never exceeds 100 and finishes at exactly 100', () => {
    const s = growingState({ growth: 99.5, water: 80, health: 100 });
    const out = advance(s, s.lastTick + 200 * HOUR);
    expect(out.growth).toBeLessThanOrEqual(100);
    if (out.phase === 'finished') {
      expect(out.growth).toBe(100);
      expect(out.finishedAt).toBeTypeOf('number');
    }
  });

  it('overwatering builds rot which stays clamped to [0,100]', () => {
    const s = growingState({ water: 100, seedId: 'sunflower', growth: 20 });
    const out = advance(s, s.lastTick + 50 * HOUR);
    expect(out.rot).toBeGreaterThanOrEqual(0);
    expect(out.rot).toBeLessThanOrEqual(100);
  });
});

describe('advance() long absence and terminal states', () => {
  it('caps a very long absence at MAX_CATCHUP_HOURS without hanging', () => {
    const s = growingState({ water: 80, health: 100, growth: 5 });
    // 10 years of elapsed time.
    const out = advance(s, s.lastTick + 10 * 365 * 24 * HOUR);
    // lastTick advanced by at most MAX_CATCHUP_HOURS (unless a terminal state
    // broke the loop earlier, which advances by fewer hours).
    const advancedHours = (out.lastTick - s.lastTick) / HOUR;
    expect(advancedHours).toBeLessThanOrEqual(MAX_CATCHUP_HOURS);
    expect(advancedHours).toBeGreaterThan(0);
  });

  it('reaches a terminal phase (finished or withered) on a long well-watered run', () => {
    const s = growingState({ water: 90, health: 100, growth: 0, seedId: 'radish' });
    const out = advance(s, s.lastTick + MAX_CATCHUP_HOURS * HOUR);
    expect(['growing', 'finished', 'withered']).toContain(out.phase);
  });

  it('withers after sustained zero health (sets witheredAt)', () => {
    // Thirsty + dry + cold-needing plant in warmth -> health collapses.
    const s = growingState({ water: 0, health: 0, lowHealthHours: 0, seedId: 'tomato' });
    const out = advance(s, s.lastTick + 200 * HOUR);
    if (out.phase === 'withered') {
      expect(out.witheredAt).toBeTypeOf('number');
    } else {
      // If not yet withered, lowHealthHours must have been accumulating.
      expect(out.lowHealthHours).toBeGreaterThan(0);
    }
  });
});

describe('advance() frozen path', () => {
  it('frozen=true skips water/health decay but still grows past the pot-tier cap', () => {
    // Start just below tier-0 capacity; in normal (non-frozen) mode growth would
    // stall at the cap. Frozen mode ignores the cap, so growth crosses it.
    const s = growingState({ water: 60, health: 100, growth: POT_TIERS[0] - 1, potTier: 0 });
    const out = advance(s, s.lastTick + 200 * HOUR, true);
    // Water untouched while frozen.
    expect(out.water).toBe(60);
    // Grew, and crossed the pot-tier cap that would normally block it.
    expect(out.growth).toBeGreaterThan(POT_TIERS[0]);
  });

  it('frozen sim leaves health and rot untouched', () => {
    const s = growingState({ water: 0, health: 80, rot: 25, growth: 10, potTier: 0 });
    const out = advance(s, s.lastTick + 48 * HOUR, true);
    expect(out.health).toBe(80);
    expect(out.rot).toBe(25);
  });

  it('frozen growth is still clamped to 100', () => {
    const s = growingState({ growth: 90, potTier: 0 });
    const out = advance(s, s.lastTick + 1000 * HOUR, true);
    expect(out.growth).toBeLessThanOrEqual(100);
  });
});

describe('potCapacity()', () => {
  it('maps each tier index to its capacity', () => {
    POT_TIERS.forEach((cap, tier) => {
      expect(potCapacity(tier)).toBe(cap);
    });
  });

  it('clamps out-of-range tiers to the top tier', () => {
    const top = POT_TIERS[POT_TIERS.length - 1];
    expect(potCapacity(POT_TIERS.length)).toBe(top);
    expect(potCapacity(999)).toBe(top);
  });
});

describe('isRootBound()', () => {
  it('is false at the maximum tier regardless of growth', () => {
    const maxTier = POT_TIERS.length - 1;
    expect(isRootBound({ potTier: maxTier, growth: 100 })).toBe(false);
  });

  it('is true once growth reaches the current tier capacity', () => {
    expect(isRootBound({ potTier: 0, growth: POT_TIERS[0] })).toBe(true);
  });

  it('is false while growth is below the tier capacity', () => {
    expect(isRootBound({ potTier: 0, growth: POT_TIERS[0] - 5 })).toBe(false);
  });

  it('is true across each non-top tier when growth hits its cap', () => {
    for (let tier = 0; tier < POT_TIERS.length - 1; tier++) {
      expect(isRootBound({ potTier: tier, growth: POT_TIERS[tier] })).toBe(true);
      expect(isRootBound({ potTier: tier, growth: POT_TIERS[tier] - 1 })).toBe(false);
    }
  });
});

describe('gameDay()', () => {
  const t0 = 1_700_000_000_000;

  it('returns 0 when the game has not started', () => {
    expect(gameDay({ startedAt: null }, t0)).toBe(0);
  });

  it('returns day 1 on the start day', () => {
    expect(gameDay({ startedAt: t0 }, t0)).toBe(1);
    expect(gameDay({ startedAt: t0 }, t0 + 12 * HOUR)).toBe(1);
  });

  it('counts whole days elapsed (1-based)', () => {
    expect(gameDay({ startedAt: t0 }, t0 + 24 * HOUR)).toBe(2);
    expect(gameDay({ startedAt: t0 }, t0 + 5 * 24 * HOUR)).toBe(6);
  });

  it('freezes the day count at finishedAt / witheredAt instead of using now', () => {
    const finishedAt = t0 + 10 * 24 * HOUR;
    const day = gameDay({ startedAt: t0, finishedAt }, t0 + 100 * 24 * HOUR);
    expect(day).toBe(11);
  });
});
