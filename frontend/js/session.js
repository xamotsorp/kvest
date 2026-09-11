import { api } from './api.js';

const PLAY_KEY = 'stations_play_id';

export async function ensurePlay() {
  let id = localStorage.getItem(PLAY_KEY);
  if (id) return id;
  const play = await api.createPlay();
  localStorage.setItem(PLAY_KEY, play.id);
  return play.id;
}

export function getPlayId() {
  return localStorage.getItem(PLAY_KEY);
}

export const STATIONS = [
  { key: 'warmup', title: 'Разогрев', emoji: '🔢' },
  { key: 'court', title: 'Дело слушается', emoji: '🔍' },
  { key: 'memory', title: 'Тренировка', emoji: '🏋️' },
  { key: 'neuroset', title: 'Какая ты нейросеть', emoji: '🤖' },
  { key: 'puzzle', title: 'Собери момент', emoji: '🧩' }
];

export const SUMMARY_KEY = 'summary';

export async function getProgress() {
  const playId = getPlayId();
  if (!playId) return { done: [], all: {} };
  try {
    const data = await api.getPlay(playId);
    const done = data.stations.map((s) => s.station_key);
    const all = {};
    data.stations.forEach((s) => { all[s.station_key] = s.payload; });
    return { done, all, play: data.play };
  } catch (_) {
    return { done: [], all: {} };
  }
}
