import { loadState, saveState, defaultState } from './state.js';
import { advance, isRootBound } from './engine.js';
import { render, devFrozen } from './render.js';
import { setTempUnit } from './settings.js';
import { POT_TIERS, HOUR, WATER_PER_POUR } from './config.js';

const root = document.getElementById('app');
let state;
let view = null; // null — игра, 'settings' — экран настроек (не часть state)

function frozen() { return devFrozen(); }

// Дожидаемся пиксельного шрифта до первого рендера, иначе попап успевает
// отрисоваться запасным моноширинным и шрифт «теряется» на старте.
async function ensureFonts() {
  if (!document.fonts || !document.fonts.load) return;
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('400 16px "Jersey 25"'),
        document.fonts.load('700 16px "Jersey 25"'),
      ]),
      new Promise((r) => setTimeout(r, 400)), // страховка от подвисания
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
        s.phase = 'growing';
        const now = Date.now();
        s.startedAt = now;
        s.lastTick = now;
      });
      break;

    case 'water': {
      // Догоняем время и перерисовываем — маркер встаёт на текущую влажность.
      state = advance(state, Date.now(), frozen());
      draw();
      if (state.phase === 'growing') {
        // Полив добавляет небольшую порцию влаги (а не заливает до краёв) —
        // так влажность дозируется точнее, полный горшок — за несколько нажатий.
        state.water = Math.min(100, state.water + WATER_PER_POUR);
        const marker = document.getElementById('moisture-marker');
        if (marker) {
          // Следующий кадр — двигаем маркер к новому уровню, CSS-переход анимирует.
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
        }
      });
      break;

    case 'repot':
      await update((s) => {
        if (s.phase === 'growing' && isRootBound(s) && s.potTier < POT_TIERS.length - 1) {
          s.potTier += 1;
          s.health = Math.min(100, s.health + 4);
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
      draw(); // остаёмся в настройках, переключатель обновляется
      break;

    case 'restart':
      state = defaultState();
      view = null;
      await saveState(state);
      draw();
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

// Чекбокс «заморозить показатели» — слушаем отдельно, т.к. change не всплывает через click
root.addEventListener('change', (e) => {
  if (e.target.dataset.action === 'toggle-freeze') {
    try { localStorage.setItem('mlp_dev_freeze', e.target.checked ? '1' : '0'); } catch {}
    draw();
  }
});

init();
