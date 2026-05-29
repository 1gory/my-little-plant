// App settings (not part of the game state). Stored in localStorage
// synchronously — so render can read without await, like dev-freeze.
const UNIT_KEY = 'mlp_temp_unit';

// 'C' | 'F' — temperature display unit. Defaults to °C.
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

// Formats temperature (base — °C) into the chosen unit: "22°C" / "72°F".
export function formatTemp(tempC, unit = getTempUnit()) {
  const v = unit === 'F' ? Math.round(tempC * 9 / 5 + 32) : Math.round(tempC);
  return `${v}°${unit}`;
}
