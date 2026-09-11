const MUTE_KEY = 'stations_audio_muted';

const el = new Audio();
el.loop = true;
el.volume = 0.35;
el.preload = 'none';

function isMuted() {
  return localStorage.getItem(MUTE_KEY) === '1';
}

function setMuted(v) {
  localStorage.setItem(MUTE_KEY, v ? '1' : '0');
}

async function trackExists(key) {
  try {
    const res = await fetch(`/media/audio/${key}.mp3`, { method: 'HEAD', cache: 'no-store' });
    return res.ok;
  } catch (_) {
    return false;
  }
}

export function stopAudio() {
  el.pause();
  el.removeAttribute('src');
}

/**
 * Mounts a mute/unmute toggle for a station's track into `container`.
 * Silently does nothing (no button rendered) if the mp3 isn't there yet.
 */
export async function mountStationAudio(container, key) {
  const available = await trackExists(key);
  if (!available) return;

  el.src = `/media/audio/${key}.mp3`;

  const btn = document.createElement('button');
  btn.className = 'icon-btn';
  btn.type = 'button';

  const render = () => {
    btn.textContent = isMuted() ? '🔇 звук' : '🔊 звук';
  };
  render();

  if (!isMuted()) {
    el.play().catch(() => { /* autoplay blocked, user can tap the toggle */ });
  }

  btn.addEventListener('click', () => {
    const nowMuted = !isMuted();
    setMuted(nowMuted);
    if (nowMuted) {
      el.pause();
    } else {
      el.play().catch(() => {});
    }
    render();
  });

  container.appendChild(btn);
}
