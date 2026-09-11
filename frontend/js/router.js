import { api } from './api.js';
import { stopAudio } from './audio.js';
import { render as renderPin } from './pin.js';
import { render as renderRegister } from './register.js';
import { render as renderMap } from './map.js';
import { render as renderAdmin } from '../admin/index.js';
import { render as renderWarmup } from '../stations/01-warmup/index.js';
import { render as renderCourt } from '../stations/02-court/index.js';
import { render as renderMemory } from '../stations/03-memory/index.js';
import { render as renderNeuroset } from '../stations/04-neuroset/index.js';
import { render as renderPuzzle } from '../stations/05-puzzle/index.js';
import { render as renderSummary } from '../stations/06-summary/index.js';

const STATION_RENDERERS = {
  warmup: renderWarmup,
  court: renderCourt,
  memory: renderMemory,
  neuroset: renderNeuroset,
  puzzle: renderPuzzle,
  summary: renderSummary
};

const app = document.getElementById('app');
let currentDestroy = null;

function parseRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean);
  if (parts[0] === 'station' && parts[1]) return { name: 'station', param: parts[1] };
  if (parts[0] === 'admin') return { name: 'admin' };
  if (parts[0] === 'register') return { name: 'register' };
  if (parts[0] === 'map') return { name: 'map' };
  return { name: 'pin' };
}

async function renderRoute() {
  const route = parseRoute();

  if (typeof currentDestroy === 'function') {
    try { currentDestroy(); } catch (_) { /* ignore */ }
    currentDestroy = null;
  }

  if (route.name !== 'station') stopAudio();

  if (route.name === 'admin') {
    currentDestroy = await renderAdmin(app);
    return;
  }

  if (route.name !== 'pin') {
    const check = await api.checkPin().catch(() => ({ ok: false }));
    if (!check.ok) {
      location.hash = '#/pin';
      return;
    }
  }

  if (route.name === 'pin') {
    currentDestroy = await renderPin(app);
  } else if (route.name === 'register') {
    currentDestroy = await renderRegister(app);
  } else if (route.name === 'map') {
    currentDestroy = await renderMap(app);
  } else if (route.name === 'station') {
    const stationRender = STATION_RENDERERS[route.param];
    if (!stationRender) {
      location.hash = '#/map';
      return;
    }
    currentDestroy = await stationRender(app);
  }
}

window.addEventListener('hashchange', renderRoute);
window.addEventListener('DOMContentLoaded', renderRoute);
