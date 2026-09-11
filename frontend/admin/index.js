import { api } from '../js/api.js';

export async function render(container) {
  container.innerHTML = `<div class="screen active"><p class="mono">загрузка…</p></div>`;

  const check = await api.checkAdmin().catch(() => ({ ok: false }));
  if (check.ok) {
    await renderDashboard(container);
  } else {
    renderLogin(container);
  }

  return () => {};
}

function renderLogin(container) {
  container.innerHTML = `
    <div class="screen active">
      <div class="mono" style="margin-bottom:18px; color:var(--teal);">◆ admin</div>
      <h1>Вход в админку</h1>
      <form id="admin-form" autocomplete="off">
        <input id="admin-pass" type="password" placeholder="пароль" style="margin-bottom:14px;" />
        <div class="error-text" id="admin-error"></div>
        <button type="submit">Войти</button>
      </form>
    </div>
  `;
  const form = container.querySelector('#admin-form');
  const pass = container.querySelector('#admin-pass');
  const error = container.querySelector('#admin-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    try {
      const res = await api.adminLogin(pass.value);
      if (res.ok) await renderDashboard(container);
    } catch (_) {
      error.textContent = 'Неверный пароль';
      pass.value = '';
      pass.focus();
    }
  });
}

async function renderDashboard(container) {
  let data;
  try {
    data = await api.adminPlays();
  } catch (_) {
    renderLogin(container);
    return;
  }

  const rows = data.plays.map((play) => {
    const stationsHtml = play.stations.map((s) => `
      <div class="station-block">
        <div class="key">${s.station_key}</div>
        <pre>${escapeHtml(JSON.stringify(s.payload, null, 2))}</pre>
      </div>
    `).join('') || '<p class="mono">ещё ничего не пройдено</p>';

    return `
      <div class="play-row" data-id="${play.id}">
        <div class="play-head">
          <div style="display:flex; align-items:center; gap:10px;">
            ${play.photo_path ? `<img src="${play.photo_path}" alt="" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:1.5px solid var(--teal);" />` : ''}
            <div>
              <div style="font-weight:600;">${play.name ? play.name : 'без имени'} ${play.finished_at ? '✅' : '⏳'}</div>
              <div class="play-meta">${new Date(play.started_at).toLocaleString('ru-RU')}</div>
            </div>
          </div>
          <div class="play-meta">${play.stations.length} / 6 станций</div>
        </div>
        <div class="play-detail">${stationsHtml}</div>
      </div>
    `;
  }).join('') || '<p class="mono">пока никто не заходил</p>';

  container.innerHTML = `
    <div class="screen active">
      <div class="mono" style="margin-bottom:18px; color:var(--teal);">◆ admin</div>
      <h1>Результаты</h1>
      <div id="plays-list">${rows}</div>
    </div>
  `;

  container.querySelectorAll('.play-row').forEach((row) => {
    row.addEventListener('click', () => {
      row.querySelector('.play-detail').classList.toggle('open');
    });
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
