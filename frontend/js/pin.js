import { api } from './api.js';

export async function render(container) {
  container.innerHTML = `
    <div class="screen active">
      <div class="mono" style="margin-bottom:18px; color:var(--teal);">◆ терминал доступа</div>
      <h1>Маршрут закрыт</h1>
      <p style="color:var(--ink-soft);">Введи код доступа, чтобы активировать станцию.</p>
      <form id="pin-form" autocomplete="off">
        <input id="pin-input" type="tel" inputmode="numeric" pattern="[0-9]*" maxlength="4"
               placeholder="••••" style="text-align:center; font-size:28px; margin-bottom:14px;" />
        <div class="error-text" id="pin-error"></div>
        <button type="submit">Активировать</button>
      </form>
    </div>
  `;

  const form = container.querySelector('#pin-form');
  const input = container.querySelector('#pin-input');
  const error = container.querySelector('#pin-error');
  input.focus();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    try {
      const res = await api.submitPin(input.value.trim());
      if (res.ok) {
        location.hash = '#/register';
      }
    } catch (err) {
      error.textContent = err.status === 429
        ? 'Слишком много попыток. Подожди немного и попробуй снова.'
        : 'Не то. Попробуй ещё раз.';
      input.value = '';
      input.focus();
    }
  });

  return () => {};
}
