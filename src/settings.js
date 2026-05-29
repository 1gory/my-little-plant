// Настройки приложения (не часть игрового состояния). Храним в localStorage
// синхронно — чтобы рендер мог читать без await, как dev-freeze.
const UNIT_KEY = 'mlp_temp_unit';

// 'C' | 'F' — единица отображения температуры. По умолчанию °C.
export function getTempUnit() {
  try {
    return localStorage.getItem(UNIT_KEY) === 'F' ? 'F' : 'C';
  } catch {
    return 'C';
  }
}

export function setTempUnit(unit) {
  try { localStorage.setItem(UNIT_KEY, unit === 'F' ? 'F' : 'C'); } catch {}
}

// Форматирует температуру (база — °C) в выбранную единицу: «22°C» / «72°F».
export function formatTemp(tempC, unit = getTempUnit()) {
  const v = unit === 'F' ? Math.round(tempC * 9 / 5 + 32) : Math.round(tempC);
  return `${v}°${unit}`;
}
