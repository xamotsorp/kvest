# Станции

Мини-игровой сайт-сюрприз в футуристичном стиле: PIN → регистрация (имя + фото) → карта маршрута со свободным выбором порядка → 6 станций → итог → админка с результатами. Фото, загруженное при регистрации, используется в станциях «Собери момент» и «Какая ты нейросеть».

## Запуск (локально)

```bash
cp .env.example .env
# отредактируй .env: PIN, ADMIN_PASSWORD, SESSION_SECRET
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Сайт откроется на `http://localhost` (или `http://<IP-машины>` с телефона в той же сети).

`docker-compose.dev.yml` подменяет nginx-конфиг на `nginx.local.conf` (обычный HTTP, без домена и TLS). Базовый `docker-compose.yml` сам по себе — продовый конфиг под `kvest.xamotsorp.space` с HTTPS через certbot; на сервере просто `docker compose up -d --build`, без `-f`.

## Музыка

mp3 по станциям — в `media/audio/`, имена файлов см. в `media/audio/README.md`. Без файлов сайт просто работает без звука — файлы подхватываются на лету, пересобирать контейнеры не нужно.

Фото для паззла/нейросети отдельно класть не нужно — оно приходит из формы регистрации и хранится в `media/uploads/` (создаётся автоматически, в git не попадает).

## Админка

`http://localhost/#/admin` — вход по паролю из `ADMIN_PASSWORD`, показывает все прохождения и результаты по станциям.

## Структура

- `frontend/` — vanilla JS SPA (hash-роутинг, без сборки)
- `backend/` — Express API (PIN, сохранение прогресса, admin)
- `db/init.sql` — схема Postgres
- `docker-compose.yml` + `nginx.conf` — прод (HTTPS, certbot)
- `docker-compose.dev.yml` + `nginx.local.conf` — локальный оверрайд (обычный HTTP)

## Безопасность

- `/api/pin` и `/api/admin/login` — rate limit 5 попыток / 15 минут на IP (`express-rate-limit`)
- HTTPS-only в проде, security-заголовки (HSTS, X-Frame-Options и т.п.) в `nginx.conf`
- Куки `httpOnly` + `secure` (в проде, см. `COOKIE_SECURE` в `.env`) + подписаны `SESSION_SECRET`

## Что ещё доделать

- Реальная музыка по станциям (см. выше)
