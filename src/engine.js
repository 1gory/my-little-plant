import {
  HOUR,
  WATER_DECAY_PER_HOUR,
  POT_TIERS,
  HEALTH_RECOVER_PER_HOUR,
  WITHER_HOURS,
  DRIED_LEAVES_THRESHOLD,
  MAX_CATCHUP_HOURS,
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

// Один час симуляции. Мутирует копию state.
function stepHour(state, seed, pot, hourIndex, baseGrowthPerHour, frozen) {
  const w = weatherAt(state.weatherSeed, hourIndex);
  const need = WATER_NEED[seed.waterNeed];

  if (!frozen) {
    // --- Вода ---
    const decay = WATER_DECAY_PER_HOUR * need.decay * pot.decayFactor * w.decayMult;
    state.water -= decay;
    state.water += w.rain;
    state.water = clamp(state.water);

    // --- Здоровье ---
    const thirsty = state.water < need.minWater;
    const tooManyDried = state.driedLeaves > DRIED_LEAVES_THRESHOLD;
    let tempHealth = 0;
    if (seed.idealTemp !== 'mild' && w.temp !== 'mild' && w.temp !== seed.idealTemp) tempHealth = -0.4;
    let dh = 0;
    if (thirsty) dh -= 1.0;
    dh += tempHealth;
    if (tooManyDried) dh -= 0.2 * (state.driedLeaves - DRIED_LEAVES_THRESHOLD);
    if (!thirsty && tempHealth >= 0 && !tooManyDried) dh += HEALTH_RECOVER_PER_HOUR;
    state.health = clamp(state.health + dh);

    // --- Сухие листья ---
    let driedRate = 1 / 30;
    if (thirsty) driedRate *= 3;
    if (tempHealth < 0) driedRate *= 2;
    driedRate *= 0.5 + state.growth / 100;
    state._driedProgress = (state._driedProgress || 0) + driedRate;
    while (state._driedProgress >= 1) { state._driedProgress -= 1; state.driedLeaves += 1; }

    // --- Засыхание насмерть ---
    if (state.health <= 0) state.lowHealthHours = (state.lowHealthHours || 0) + 1;
    else state.lowHealthHours = 0;
  }

  // --- Температура (только множитель роста, даже при заморозке) ---
  let tempFactor = 1.0;
  if (seed.idealTemp !== 'mild' && w.temp !== 'mild') {
    tempFactor = w.temp === seed.idealTemp ? 1.25 : 0.6;
  }
  // Облачность/холод/дождь дополнительно сбавляют рост (свойство погоды).
  tempFactor *= w.growthMult;

  // --- Рост (работает всегда) ---
  const cap = potCapacity(state.potTier);
  let growthFactor = tempFactor * seed.growthSpeed;
  if (!frozen) {
    const comfort = need.minWater * 1.5;
    if (state.water < need.minWater) growthFactor = 0;
    else if (state.water < comfort) growthFactor *= (state.water - need.minWater) / (comfort - need.minWater);
    growthFactor *= clamp(state.health, 0, 100) / 100;
    if (state.driedLeaves > DRIED_LEAVES_THRESHOLD) growthFactor *= 0.6;
  }

  if (state.growth < cap) {
    state.growth = Math.min(cap, state.growth + baseGrowthPerHour * growthFactor);
  }
  state.growth = clamp(state.growth, 0, 100);
  state.lastWeather = w.id;
}

// Прогоняет симуляцию от lastTick до now. Возвращает новый state.
export function advance(state, now = Date.now(), frozen = false) {
  if (state.phase !== 'growing') return state;
  const s = structuredClone(state);
  const seed = getSeed(s.seedId);
  const pot = getPot(s.potId);
  if (!seed || !pot) return s;

  // Базовый прирост рассчитан так, чтобы при idealTemp и нормальном поливе
  // растение достигло 100% ровно за seed.growthDays реальных дней.
  const baseGrowthPerHour = 100 / ((seed.growthDays || 30) * 24);

  let elapsedHours = Math.floor((now - s.lastTick) / HOUR);
  if (elapsedHours <= 0) return s;
  elapsedHours = Math.min(elapsedHours, MAX_CATCHUP_HOURS);

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
  return s;
}

// Текущий день игры (1-based) для UI.
export function gameDay(state, now = Date.now()) {
  if (!state.startedAt) return 0;
  const ref = state.finishedAt || state.witheredAt || now;
  return Math.floor((ref - state.startedAt) / (24 * HOUR)) + 1;
}
