import { mountStationShell } from '../../js/stationShell.js';
import { ensurePlay } from '../../js/session.js';
import { api } from '../../js/api.js';
import { CASES } from './cases.js';

const CASES_PER_PLAY = 6;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function render(container) {
  const content = mountStationShell(container, 'court');

  content.innerHTML = `
    <div class="mono" style="margin-bottom:8px; color:var(--teal);">◆ станция 2 · расследование</div>
    <div id="court-body"></div>
  `;
  const body = content.querySelector('#court-body');

  const activeCases = shuffle(CASES).slice(0, CASES_PER_PLAY);
  let current = 0;
  const answers = [];

  function renderCase() {
    const c = activeCases[current];
    body.innerHTML = `
      <div class="progress-row">
        <div class="progress-track"><div class="progress-fill" style="width:${(current / activeCases.length) * 100}%"></div></div>
        <div class="mono">${current + 1} / ${activeCases.length}</div>
      </div>
      <h2>${c.title}</h2>
      <p style="color:var(--ink-soft);">${c.prompt}</p>
      <div id="options"></div>
    `;
    const opts = body.querySelector('#options');
    c.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'option';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => pick(c, i, btn));
      opts.appendChild(btn);
    });
  }

  function pick(c, i, btn) {
    body.querySelectorAll('.option').forEach((o) => { o.disabled = true; });
    btn.classList.add('picked');
    answers.push({ case: c.id, choice: c.options[i].text });

    const verdictBox = document.createElement('div');
    verdictBox.className = 'card';
    verdictBox.style.marginTop = '16px';
    verdictBox.innerHTML = `<p style="margin:0;">🔍 ${c.options[i].verdict}</p>`;
    body.appendChild(verdictBox);

    const nextBtn = document.createElement('button');
    nextBtn.textContent = current < activeCases.length - 1 ? 'Следующая улика' : 'Раскрыть дело';
    nextBtn.style.marginTop = '16px';
    nextBtn.addEventListener('click', () => {
      current++;
      if (current < activeCases.length) {
        renderCase();
      } else {
        finish();
      }
    });
    body.appendChild(nextBtn);
  }

  async function finish() {
    body.innerHTML = `
      <div class="card">
        <div class="card-eyebrow mono" style="color:var(--teal);">расследование завершено</div>
        <h2 style="margin-top:8px;">Дело закрыто: с тобой не соскучишься</h2>
        <p style="color:var(--ink-soft);">Все ${activeCases.length} улик изучены. Досье передаётся в архив — до следующего загадочного случая.</p>
      </div>
      <button id="continue-btn" style="margin-top:20px;">К карте маршрута</button>
    `;

    try {
      const playId = await ensurePlay();
      await api.saveStation(playId, 'court', { answers });
    } catch (_) { /* best-effort */ }

    body.querySelector('#continue-btn').addEventListener('click', () => {
      location.hash = '#/map';
    });
  }

  renderCase();

  return () => {};
}
