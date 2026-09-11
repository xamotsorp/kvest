const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  let data = null;
  try { data = await res.json(); } catch (_) { /* no body */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || 'request_failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

async function registerRequest(formData) {
  const res = await fetch(BASE + '/register', {
    method: 'POST',
    credentials: 'same-origin',
    body: formData
  });
  let data = null;
  try { data = await res.json(); } catch (_) { /* no body */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || 'request_failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  submitPin: (pin) => request('/pin', { method: 'POST', body: { pin } }),
  checkPin: () => request('/pin/check'),

  register: (formData) => registerRequest(formData),

  createPlay: () => request('/plays', { method: 'POST' }),
  saveStation: (playId, key, payload) =>
    request(`/plays/${playId}/stations/${key}`, { method: 'POST', body: payload }),
  getPlay: (playId) => request(`/plays/${playId}`),

  adminLogin: (password) => request('/admin/login', { method: 'POST', body: { password } }),
  checkAdmin: () => request('/admin/check'),
  adminPlays: () => request('/admin/plays')
};
