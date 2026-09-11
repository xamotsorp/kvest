import { mountStationShell } from '../../js/stationShell.js';
import { confettiBurst } from '../../js/confetti.js';
import { ensurePlay } from '../../js/session.js';
import { api } from '../../js/api.js';

const SIZE = 4;
const GAME_SECONDS = 75;
const SWIPE_THRESHOLD = 24;

const TILE_COLORS = {
  2: '#0F3446', 4: '#123A52', 8: '#155275', 16: '#1B6B9E',
  32: '#2186C4', 64: '#2FA7E6', 128: '#5FC6F2', 256: '#9BD9F5',
  512: '#FFC14D', 1024: '#FF9A4D', 2048: '#FF4FD8'
};

function emptyBoard() {
  return new Array(SIZE * SIZE).fill(0);
}

function getRow(board, r) { return board.slice(r * SIZE, r * SIZE + SIZE); }
function setRow(board, r, arr) { arr.forEach((v, c) => { board[r * SIZE + c] = v; }); }
function getCol(board, c) { return Array.from({ length: SIZE }, (_, r) => board[r * SIZE + c]); }
function setCol(board, c, arr) { arr.forEach((v, r) => { board[r * SIZE + c] = v; }); }

function addRandomTile(board) {
  const empty = board.reduce((acc, v, i) => { if (v === 0) acc.push(i); return acc; }, []);
  if (empty.length === 0) return;
  const idx = empty[Math.floor(Math.random() * empty.length)];
  board[idx] = Math.random() < 0.9 ? 2 : 4;
}

function slideAndMergeLine(line) {
  const nums = line.filter((v) => v !== 0);
  const merged = [];
  let gained = 0;
  let i = 0;
  while (i < nums.length) {
    if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
      const val = nums[i] * 2;
      merged.push(val);
      gained += val;
      i += 2;
    } else {
      merged.push(nums[i]);
      i += 1;
    }
  }
  while (merged.length < SIZE) merged.push(0);
  const moved = merged.some((v, idx) => v !== line[idx]);
  return { line: merged, gained, moved };
}

function applyMove(board, direction) {
  let gained = 0;
  let moved = false;

  if (direction === 'left' || direction === 'right') {
    for (let r = 0; r < SIZE; r++) {
      let row = getRow(board, r);
      if (direction === 'right') row = row.slice().reverse();
      const res = slideAndMergeLine(row);
      const finalLine = direction === 'right' ? res.line.slice().reverse() : res.line;
      setRow(board, r, finalLine);
      gained += res.gained;
      moved = moved || res.moved;
    }
  } else {
    for (let c = 0; c < SIZE; c++) {
      let col = getCol(board, c);
      if (direction === 'down') col = col.slice().reverse();
      const res = slideAndMergeLine(col);
      const finalLine = direction === 'down' ? res.line.slice().reverse() : res.line;
      setCol(board, c, finalLine);
      gained += res.gained;
      moved = moved || res.moved;
    }
  }

  return { gained, moved };
}

function hasMovesLeft(board) {
  if (board.includes(0)) return true;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = board[r * SIZE + c];
      if (c < SIZE - 1 && v === board[r * SIZE + c + 1]) return true;
      if (r < SIZE - 1 && v === board[(r + 1) * SIZE + c]) return true;
    }
  }
  return false;
}

export async function render(container) {
  const content = mountStationShell(container, 'warmup');

  let tickInterval = null;
  let keyHandler = null;

  content.innerHTML = `
    <div class="mono" style="margin-bottom:8px; color:var(--teal);">◆ станция 1 · разгон системы</div>
    <h1>Собери сигнал</h1>
    <p style="color:var(--ink-soft);">Классика на ${GAME_SECONDS} секунд: свайпай (или стрелки на десктопе), сливай одинаковые блоки, набирай счёт.</p>
    <div id="warmup-body" style="text-align:center; padding-top:10px;"></div>
  `;

  const body = content.querySelector('#warmup-body');

  function showIntro() {
    body.innerHTML = `<button id="start-btn">Начать</button>`;
    body.querySelector('#start-btn').addEventListener('click', startGame);
  }

  function startGame() {
    let board = emptyBoard();
    addRandomTile(board);
    addRandomTile(board);
    let score = 0;
    let highest = 2;
    let remaining = GAME_SECONDS;
    let ended = false;

    body.innerHTML = `
      <div class="topbar" style="margin-bottom:14px;">
        <div class="mono" id="w-timer">${remaining}s</div>
        <div class="mono" id="w-score">счёт: 0</div>
      </div>
      <div id="w-grid" style="
        position:relative; display:grid; grid-template-columns:repeat(${SIZE}, 1fr); gap:6px;
        width:100%; max-width:320px; aspect-ratio:1; margin:0 auto;
        background:var(--paper-deep); border:1px solid var(--line); border-radius:14px; padding:6px;
        touch-action:none; user-select:none;
      "></div>
      <div class="mono" style="margin-top:14px; color:var(--ink-soft);">← ↑ → ↓ или свайп по полю</div>
    `;

    const grid = body.querySelector('#w-grid');
    const timerEl = body.querySelector('#w-timer');
    const scoreEl = body.querySelector('#w-score');

    function draw() {
      grid.innerHTML = '';
      board.forEach((v) => {
        const cell = document.createElement('div');
        const color = TILE_COLORS[v] || (v > 2048 ? '#B06BFF' : 'var(--card)');
        cell.style.cssText = `
          aspect-ratio:1; border-radius:8px; display:flex; align-items:center; justify-content:center;
          font-family:'Orbitron', sans-serif; font-weight:700; font-size:${v >= 1000 ? '16px' : '20px'};
          color:${v ? '#07091A' : 'transparent'}; background:${color};
          transition:background .15s ease;
        `;
        cell.textContent = v || '';
        grid.appendChild(cell);
      });
    }

    function endGame(reason) {
      if (ended) return;
      ended = true;
      clearInterval(tickInterval);
      if (keyHandler) window.removeEventListener('keydown', keyHandler);
      finish(score, highest, reason);
    }

    function doMove(direction) {
      if (ended) return;
      const { gained, moved } = applyMove(board, direction);
      if (!moved) return;
      score += gained;
      addRandomTile(board);
      highest = Math.max(highest, ...board);
      scoreEl.textContent = `счёт: ${score}`;
      draw();
      if (!hasMovesLeft(board)) endGame('stuck');
    }

    keyHandler = (e) => {
      const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
      if (map[e.key]) {
        e.preventDefault();
        doMove(map[e.key]);
      }
    };
    window.addEventListener('keydown', keyHandler);

    let touchStart = null;
    grid.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      touchStart = { x: t.clientX, y: t.clientY };
    }, { passive: true });
    grid.addEventListener('touchend', (e) => {
      if (!touchStart) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      touchStart = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        doMove(dx > 0 ? 'right' : 'left');
      } else {
        doMove(dy > 0 ? 'down' : 'up');
      }
    }, { passive: true });

    tickInterval = setInterval(() => {
      remaining--;
      timerEl.textContent = `${remaining}s`;
      if (remaining <= 0) endGame('time');
    }, 1000);

    draw();
  }

  async function finish(score, highest, reason) {
    const verdict = highest >= 128 ? 'видно, что 2048 — не в новинку'
      : highest >= 64 ? 'неплохой разгон, есть куда расти'
      : 'для разминки — самое то';

    body.innerHTML = `
      <div class="card">
        <div class="card-eyebrow mono" style="color:var(--teal);">${reason === 'time' ? 'время вышло' : 'ходов больше нет'}</div>
        <div class="card-title" style="font-size:27px; font-weight:600; margin-bottom:6px;">${score} очков</div>
        <p style="color:var(--ink-soft); font-style:italic; margin-bottom:6px;">${verdict}</p>
        <p class="mono" style="font-size:13px;">лучший блок: ${highest}</p>
      </div>
      <button id="continue-btn" style="margin-top:20px;">К карте маршрута</button>
    `;

    if (highest >= 64) confettiBurst();

    try {
      const playId = await ensurePlay();
      await api.saveStation(playId, 'warmup', { score, highest });
    } catch (_) { /* saving is best-effort */ }

    body.querySelector('#continue-btn').addEventListener('click', () => {
      location.hash = '#/map';
    });
  }

  showIntro();

  return () => {
    if (tickInterval) clearInterval(tickInterval);
    if (keyHandler) window.removeEventListener('keydown', keyHandler);
  };
}
