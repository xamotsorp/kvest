import { mountStationAudio } from './audio.js';

/**
 * Renders the shared station chrome (back-to-map link + audio toggle)
 * and returns the inner content element for the station to fill in.
 */
export function mountStationShell(container, key) {
  container.innerHTML = `
    <div class="screen active">
      <div class="topbar">
        <a href="#/map">← к карте</a>
        <div class="right" id="topbar-right"></div>
      </div>
      <div id="station-content"></div>
    </div>
  `;
  mountStationAudio(container.querySelector('#topbar-right'), key);
  return container.querySelector('#station-content');
}
