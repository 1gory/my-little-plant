import { SEEDS, POTS, getSeed, getPot, WATER_NEED } from './data.js';
import { WEATHER, weatherAt } from './weather.js';
import { plantSVG } from './plant-svg.js';
import { isRootBound, gameDay } from './engine.js';
import { HOUR, DAY, DEV, POT_TIERS } from './config.js';
import { getTempUnit, formatTemp } from './settings.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Weather icon: pixel-art PNG.
function weatherIcon(w, cls) {
  return `<img class="w-icon ${cls}" src="${w.icon}" alt="${esc(w.label)}">`;
}

// Stat-bar icon (growth/moisture/health) — pixel-art PNG from icons/ui/.
function statImg(name) {
  return `<img class="stat-ico-img" src="icons/ui/${name}.png" alt="">`;
}

export function render(state, now = Date.now(), opts = {}) {
  if (opts.view === 'settings') return settingsScreen();
  switch (state.phase) {
    case 'choose-seed':
      return chooseSeed();
    case 'choose-pot':
      return choosePot(state);
    case 'finished':
      return endScreen(state, true);
    case 'withered':
      return endScreen(state, false);
    default:
      return growing(state, now);
  }
}

function chooseSeed() {
  const cards = SEEDS.map(
    (s) => `
    <button class="card seed-card" data-action="pick-seed" data-id="${s.id}">
      <div class="seed-img-wrap">
        <img class="seed-img" src="${s.seed.icon}" alt="seed" style="width:${s.seed.iconSize}px;height:${s.seed.iconSize}px;object-fit:contain;object-position:center bottom">
      </div>
      <div class="seed-days"><span class="approx">~</span>${s.growthDays} days</div>
      <div class="card-desc">${esc(s.description)}</div>
    </button>`
  ).join('');
  return `
    <header class="head"><h1>Pick a seed</h1>
    <p class="sub">What it'll become is a finale surprise.</p></header>
    <div class="grid">${cards}</div>`;
}

function choosePot(state) {
  const cards = POTS.map(
    (p) => `
    <button class="card pot-card" data-action="pick-pot" data-id="${p.id}">
      <div class="pot-img-wrap"><img class="pot-img" src="${p.icon}" alt="pot"></div>
      <div class="card-name">${esc(p.name)}</div>
      <div class="card-desc">${esc(p.description)}</div>
    </button>`
  ).join('');
  return `
    <header class="head"><h1>Pick a pot</h1>
    <p class="sub">Let's plant the seed 🌱</p></header>
    <div class="grid">${cards}</div>`;
}

// Stat row as in the concept: icon on the left, label above the bar.
function bar(icon, label, value, cls, showValue = true, note = '') {
  const v = Math.round(value);
  const noteSpan = note ? `<span class="stat-note">${note}</span>` : '';
  const valueSpan = showValue ? `<span>${noteSpan}${v}%</span>` : '';
  return `
    <div class="stat">
      <span class="stat-ico">${icon}</span>
      <div class="stat-body">
        <div class="stat-top"><span>${label}</span>${valueSpan}</div>
        <div class="bar"><div class="bar-fill ${cls}" style="width:${Math.max(0, Math.min(100, value))}%"></div></div>
      </div>
    </div>`;
}

// Soil moisture: not a percentage, but a scale between two extremes.
// The marker moves smoothly (CSS transition) — the watering animation is triggered by main.js.
function moisture(value) {
  const v = Math.max(0, Math.min(100, value));
  return `
    <div class="stat">
      <span class="stat-ico">${statImg('droplet')}</span>
      <div class="stat-body">
        <div class="stat-top"><span>Soil moisture</span></div>
        <div class="moisture">
          <div class="moisture-track">
            <div class="moisture-grad"></div>
            <div class="moisture-marker" id="moisture-marker" style="left:${v}%"></div>
          </div>
        </div>
      </div>
    </div>`;
}

function growing(state, now) {
  const seed = getSeed(state.seedId);
  const pot = getPot(state.potId);
  const hourIndex = Math.floor((now - state.startedAt) / HOUR);
  const w = WEATHER[state.lastWeather] || weatherAt(state.weatherSeed, hourIndex);
  const rootBound = isRootBound(state);

  // This plant's water need. dryThreshold — below it growth already
  // slows down (threshold = comfort = minWater × 1.5, as in the engine), and that's
  // what we warn about. On the moisture scale we put a notch at minWater.
  const need = WATER_NEED[seed?.waterNeed] || WATER_NEED.mid;
  const dryThreshold = need.minWater * 1.5;
  const day = gameDay(state, now); // current growth day (1-based)

  // Forecast for the next 3 days (as in the mockup): weekday + weather icon.
  // If a day matches the previous forecast one — take the nearest following block
  // with different weather (up to +24h), so the three days aren't identical.
  const unit = getTempUnit();
  let prevFc = null;
  const fc = [1, 2, 3].map((d) => {
    const labelTs = now + d * DAY;
    let ts = labelTs;
    let fw = weatherAt(state.weatherSeed, Math.floor((ts - state.startedAt) / HOUR));
    for (let tries = 0; prevFc && fw.id === prevFc && tries < 4; tries++) {
      ts += 6 * HOUR;
      fw = weatherAt(state.weatherSeed, Math.floor((ts - state.startedAt) / HOUR));
    }
    prevFc = fw.id;
    const wd = WEEKDAYS[new Date(labelTs).getDay()];
    return `<div class="fc-day" title="${esc(fw.label)} · ${formatTemp(fw.tempC, unit)}">
        <span class="fc-wd">${wd}</span>${weatherIcon(fw, 'fc-icon')}
      </div>`;
  }).join('');

  // Hint + plant mood (the icon in the badge depends on the state).
  let hint = 'Growing along nicely', mood = 'happy';
  if (rootBound) { hint = 'Roots are cramped — time to repot into a deeper pot!'; mood = 'repot'; }
  else if (state.water < dryThreshold) { hint = 'The soil is dry — water your plant'; mood = 'thirsty'; }
  else if (state.driedLeaves > 3) { hint = 'Too many dried leaves — trim them'; mood = 'unwell'; }
  else if (state.health < 40) { hint = 'Your plant is feeling poorly — take care of it'; mood = 'unwell'; }
  else if (w.id === 'hot') { hint = 'Heatwave — water drains faster than usual'; mood = 'thirsty'; }
  else if (w.temp === 'cold') { hint = 'It got cold, growth has slowed down'; mood = 'cold'; }
  else if (w.rain > 0) { hint = 'The rain waters it for you'; mood = 'happy'; }

  const canRepot = rootBound && state.potTier < POT_TIERS.length - 1;

  return `
    <header class="head growing-head">
      <div class="weather-bar">
        <div class="weather-now">
          ${weatherIcon(w, 'w-head')}
          <span class="temp num">${formatTemp(w.tempC, unit)}</span>
        </div>
        <span class="wbar-divider"></span>
        <div class="forecast-strip">${fc}</div>
        <button class="gear" data-action="open-settings" aria-label="Settings" title="Settings"><span class="gear-ico"><img class="gear-img" src="icons/ui/gear.png" alt=""></span></button>
      </div>
    </header>

    <div class="scene">${plantSVG({ growth: state.growth, driedLeaves: state.driedLeaves, seed, pot })}</div>

    ${bar(statImg('growth'), 'Growth', state.growth, 'growth', true, `Day ${day}`)}
    ${moisture(state.water)}
    ${bar(statImg('heart'), 'Health', state.health, 'health', false)}

    <p class="hint"><img class="hint-ico" src="icons/status/${mood}.png" alt=""><span>${esc(hint)}</span></p>

    <div class="actions">
      <button class="act" data-action="water"><span class="act-ico"><img class="act-ico-img" src="icons/ui/droplet.png" alt=""></span><span class="act-label">Water</span></button>
      <button class="act" data-action="trim" ${state.driedLeaves > 0 ? '' : 'disabled'}><span class="act-ico"><img class="act-ico-img" src="icons/ui/scissors.png" alt=""></span><span class="act-label">Trim</span></button>
      <button class="act ${canRepot ? 'highlight' : ''}" data-action="repot" ${canRepot ? '' : 'disabled'}><span class="act-ico">${pot?.icon ? `<img class="act-ico-img" src="${pot.icon}" alt="">` : '🪴'}</span><span class="act-label">Repot</span></button>
    </div>

    ${DEV ? devBar() : ''}`;
}

function endScreen(state, win) {
  const seed = getSeed(state.seedId);
  const pot = getPot(state.potId);
  const day = gameDay(state);
  const plantName = seed?.plantName || '???';
  // Fun facts about the grown plant (shown on a win).
  const facts = win && Array.isArray(seed?.facts) ? seed.facts : [];
  const factsHtml = facts.length
    ? `<div class="facts">
        <div class="facts-title">🌼 Did you know?</div>
        <ul>${facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
      </div>`
    : '';
  return `
    <header class="head">
      <h1>${win ? 'Congratulations! 🎉' : 'Oh no… 🥀'}</h1>
      <p class="sub">${win
        ? `You grew a <strong>${esc(plantName)}</strong> in ${day} day${day === 1 ? '' : 's'}.`
        : `Your <strong>${esc(plantName)}</strong> lived ${day} day${day === 1 ? '' : 's'}.<br>Better luck next time!`}</p>
    </header>
    <div class="scene">${plantSVG({ growth: 100, driedLeaves: win ? 0 : 6, seed, pot, finished: win, withered: !win })}</div>
    ${factsHtml}
    <div class="actions"><button class="act highlight wide" data-action="restart"><span>Plant again 🌱</span></button></div>`;
}

function settingsScreen() {
  const unit = getTempUnit();
  const seg = (u, label) =>
    `<button class="seg ${unit === u ? 'active' : ''}" data-action="set-temp-unit" data-unit="${u}">${label}</button>`;
  return `
    <header class="head"><h1>Settings</h1></header>
    <div class="settings">
      <div class="set-row">
        <span class="set-label">Temperature</span>
        <div class="segmented">${seg('C', '°C')}${seg('F', '°F')}</div>
      </div>
      <div class="set-row">
        <span class="set-label">Start over</span>
        <div class="segmented"><button class="seg danger" data-action="start-over">New plant</button></div>
      </div>
    </div>
    <p class="set-feedback">
      Got an idea to improve this or found a bug?
      <a href="https://chromewebstore.google.com/detail/my-little-plant/nmfppnlojcllbcokdpbcfaofhdbckoaa/reviews" target="_blank" rel="noopener noreferrer">Leave a review</a>
    </p>
    <div class="actions"><button class="act wide" data-action="close-settings">← Back</button></div>`;
}

export function devFrozen() {
  try { return localStorage.getItem('mlp_dev_freeze') === '1'; } catch { return false; }
}

function devBar() {
  const frozen = devFrozen();
  return `
    <div class="dev">
      <span>dev:</span>
      <button data-action="ff" data-h="6">+6h</button>
      <button data-action="ff" data-h="24">+1d</button>
      <button data-action="ff" data-h="120">+5d</button>
      <label class="dev-freeze" title="Water, health and leaves stay unchanged">
        <input type="checkbox" data-action="toggle-freeze" ${frozen ? 'checked' : ''}> freeze stats
      </label>
      <button data-action="restart">reset</button>
    </div>`;
}
