import { mountStationShell } from '../../js/stationShell.js';
import { confettiBurst } from '../../js/confetti.js';
import { ensurePlay, getPlayId } from '../../js/session.js';
import { api } from '../../js/api.js';

const IMG_GRID = 3;
const COLS = 3;
const ROWS = 4;
const BLANK = null;

const PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FF4FD8"/>
        <stop offset="55%" stop-color="#FFC14D"/>
        <stop offset="100%" stop-color="#2FE6FF"/>
      </linearGradient>
    </defs>
    <rect width="300" height="300" fill="url(#g)"/>
    <text x="150" y="140" font-size="54" text-anchor="middle" dominant-baseline="middle">💛</text>
    <text x="150" y="200" font-size="15" fill="#07091455" text-anchor="middle" font-family="monospace">фото скоро здесь</text>
  </svg>
`)}`;

async function resolveImage() {
  try {
    const playId = getPlayId();
    if (!playId) return PLACEHOLDER;
    const data = await api.getPlay(playId);
    if (data.play && data.play.photo_path) return data.play.photo_path;
  } catch (_) { /* fall through */ }
  return PLACEHOLDER;
}

function getNeighbors(idx) {
  const row = Math.floor(idx / COLS);
  const col = idx % COLS;
  const out = [];
  if (row > 0) out.push(idx - COLS);
  if (row < ROWS - 1) out.push(idx + COLS);
  if (col > 0) out.push(idx - 1);
  if (col < COLS - 1) out.push(idx + 1);
  return out;
}

function shuffledBoard() {
  const board = [0, 1, 2, 3, 4, 5, 6, 7, 8, BLANK, BLANK, BLANK];
  for (let i = 0; i < 200; i++) {
    const blanks = board.reduce((acc, v, idx) => { if (v === BLANK) acc.push(idx); return acc; }, []);
    const bIdx = blanks[Math.floor(Math.random() * blanks.length)];
    const tileNeighbors = getNeighbors(bIdx).filter((n) => board[n] !== BLANK);
    if (tileNeighbors.length === 0) continue;
    const swapWith = tileNeighbors[Math.floor(Math.random() * tileNeighbors.length)];
    [board[bIdx], board[swapWith]] = [board[swapWith], board[bIdx]];
  }
  return board;
}

function isSolved(board) {
  return board.slice(0, 9).every((v, i) => v === i);
}

export async function render(container) {
  const content = mountStationShell(container, 'puzzle');

  let timerInterval = null;

  content.innerHTML = `
    <div class="mono" style="margin-bottom:8px; color:var(--teal);">◆ станция 5 · реконструкция кадра</div>
    <h1>Собери момент</h1>
    <p style="color:var(--ink-soft);">Двигай фрагменты в пустые ячейки внизу — теперь их несколько, манёвра больше. Кусочки на своих местах светятся циан.</p>
    <div id="puzzle-body"></div>
  `;
  const body = content.querySelector('#puzzle-body');
  body.innerHTML = `<button id="start-btn">Начать</button>`;
  body.querySelector('#start-btn').addEventListener('click', startGame);

  async function startGame() {
    body.innerHTML = `<p class="mono">загружаю кадр…</p>`;
    const imageUrl = await resolveImage();
    let board = shuffledBoard();
    let moves = 0;
    let seconds = 0;
    let started = false;

    body.innerHTML = `
      <div class="topbar" style="margin-bottom:14px;">
        <div class="mono" id="pz-timer">0:00</div>
        <div class="mono" id="pz-moves">ходов: 0</div>
      </div>
      <div id="pz-grid" style="
        display:grid; grid-template-columns:repeat(${COLS}, 1fr); gap:4px;
        width:100%; max-width:320px; margin:0 auto;
      "></div>
    `;
    const grid = body.querySelector('#pz-grid');
    const timerEl = body.querySelector('#pz-timer');
    const movesEl = body.querySelector('#pz-moves');

    function startTimer() {
      if (started) return;
      started = true;
      timerInterval = setInterval(() => {
        seconds++;
        timerEl.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
      }, 1000);
    }

    function tileStyle(tileId) {
      if (tileId === BLANK) return 'background:var(--paper);';
      const row = Math.floor(tileId / IMG_GRID);
      const col = tileId % IMG_GRID;
      const pos = `${(col / (IMG_GRID - 1)) * 100}% ${(row / (IMG_GRID - 1)) * 100}%`;
      return `
        background-image:url('${imageUrl}');
        background-size:${IMG_GRID * 100}% ${IMG_GRID * 100}%;
        background-position:${pos};
      `;
    }

    function draw() {
      grid.innerHTML = '';
      board.forEach((tileId, idx) => {
        const inPlace = tileId !== BLANK && tileId === idx;
        const cell = document.createElement('button');
        cell.style.cssText = `
          aspect-ratio:1; border-radius:10px;
          border:1.5px solid ${inPlace ? 'var(--teal)' : 'var(--line)'};
          box-shadow:${inPlace ? '0 0 12px -2px var(--teal)' : 'none'};
          padding:0; cursor:${tileId === BLANK ? 'default' : 'pointer'};
          transition:border-color .2s ease, box-shadow .2s ease;
          ${tileStyle(tileId)}
        `;
        if (tileId !== BLANK) {
          cell.addEventListener('click', () => tryMove(idx));
        }
        grid.appendChild(cell);
      });
    }

    function tryMove(idx) {
      const blankNeighbor = getNeighbors(idx).find((n) => board[n] === BLANK);
      if (blankNeighbor === undefined) return;
      startTimer();
      [board[idx], board[blankNeighbor]] = [board[blankNeighbor], board[idx]];
      moves++;
      movesEl.textContent = `ходов: ${moves}`;
      draw();
      if (isSolved(board)) {
        clearInterval(timerInterval);
        setTimeout(() => finish(moves, seconds), 300);
      }
    }

    draw();
  }

  async function finish(moves, seconds) {
    body.innerHTML = `
      <div class="card">
        <div class="card-eyebrow">кадр восстановлен</div>
        <h2 style="margin-top:8px;">Момент собран</h2>
        <p class="mono">время: ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} · ходов: ${moves}</p>
      </div>
      <button id="continue-btn" style="margin-top:20px;">К карте маршрута</button>
    `;
    confettiBurst();

    try {
      const playId = await ensurePlay();
      await api.saveStation(playId, 'puzzle', { moves, seconds });
    } catch (_) { /* best-effort */ }

    body.querySelector('#continue-btn').addEventListener('click', () => {
      location.hash = '#/map';
    });
  }

  return () => {
    if (timerInterval) clearInterval(timerInterval);
  };
}
