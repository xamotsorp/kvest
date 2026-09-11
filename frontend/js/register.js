import { api } from './api.js';

const PLAY_KEY = 'stations_play_id';

export async function render(container) {
  container.innerHTML = `
    <div class="screen active">
      <div class="mono" style="margin-bottom:18px; color:var(--teal);">◆ инициализация маршрута</div>
      <h1>Кто отправляется в путь?</h1>
      <p style="color:var(--ink-soft);">Назови себя и загрузи фото — станции соберутся вокруг тебя.</p>
      <form id="reg-form" autocomplete="off">
        <input id="reg-name" type="text" placeholder="твоё имя" maxlength="60" style="margin-bottom:14px;" />
        <label id="photo-label" for="reg-photo" style="
          display:flex; align-items:center; justify-content:center; gap:10px;
          border:1.5px dashed var(--line); border-radius:14px; padding:22px 16px;
          margin-bottom:14px; cursor:pointer; text-align:center; color:var(--ink-soft);
        ">
          <span id="photo-label-text">📷 выбрать фото</span>
        </label>
        <input id="reg-photo" type="file" accept="image/png,image/jpeg,image/webp" style="display:none;" />
        <div class="error-text" id="reg-error"></div>
        <button type="submit" id="reg-submit">Начать маршрут</button>
      </form>
    </div>
  `;

  const form = container.querySelector('#reg-form');
  const nameInput = container.querySelector('#reg-name');
  const photoInput = container.querySelector('#reg-photo');
  const photoLabelText = container.querySelector('#photo-label-text');
  const error = container.querySelector('#reg-error');
  const submitBtn = container.querySelector('#reg-submit');
  nameInput.focus();

  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    photoLabelText.textContent = file ? `✅ ${file.name}` : '📷 выбрать фото';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';

    const name = nameInput.value.trim();
    const file = photoInput.files[0];

    if (!name) {
      error.textContent = 'Напиши имя.';
      return;
    }
    if (!file) {
      error.textContent = 'Нужно фото.';
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      error.textContent = 'Фото слишком большое (максимум 15МБ).';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Загружаю…';

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('photo', file);
      const res = await api.register(formData);
      localStorage.setItem(PLAY_KEY, res.id);
      location.hash = '#/map';
    } catch (_) {
      error.textContent = 'Не получилось. Попробуй ещё раз.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Начать маршрут';
    }
  });

  return () => {};
}
