import { mountStationShell } from '../../js/stationShell.js';
import { confettiBurst } from '../../js/confetti.js';
import { ensurePlay } from '../../js/session.js';
import { api } from '../../js/api.js';

const ICONS = ['🏋️', '🥤', '👟', '⏱️', '🏅', '🧴', '💪', '🎽'];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function render(container) {
  const content = mountStationShell(container, 'memory');

  let timerInterval = null;

  content.innerHTML = `
    <div class="mono" style="margin-bottom:8px; color:var(--teal);">◆ станция 3 · тренировка</div>
    <h1>Найди пары</h1>
    <p style="color:var(--ink-soft);">Классика зала: переверни две карточки, найди совпадение. На скорость.</p>
    <div id="memory-body"></div>
  `;
  const body = content.querySelector('#memory-body');
  body.innerHTML = `<button id="start-btn">Начать</button>`;
  body.querySelector('#start-btn').addEventListener('click', startGame);

  function startGame() {
    const deck = shuffle([...ICONS, ...ICONS]).map((icon, i) => ({ id: i, icon, matched: false }));
    let moves = 0;
    let matchedPairs = 0;
    let flipped = [];
    let locked = false;
    let seconds = 0;
    let started = false;

    body.innerHTML = `
      <div class="topbar" style="margin-bottom:14px;">
        <div class="mono" id="mem-timer">0:00</div>
        <div class="mono" id="mem-moves">ходов: 0</div>
      </div>
      <div id="mem-grid" style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;"></div>
    `;
    const grid = body.querySelector('#mem-grid');
    const timerEl = body.querySelector('#mem-timer');
    const movesEl = body.querySelector('#mem-moves');

    deck.forEach((card) => {
      const btn = document.createElement('button');
      btn.className = 'mem-card';
      btn.dataset.id = card.id;
      btn.style.cssText = `
        aspect-ratio:1; font-size:26px; border-radius:12px; padding:0;
        background:var(--card); border:1.5px solid var(--line); color:var(--card);
        transition:background .15s ease, color .15s ease;
      `;
      btn.textContent = '';
      btn.addEventListener('click', () => flipCard(card, btn));
      grid.appendChild(btn);
    });

    function startTimer() {
      if (started) return;
      started = true;
      timerInterval = setInterval(() => {
        seconds++;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        timerEl.textContent = `${m}:${String(s).padStart(2, '0')}`;
      }, 1000);
    }

    function flipCard(card, btn) {
      if (locked || card.matched || flipped.some((f) => f.card.id === card.id)) return;
      startTimer();
      btn.textContent = card.icon;
      flipped.push({ card, btn });

      if (flipped.length === 2) {
        moves++;
        movesEl.textContent = `ходов: ${moves}`;
        locked = true;
        const [a, b] = flipped;
        if (a.card.icon === b.card.icon) {
          a.card.matched = true;
          b.card.matched = true;
          a.btn.style.background = 'var(--paper-deep)';
          b.btn.style.background = 'var(--paper-deep)';
          matchedPairs++;
          flipped = [];
          locked = false;
          if (matchedPairs === ICONS.length) {
            clearInterval(timerInterval);
            setTimeout(() => finish(moves, seconds), 400);
          }
        } else {
          setTimeout(() => {
            a.btn.textContent = '';
            b.btn.textContent = '';
            flipped = [];
            locked = false;
          }, 700);
        }
      }
    }
  }

  async function finish(moves, seconds) {
    body.innerHTML = `
      <div class="card">
        <div class="card-eyebrow mono" style="color:var(--teal);">результат</div>
        <h2 style="margin-top:8px;">Все пары найдены!</h2>
        <p class="mono">время: ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} · ходов: ${moves}</p>
      </div>
      <button id="continue-btn" style="margin-top:20px;">К карте маршрута</button>
    `;
    confettiBurst();

    try {
      const playId = await ensurePlay();
      await api.saveStation(playId, 'memory', { moves, seconds });
    } catch (_) { /* best-effort */ }

    body.querySelector('#continue-btn').addEventListener('click', () => {
      location.hash = '#/map';
    });
  }

  return () => {
    if (timerInterval) clearInterval(timerInterval);
  };
}
