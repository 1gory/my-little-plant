import { WEATHER_BLOCK_HOURS } from './config.js';

// Weather types with their effects on the plant (the engine reads these instead of hardcoding ids):
//   temp        - 'warm' | 'mild' | 'cold', checked against seed.idealTemp
//   tempC       - displayed temperature in °C (for the header; does not affect balance)
//   rain        - how much water is added per hour (0 - no precipitation)
//   decayMult   - water evaporation multiplier (heat dries out, clouds/rain preserve moisture)
//   growthMult  - growth speed multiplier from cloudiness/cold (ignoring idealTemp)
//   icon        - path to the pixel-art icon (relative to popup.html)
export const WEATHER = {
  hot:            { id: 'hot',            label: 'Heat',     temp: 'warm', tempC: 30, rain: 0, decayMult: 2.0,  growthMult: 1.0,  icon: 'icons/weather/hot.png' },
  sunny:          { id: 'sunny',          label: 'Clear',    temp: 'mild', tempC: 22, rain: 0, decayMult: 1.0,  growthMult: 1.0,  icon: 'icons/weather/sunny.png' },
  'partly-cloudy':{ id: 'partly-cloudy',  label: 'Partly Cloudy', temp: 'mild', tempC: 19, rain: 0, decayMult: 0.95, growthMult: 1.0,  icon: 'icons/weather/partly-cloudy.png' },
  cloudy:         { id: 'cloudy',         label: 'Cloudy',   temp: 'mild', tempC: 15, rain: 0, decayMult: 0.85, growthMult: 0.92, icon: 'icons/weather/cloudy.png' },
  'rain-light':   { id: 'rain-light',     label: 'Drizzle',  temp: 'mild', tempC: 13, rain: 2, decayMult: 0.8,  growthMult: 0.95, icon: 'icons/weather/rain-light.png' },
  rain:           { id: 'rain',           label: 'Rain',     temp: 'mild', tempC: 12, rain: 4, decayMult: 0.7,  growthMult: 0.9,  icon: 'icons/weather/rain.png' },
  storm:          { id: 'storm',          label: 'Storm',    temp: 'cold', tempC: 9,  rain: 6, decayMult: 0.6,  growthMult: 0.8,  icon: 'icons/weather/storm.png' },
  cold:           { id: 'cold',           label: 'Cold',     temp: 'cold', tempC: 2,  rain: 0, decayMult: 0.6,  growthMult: 0.7,  icon: 'icons/weather/cold.png' },
};

// Weather scale from warmest to coldest. Neighbors are similar, so a
// "one step per block" transition looks natural: heat never switches to
// cold instantly - clear, cloudy, rain and storm lie in between.
const SCALE = ['hot', 'sunny', 'partly-cloudy', 'cloudy', 'rain-light', 'rain', 'storm', 'cold'];

// Deterministic hash -> [0,1), so the weather stays the same
// every time the popup is opened (depends only on seed and block number).
function hash(seed, block) {
  let h = (seed ^ (block * 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 0xffffffff;
}

// Comfort "attractor" - around clear/partly cloudy. Weather gravitates
// toward it: heat, cold and storms happen briefly and rarely instead of lingering
// (otherwise a heat-loving plant dies from prolonged cold even with perfect care).
const TARGET = 1.5;

// Walk step along the scale with pull toward the center (mean-reversion). Inertia
// (35% "stay") makes the weather smooth - it holds for several blocks in a row.
function stepDelta(r, idx) {
  const toward = idx > TARGET ? -1 : idx < TARGET ? 1 : 0;
  if (r < 0.45) return toward;   // toward the comfort zone - most often
  if (r < 0.80) return 0;        // stay
  return -toward;                // toward an extreme - rarer and brief
}

// Weather index on the scale for a block: deterministic random walk
// from the start block. Start - in the mild zone (sunny..cloudy), no extremes.
function blockIndex(seed, block) {
  let idx = 1 + Math.floor(hash(seed, 0) * 3); // 1..3
  for (let b = 1; b <= block; b++) {
    idx += stepDelta(hash(seed, b), idx);
    if (idx < 0) idx = 0;
    if (idx > SCALE.length - 1) idx = SCALE.length - 1;
  }
  return idx;
}

// Weather for an absolute hour since the start of the game.
export function weatherAt(seed, hourIndex) {
  const block = Math.floor(hourIndex / WEATHER_BLOCK_HOURS);
  return WEATHER[SCALE[blockIndex(seed >>> 0, block)]];
}
