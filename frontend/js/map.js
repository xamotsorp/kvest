import { getPlayId, getProgress, STATIONS, SUMMARY_KEY } from './session.js';

export async function render(container) {
  const playId = getPlayId();
  if (!playId) {
    location.hash = '#/register';
    return () => {};
  }

  container.innerHTML = `<div class="screen active"><p class="mono">сканирую маршрут…</p></div>`;

  const { done, play } = await getProgress();
  const allDone = STATIONS.every((s) => done.includes(s.key));
  const stops = [...STATIONS, { key: SUMMARY_KEY, title: 'Итог дня', emoji: '🎉', final: true }];

  const stopsHtml = stops.map((s, i) => {
    const isFinal = !!s.final;
    const isDone = done.includes(s.key);
    const locked = isFinal && !allDone;
    const side = i % 2 === 0 ? 'left' : 'right';
    const status = locked
      ? `сигнал закрыт (${done.length}/${STATIONS.length})`
      : isDone
        ? 'станция пройдена'
        : isFinal ? 'конечная — заходи' : 'доступна';

    return `
      <div class="route-stop ${side} ${isDone ? 'done' : ''} ${locked ? 'locked' : ''} ${isFinal ? 'final' : ''}">
        <button class="route-node" data-key="${s.key}" ${locked ? 'disabled' : ''} aria-label="${s.title}">
          <span class="route-node-emoji">${s.emoji}</span>
          ${isDone ? '<span class="route-node-check">✓</span>' : ''}
        </button>
        <div class="route-info">
          <div class="route-title">${s.title}</div>
          <div class="route-status mono">${status}</div>
        </div>
      </div>
    `;
  }).join('');

  const greeting = play && play.name ? `экипаж: ${play.name}` : 'маршрут активен';

  container.innerHTML = `
    <div class="screen active">
      <div class="mono" style="margin-bottom:8px; color:var(--teal);">◆ ${greeting}</div>
      <h1>Карта маршрута</h1>
      <p style="color:var(--ink-soft);">Станции открыты в любом порядке — выбирай следующую точку.</p>
      <div class="route">
        <div class="route-line"></div>
        ${stopsHtml}
      </div>
    </div>
  `;

  container.querySelectorAll('.route-node:not([disabled])').forEach((btn) => {
    btn.addEventListener('click', () => {
      location.hash = `#/station/${btn.dataset.key}`;
    });
  });

  return () => {};
}
