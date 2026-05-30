import { loadState, saveState, defaultState } from './state.js';
import { advance, isRootBound } from './engine.js';
import { render, devFrozen } from './render.js';
import { setTempUnit } from './settings.js';
import { POT_TIERS, HOUR, WATER_PER_POUR, REPOT_ROT_RELIEF } from './config.js';

const root = document.getElementById('app');
let state;
let view = null; // null - game, 'settings' - settings screen (not part of state)

function frozen() { return devFrozen(); }

// Wait for the pixel font before the first render, otherwise the popup gets
// drawn with the fallback monospace font and the font is "lost" at startup.
async function ensureFonts() {
  if (!document.fonts || !document.fonts.load) return;
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('400 16px "Jersey 25"'),
        document.fonts.load('700 16px "Jersey 25"'),
      ]),
      new Promise((r) => setTimeout(r, 400)), // safeguard against hanging
    ]);
  } catch {}
}

async function init() {
  state = await loadState();
  state = advance(state, Date.now(), frozen());
  await saveState(state);
  await ensureFonts();
  draw();
}

function draw() {
  root.innerHTML = render(state, Date.now(), { view });
}

async function update(mutator) {
  state = advance(state, Date.now(), frozen());
  if (mutator) mutator(state);
  await saveState(state);
  draw();
}

root.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;

  switch (action) {
    case 'pick-seed':
      await update((s) => { s.seedId = btn.dataset.id; s.phase = 'choose-pot'; });
      break;

    case 'pick-pot':
      await update((s) => {
        s.potId = btn.dataset.id;
        s.phase = 'intro'; // welcome / care screen — the grow timer starts on 'begin'
      });
      break;

    case 'begin':
      await update((s) => {
        s.phase = 'growing';
        const now = Date.now();
        s.startedAt = now;
        s.lastTick = now;
      });
      break;

    case 'water': {
      // Catch up time and re-render - the marker lands on the current moisture.
      state = advance(state, Date.now(), frozen());
      draw();
      if (state.phase === 'growing') {
        // Watering adds a small portion of moisture (not filling to the brim) -
        // so moisture is dosed more precisely, a full pot takes several taps.
        state.water = Math.min(100, state.water + WATER_PER_POUR);
        state.timesWatered = (state.timesWatered || 0) + 1;
        const marker = document.getElementById('moisture-marker');
        if (marker) {
          // Next frame - move the marker to the new level, CSS transition animates it.
          await new Promise((r) => requestAnimationFrame(r));
          marker.style.left = state.water + '%';
          await new Promise((r) => setTimeout(r, 850));
        }
        await saveState(state);
        draw();
      }
      break;
    }

    case 'trim':
      await update((s) => {
        if (s.phase === 'growing' && s.driedLeaves > 0) {
          s.driedLeaves = 0; s._driedProgress = 0;
          s.health = Math.min(100, s.health + 5);
          s.timesTrimmed = (s.timesTrimmed || 0) + 1;
        }
      });
      break;

    case 'repot':
      await update((s) => {
        if (s.phase === 'growing' && isRootBound(s) && s.potTier < POT_TIERS.length - 1) {
          s.potTier += 1;
          s.health = Math.min(100, s.health + 4);
          s.rot = Math.max(0, (s.rot || 0) - REPOT_ROT_RELIEF); // fresh soil clears some rot
          s.timesRepotted = (s.timesRepotted || 0) + 1;
        }
      });
      break;

    case 'open-settings':
      view = 'settings';
      draw();
      break;

    case 'close-settings':
      view = null;
      draw();
      break;

    case 'set-temp-unit':
      setTempUnit(btn.dataset.unit);
      draw(); // stay in settings, the toggle updates
      break;

    case 'restart':
      state = defaultState();
      view = null;
      await saveState(state);
      draw();
      break;

    // Same fresh start as 'restart', but reachable mid-game from Settings -
    // so confirm first, the player has a living plant to lose.
    case 'start-over':
      if (confirm('Start a new plant? Your current plant and all its progress will be lost.')) {
        state = defaultState();
        view = null;
        await saveState(state);
        draw();
      }
      break;

    case 'ff': {
      const hrs = Number(btn.dataset.h) || 0;
      state.startedAt -= hrs * HOUR;
      state.lastTick -= hrs * HOUR;
      await update();
      break;
    }
  }
});

// "Freeze stats" checkbox - listened separately, since change does not bubble through click
root.addEventListener('change', (e) => {
  if (e.target.dataset.action === 'toggle-freeze') {
    try { localStorage.setItem('mlp_dev_freeze', e.target.checked ? '1' : '0'); } catch {}
    draw();
  }
});

init();
