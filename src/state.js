import { STORAGE_KEY } from './config.js';

// Хранилище: chrome.storage.local в расширении, localStorage при открытии
// popup.html напрямую (удобно для теста).
const hasChrome =
  typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

// Версия ФОРМЫ сохранённого состояния. Поднимай на 1 при НЕсовместимом
// изменении формы и добавляй шаг в migrate(). Добавление нового поля со
// значением по умолчанию версию поднимать НЕ требует — его подхватит hydrate().
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

// Приводит сохранённое (возможно, старое/неполное) состояние к актуальному,
// НЕ теряя прогресс игрока. Это главный предохранитель при обновлениях.
function hydrate(stored) {
  if (!stored || typeof stored !== 'object') return defaultState();
  // 1) Подмешиваем дефолты: любые НОВЫЕ поля будущих версий появятся со значением
  //    по умолчанию, а реальные значения игрока перекрывают их.
  let s = { ...defaultState(), ...stored };
  // 2) Пошаговые миграции для несовместимых изменений формы.
  s = migrate(s);
  s.version = CURRENT_VERSION;
  return s;
}

// Цепочка миграций по версии. Каждый шаг приводит форму старой версии к следующей.
// Пример на будущее (если переименуешь поле water → moisture):
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
    water: 50,   // старт в центре шкалы влажности (маркер по центру), не в зоне перелива
    health: 100,
    driedLeaves: 0,
    _driedProgress: 0,
    lowHealthHours: 0,
    lastWeather: 'sunny',
    weatherSeed: Math.floor(Math.random() * 0xffffffff),
  };
}
