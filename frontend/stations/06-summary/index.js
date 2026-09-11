import { mountStationShell } from '../../js/stationShell.js';
import { confettiBurst } from '../../js/confetti.js';
import { ensurePlay, getProgress, STATIONS } from '../../js/session.js';
import { api } from '../../js/api.js';

const FIELD_LABELS = {
  score: 'счёт',
  highest: 'лучший блок',
  moves: 'ходов',
  seconds: 'секунд',
  persona: 'тип',
  name: 'результат',
  tagline: 'описание',
  answers: 'решений принято'
};

function formatPayload(payload) {
  const rows = Object.entries(payload || {}).map(([k, v]) => {
    const label = FIELD_LABELS[k] || k;
    let value = v;
    if (Array.isArray(v)) value = `${v.length}`;
    else if (typeof v === 'object' && v !== null) return null;
    return `<div class="stat-row"><span>${label}</span><span>${value}</span></div>`;
  }).filter(Boolean);
  return rows.join('');
}

export async function render(container) {
  const content = mountStationShell(container, 'summary');

  content.innerHTML = `
    <div class="mono" style="margin-bottom:8px; color:var(--teal);">◆ станция 6 · финал</div>
    <div id="summary-body"><p class="mono">собираю итоги…</p></div>
  `;
  const body = content.querySelector('#summary-body');

  const { all } = await getProgress();

  const blocks = STATIONS.map((s) => {
    const payload = all[s.key];
    if (!payload) return '';
    return `
      <div class="station-block" style="margin-bottom:18px;">
        <div class="mono" style="color:var(--teal); margin-bottom:6px;">${s.emoji} ${s.title}</div>
        ${formatPayload(payload)}
      </div>
    `;
  }).join('');

  body.innerHTML = `
    <div class="card">
      <div class="card-eyebrow">итог дня</div>
      <h1 style="margin-top:8px;">Все станции пройдены 🎉</h1>
      <p class="card-tagline" style="margin-bottom:20px;">вот что удалось выяснить по пути</p>
      ${blocks}
      <div class="card-foot">спасибо за эти несколько минут веселья — Макс</div>
    </div>
    <button id="continue-btn" style="margin-top:20px;">К карте маршрута</button>
  `;

  confettiBurst();

  try {
    const playId = await ensurePlay();
    await api.saveStation(playId, 'summary', {});
  } catch (_) { /* best-effort */ }

  body.querySelector('#continue-btn').addEventListener('click', () => {
    location.hash = '#/map';
  });

  return () => {};
}
