import { WEATHER_BLOCK_HOURS } from './config.js';

// Типы погоды со свойствами влияния на растение (движок читает их, а не хардкодит id):
//   temp        — 'warm' | 'mild' | 'cold', сверяется с seed.idealTemp
//   tempC       — отображаемая температура в °C (для шапки; на баланс не влияет)
//   rain        — сколько воды добавляется в час (0 — без осадков)
//   decayMult   — множитель испарения воды (жара сушит, тучи/дождь берегут влагу)
//   growthMult  — множитель скорости роста от облачности/холода (без учёта idealTemp)
//   icon        — путь к пиксель-арт иконке (относительно popup.html)
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

// Шкала погоды от самого тёплого к самому холодному. Соседи похожи, поэтому
// переход «на одну ступень за блок» выглядит естественно: жара не сменяется
// холодом мгновенно — между ними лежат ясно, облачно, дождь, гроза.
const SCALE = ['hot', 'sunny', 'partly-cloudy', 'cloudy', 'rain-light', 'rain', 'storm', 'cold'];

// Детерминированный хэш -> [0,1), чтобы погода была одинаковой
// при каждом открытии попапа (зависит только от seed и номера блока).
function hash(seed, block) {
  let h = (seed ^ (block * 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 0xffffffff;
}

// Комфортный «аттрактор» — около ясно/переменной облачности. Погода тяготеет
// к нему: жара, холод и гроза случаются кратко и редко, а не залипают надолго
// (иначе теплолюбивое растение гибнет от долгого холода даже при идеальном уходе).
const TARGET = 1.5;

// Шаг блуждания по шкале с тяготением к центру (mean-reversion). Инерция
// (35% «остаться») делает погоду плавной — она держится несколько блоков подряд.
function stepDelta(r, idx) {
  const toward = idx > TARGET ? -1 : idx < TARGET ? 1 : 0;
  if (r < 0.45) return toward;   // к комфортной зоне — чаще всего
  if (r < 0.80) return 0;        // остаться
  return -toward;                // в крайность — реже и ненадолго
}

// Индекс погоды на шкале для блока: детерминированное случайное блуждание
// от стартового блока. Старт — в мягкой зоне (sunny..cloudy), без крайностей.
function blockIndex(seed, block) {
  let idx = 1 + Math.floor(hash(seed, 0) * 3); // 1..3
  for (let b = 1; b <= block; b++) {
    idx += stepDelta(hash(seed, b), idx);
    if (idx < 0) idx = 0;
    if (idx > SCALE.length - 1) idx = SCALE.length - 1;
  }
  return idx;
}

// Погода для абсолютного часа с начала игры.
export function weatherAt(seed, hourIndex) {
  const block = Math.floor(hourIndex / WEATHER_BLOCK_HOURS);
  return WEATHER[SCALE[blockIndex(seed >>> 0, block)]];
}
