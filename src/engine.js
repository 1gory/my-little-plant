import {
  HOUR,
  WATER_DECAY_PER_HOUR,
  POT_TIERS,
  HEALTH_RECOVER_PER_HOUR,
  WITHER_HOURS,
  DRIED_LEAVES_THRESHOLD,
  MAX_CATCHUP_HOURS,
  OVERWATER_THRESHOLD,
  ROT_PER_HOUR,
  ROT_DRY_RECOVER,
  ROT_HEALTH_PENALTY,
} from './config.js';
import { getSeed, getPot, WATER_NEED } from './data.js';
import { weatherAt } from './weather.js';

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

export function potCapacity(potTier) {
  return POT_TIERS[Math.min(potTier, POT_TIERS.length - 1)];
}

export function isRootBound(state) {
  if (state.potTier >= POT_TIERS.length - 1) return false;
  return state.growth >= potCapacity(state.potTier) - 0.01;
}

// One hour of simulation. Mutates a copy of state.
function stepHour(state, seed, pot, hourIndex, baseGrowthPerHour, frozen) {
  const w = weatherAt(state.weatherSeed, hourIndex);
  const need = WATER_NEED[seed.waterNeed];

  if (!frozen) {
    // --- Water ---
    const decay = WATER_DECAY_PER_HOUR * need.decay * pot.decayFactor * w.decayMult;
    state.water -= decay;
    state.water += w.rain;
    state.water = clamp(state.water);

    // --- Overwatering -> root rot ---
    // Waterlogged soil builds rot (scaled by how sensitive the seed is);
    // once the soil dries below the threshold the rot slowly recedes.
    const waterlogged = state.water > OVERWATER_THRESHOLD;
    if (waterlogged) {
      state.rot = clamp((state.rot || 0) + ROT_PER_HOUR * (seed.overwaterSens || 0), 0, 100);
    } else {
      state.rot = clamp((state.rot || 0) - ROT_DRY_RECOVER, 0, 100);
    }

    // --- Health ---
    const thirsty = state.water < need.minWater;
    const tooManyDried = state.driedLeaves > DRIED_LEAVES_THRESHOLD;
    let tempHealth = 0;
    if (seed.idealTemp !== 'mild' && w.temp !== 'mild' && w.temp !== seed.idealTemp) tempHealth = -0.4;
    let dh = 0;
    if (thirsty) dh -= 1.0;
    dh += tempHealth;
    if (tooManyDried) dh -= 0.2 * (state.driedLeaves - DRIED_LEAVES_THRESHOLD);
    if (state.rot > 0) dh -= ROT_HEALTH_PENALTY * (state.rot / 100); // rot drags health down
    if (!thirsty && tempHealth >= 0 && !tooManyDried && state.rot <= 0) dh += HEALTH_RECOVER_PER_HOUR;
    state.health = clamp(state.health + dh);

    // --- Dried leaves ---
    let driedRate = 1 / 30;
    if (thirsty) driedRate *= 3;
    if (tempHealth < 0) driedRate *= 2;
    driedRate *= 0.5 + state.growth / 100;
    state._driedProgress = (state._driedProgress || 0) + driedRate;
    while (state._driedProgress >= 1) { state._driedProgress -= 1; state.driedLeaves += 1; }

    // --- Withering to death ---
    if (state.health <= 0) state.lowHealthHours = (state.lowHealthHours || 0) + 1;
    else state.lowHealthHours = 0;
  }

  // --- Temperature (growth multiplier only, even when frozen) ---
  let tempFactor = 1.0;
  if (seed.idealTemp !== 'mild' && w.temp !== 'mild') {
    tempFactor = w.temp === seed.idealTemp ? 1.25 : 0.6;
  }
  // Clouds/cold/rain further reduce growth (weather property).
  tempFactor *= w.growthMult;

  // --- Growth (always active) ---
  // Normally growth stalls at the current pot's capacity until you repot.
  // When frozen (dev time-warp), ignore that cap so days can be skipped
  // straight to the finale without repotting.
  const cap = frozen ? 100 : potCapacity(state.potTier);
  let growthFactor = tempFactor * seed.growthSpeed;
  if (!frozen) {
    const comfort = need.minWater * 1.5;
    if (state.water < need.minWater) growthFactor = 0;
    else if (state.water < comfort) growthFactor *= (state.water - need.minWater) / (comfort - need.minWater);
    growthFactor *= clamp(state.health, 0, 100) / 100;
    if (state.driedLeaves > DRIED_LEAVES_THRESHOLD) growthFactor *= 0.6;
    if (state.rot > 0) growthFactor *= (1 - 0.5 * state.rot / 100); // rotten roots grow slower
  }

  if (state.growth < cap) {
    state.growth = Math.min(cap, state.growth + baseGrowthPerHour * growthFactor);
  }
  state.growth = clamp(state.growth, 0, 100);
  state.lastWeather = w.id;
}

// Runs the simulation from lastTick to now. Returns a new state.
export function advance(state, now = Date.now(), frozen = false) {
  if (state.phase !== 'growing') return state;
  const s = structuredClone(state);
  const seed = getSeed(s.seedId);
  const pot = getPot(s.potId);
  if (!seed || !pot) return s;

  // Base increment is calculated so that with idealTemp and normal watering
  // the plant reaches 100% in exactly seed.growthDays real days.
  const baseGrowthPerHour = 100 / ((seed.growthDays || 30) * 24);

  // Clock-skew guard: if the wall clock jumped BACKWARD (NTP correction, DST,
  // manual clock change, travel across time zones), `now` can be earlier than
  // the stored lastTick. Without this, elapsedHours would be <= 0 and we'd
  // return early WITHOUT re-anchoring, so the sim "freezes" on every popup open
  // until real time catches back up to the stale future lastTick. Re-anchor
  // lastTick to the present and bail out for this pass so the sim resumes from now.
  if (now < s.lastTick) {
    s.lastTick = now;
    return s;
  }

  const rawElapsedHours = Math.floor((now - s.lastTick) / HOUR);
  if (rawElapsedHours <= 0) return s;
  const elapsedHours = Math.min(rawElapsedHours, MAX_CATCHUP_HOURS);

  for (let i = 0; i < elapsedHours; i++) {
    const hourIndex = Math.floor((s.lastTick - s.startedAt) / HOUR);
    stepHour(s, seed, pot, hourIndex, baseGrowthPerHour, frozen);
    s.lastTick += HOUR;

    if (s.growth >= 100) {
      s.phase = 'finished';
      s.growth = 100;
      s.finishedAt = s.lastTick;
      break;
    }
    if (s.lowHealthHours >= WITHER_HOURS) {
      s.phase = 'withered';
      s.witheredAt = s.lastTick;
      break;
    }
  }

  // If the real gap exceeded the catch-up cap and the plant is still growing,
  // burn the un-simulated excess so it isn't re-simulated on the next open.
  // (MAX_CATCHUP_HOURS currently exceeds every plant's lifetime, so this can't
  // trigger mid-game today; it keeps the sim correct if the balance changes.)
  if (rawElapsedHours > MAX_CATCHUP_HOURS && s.phase === 'growing') {
    s.lastTick = now;
  }
  return s;
}

// Current game day (1-based) for UI.
export function gameDay(state, now = Date.now()) {
  if (!state.startedAt) return 0;
  const ref = state.finishedAt || state.witheredAt || now;
  return Math.floor((ref - state.startedAt) / (24 * HOUR)) + 1;
}
