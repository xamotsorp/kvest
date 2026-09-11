import { mountStationShell } from '../../js/stationShell.js';
import { ensurePlay, getPlayId } from '../../js/session.js';
import { api } from '../../js/api.js';

const FALLBACK_NAME = 'гость маршрута';

const QUESTION_POOL = [
  {
    text: 'Что ты выберешь на вечер?',
    options: [
      { t: 'Спонтанную поездку без плана', type: 'chaos' },
      { t: 'Плед, чай и тишину', type: 'comfort' },
      { t: 'Компанию, где все хотят поговорить именно с тобой', type: 'main' }
    ]
  },
  {
    text: 'Как ты реагируешь на неожиданные планы?',
    options: [
      { t: 'Обожаю — чем неожиданнее, тем лучше', type: 'chaos' },
      { t: 'Нужно пару минут, чтобы настроиться', type: 'comfort' },
      { t: 'Уже придумываю, как сделать ещё эффектнее', type: 'main' }
    ]
  },
  {
    text: 'Твоя суперсила в компании друзей?',
    options: [
      { t: 'Смешные истории из ниоткуда', type: 'chaos' },
      { t: 'Услышать и поддержать в нужный момент', type: 'comfort' },
      { t: 'Заходишь — и внимание уже у тебя', type: 'main' }
    ]
  },
  {
    text: 'Идеальные выходные — это...',
    options: [
      { t: 'То, что случилось само — без всякого плана', type: 'chaos' },
      { t: 'Медленное утро и никакой суеты', type: 'comfort' },
      { t: 'Повод, ради которого стоило собраться', type: 'main' }
    ]
  },
  {
    text: 'Как ты обычно принимаешь решения?',
    options: [
      { t: 'Интуиция и «а почему бы и нет»', type: 'chaos' },
      { t: 'Взвешенно, не торопясь', type: 'comfort' },
      { t: 'Уверенно — и почти всегда права', type: 'main' }
    ]
  },
  {
    text: 'Что ты делаешь, если планы срываются в последний момент?',
    options: [
      { t: 'Придумываю новый план на ходу, часто лучше первого', type: 'chaos' },
      { t: 'Спокойно перехожу на запасной вариант', type: 'comfort' },
      { t: 'Превращаю случайность в повод собрать всех у себя', type: 'main' }
    ]
  },
  {
    text: 'Идеальный первый шаг в новом деле?',
    options: [
      { t: 'Просто начинаю, разберусь по пути', type: 'chaos' },
      { t: 'Сначала изучаю, потом действую', type: 'comfort' },
      { t: 'Сразу продумываю, как сделать это запоминающимся', type: 'main' }
    ]
  },
  {
    text: 'Что говорят о тебе друзья за спиной (в хорошем смысле)?',
    options: [
      { t: 'С ней никогда не бывает скучно', type: 'chaos' },
      { t: 'С ней реально легко', type: 'comfort' },
      { t: 'Она как будто всегда в центре кадра', type: 'main' }
    ]
  },
  {
    text: 'Твоя реакция на комплимент?',
    options: [
      { t: 'Шучу в ответ и сразу меняю тему', type: 'chaos' },
      { t: 'Искренне благодарю', type: 'comfort' },
      { t: 'Соглашаюсь — а что, разве не так?', type: 'main' }
    ]
  },
  {
    text: 'Лучший вечер пятницы — это...',
    options: [
      { t: 'Что-то неожиданное, куда позвали за час до начала', type: 'chaos' },
      { t: 'Тихий вечер по своему сценарию', type: 'comfort' },
      { t: 'Вечер, где все ждали именно твоего появления', type: 'main' }
    ]
  }
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const personas = {
  chaos: {
    name: 'Chaos-Turbo',
    tagline: 'непредсказуемая, но всегда к месту',
    stats: [
      { label: 'спонтанность', value: 96 },
      { label: 'точность шуток', value: 91 },
      { label: 'скука рядом с тобой', value: 2 }
    ],
    text: 'Модель с непредсказуемым, но обаятельным поведением. Лучшие решения выдаёт именно тогда, когда их не ждут. Побочный эффект использования — вокруг становится веселее.'
  },
  comfort: {
    name: 'Comfort-Core',
    tagline: 'рядом с тобой мир как будто сбавляет скорость',
    stats: [
      { label: 'спокойствие', value: 94 },
      { label: 'эмпатия', value: 97 },
      { label: 'лишний шум', value: 3 }
    ],
    text: 'Редкая модель, рядом с которой действительно легко. Хорошо слушает, честно отвечает, не создаёт драмы там, где её быть не должно. Рекомендуется для долгосрочного использования.'
  },
  main: {
    name: 'Main-Character Pro',
    tagline: 'заходит в комнату — комната замечает',
    stats: [
      { label: 'харизма', value: 98 },
      { label: 'уверенность', value: 99 },
      { label: 'попытки остаться незамеченной', value: 1 }
    ],
    text: 'Модель, оптимизированная под то, чтобы её замечали — и вполне заслуженно. Яркая, уверенная, держит внимание без особых усилий со своей стороны.'
  }
};

const analyzingLines = [
  'считываю паттерны ответов…',
  'сопоставляю с базой моделей…',
  'калибрую параметры…',
  'готово.'
];

export async function render(container) {
  const content = mountStationShell(container, 'neuroset');

  content.innerHTML = `
    <div class="mono" style="margin-bottom:8px; color:var(--teal);">◆ станция 4 · анализ личности</div>
    <div id="ns-body"></div>
  `;
  const body = content.querySelector('#ns-body');

  let current = 0;
  let activeQuestions = [];
  const scores = { chaos: 0, comfort: 0, main: 0 };

  function showStart() {
    body.innerHTML = `
      <h1>Какая ты нейросеть?</h1>
      <p style="color:var(--ink-soft);">Пять вопросов из случайной подборки. Никакой реальной нейросети внутри — только наблюдения и немного лести. Погнали?</p>
      <button id="btn-start">Начать</button>
      <div class="mono" style="margin-top:22px;">~40 секунд</div>
    `;
    body.querySelector('#btn-start').addEventListener('click', () => {
      current = 0;
      activeQuestions = shuffle(QUESTION_POOL).slice(0, 5);
      scores.chaos = 0; scores.comfort = 0; scores.main = 0;
      renderQuestion();
    });
  }

  function renderQuestion() {
    const q = activeQuestions[current];
    body.innerHTML = `
      <div class="progress-row">
        <div class="progress-track"><div class="progress-fill" style="width:${(current / activeQuestions.length) * 100}%"></div></div>
        <div class="mono">${current + 1} / ${activeQuestions.length}</div>
      </div>
      <h2>${q.text}</h2>
      <div id="q-options"></div>
    `;
    const wrap = body.querySelector('#q-options');
    q.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'option';
      btn.textContent = opt.t;
      btn.addEventListener('click', () => selectOption(btn, opt.type));
      wrap.appendChild(btn);
    });
  }

  function selectOption(btn, type) {
    body.querySelectorAll('.option').forEach((o) => { o.disabled = true; });
    btn.classList.add('picked');
    scores[type]++;

    setTimeout(() => {
      current++;
      if (current < activeQuestions.length) {
        renderQuestion();
      } else {
        runAnalyzing();
      }
    }, 260);
  }

  function runAnalyzing() {
    body.innerHTML = `
      <div style="text-align:center; padding-top:40px;">
        <div class="spin"></div>
        <div class="analyzing-lines" id="analyzing-lines"></div>
      </div>
    `;
    const el = body.querySelector('#analyzing-lines');
    analyzingLines.forEach((line, i) => {
      const div = document.createElement('div');
      div.textContent = line;
      div.style.animationDelay = (i * 0.38) + 's';
      el.appendChild(div);
    });
    setTimeout(showResult, analyzingLines.length * 380 + 500);
  }

  function pickPersona() {
    const order = ['chaos', 'comfort', 'main'];
    let best = order[0];
    order.forEach((k) => { if (scores[k] > scores[best]) best = k; });
    return best;
  }

  async function showResult() {
    const key = pickPersona();
    const p = personas[key];

    let playerName = FALLBACK_NAME;
    let photoUrl = null;
    try {
      const playId = getPlayId();
      if (playId) {
        const data = await api.getPlay(playId);
        if (data.play) {
          if (data.play.name) playerName = data.play.name;
          if (data.play.photo_path) photoUrl = data.play.photo_path;
        }
      }
    } catch (_) { /* best-effort */ }

    body.innerHTML = `
      <div class="card">
        <div class="card-eyebrow">результат</div>
        ${photoUrl ? `<img src="${photoUrl}" alt="${playerName}" style="width:72px; height:72px; border-radius:50%; object-fit:cover; border:2px solid var(--teal); box-shadow:0 0 16px -2px var(--teal); margin-bottom:14px;" />` : ''}
        <div class="card-title">${playerName} — ${p.name}</div>
        <div class="card-tagline">${p.tagline}</div>
        <div id="card-stats"></div>
        <p class="card-text">${p.text}</p>
      </div>
      <button id="continue-btn" style="margin-top:20px;">К карте маршрута</button>
    `;

    const statsWrap = body.querySelector('#card-stats');
    p.stats.forEach((s) => {
      const row = document.createElement('div');
      row.className = 'stat';
      row.innerHTML =
        `<div class="stat-row"><span>${s.label}</span><span>${s.value}</span></div>` +
        `<div class="stat-track"><div class="stat-fill" style="width:0%"></div></div>`;
      statsWrap.appendChild(row);
      const fill = row.querySelector('.stat-fill');
      requestAnimationFrame(() => { fill.style.width = Math.min(s.value, 100) + '%'; });
    });

    try {
      const playId = await ensurePlay();
      await api.saveStation(playId, 'neuroset', { persona: key, name: p.name, tagline: p.tagline });
    } catch (_) { /* best-effort */ }

    body.querySelector('#continue-btn').addEventListener('click', () => {
      location.hash = '#/map';
    });
  }

  showStart();

  return () => {};
}
