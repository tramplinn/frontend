# Tramplin Frontend

Vue-приложение учебной платформы: каталог, уроки, тесты, прогресс, профиль,
authoring и практика алгоритмов.

Стек: Vue 3, TypeScript, Vite, Pinia, Vue Router, Reka UI, Vitest, ESLint и
Prettier.

## Быстрый старт

Нужны Node.js 22+ и pnpm через Corepack.

```bash
cp .env.dev.example .env
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Приложение откроется на `http://localhost:5173`. Vite проксирует `/api` в
`BACKEND_ORIGIN`, по умолчанию `http://localhost:8000`.

## Команды

```bash
pnpm dev           # Vite dev server
pnpm lint          # ESLint
pnpm format:check  # проверка Prettier
pnpm typecheck     # проверка TypeScript/Vue
pnpm test          # Vitest
pnpm build         # production bundle
pnpm preview       # просмотр собранного bundle
```

## Конфигурация

Для разработки используется [`.env.dev.example`](.env.dev.example):

- `BACKEND_ORIGIN` — адрес backend для Vite proxy;
- `VITE_API_BASE_URL` — браузерный API prefix.

Для контейнера используется [`.env.example`](.env.example):

- `API_UPSTREAM` — backend внутри Docker network;
- `WEB_NETWORK_ALIAS` — alias для Caddy в сети `tramplin-edge`;
- `CLIENT_MAX_BODY_SIZE` — лимит тела запроса в Nginx.

## Структура

```text
src/
  api/          HTTP-клиент, контракты и SSE
  components/   переиспользуемые UI-компоненты
  composables/  Vue composables
  features/     функциональные модули
  router/       маршруты и guards
  stores/       Pinia stores
  styles/       общие стили и design tokens
  views/        страницы
```

API-клиент находится в `src/api`, состояние — в `src/stores`, предметная логика
редакторов и тестов — в `src/features`. Access token хранится в памяти, refresh
cookie управляется backend.

Основные маршруты:

- `/`, `/sections`, `/courses`
- `/courses/:course` и вложенные lesson/quiz/practice routes
- `/me`, `/manage/*`, `/admin/users`

## Docker

Production image собирает Vite bundle и раздаёт его через Nginx. Nginx также
проксирует `/api` в backend и сохраняет потоковую передачу SSE.

```bash
cp .env.example .env
docker compose up -d --build --wait
```

Compose использует внешнюю сеть `tramplin-edge`; её и Caddy поднимает соседний
репозиторий `infra`.

## CI/CD

Pipeline выполняет quality/security checks, собирает и сканирует immutable image,
затем разворачивает его на stage или production и запускает Nuclei.

Нужные protected CI/CD variables:

- `SERVER_IP`, `SSH_PORT`, `SSH_USER`, `SSH_PRIVATE_KEY`
- `STAGE_ENV`, `PROD_ENV` типа File
- `STAGE_URL`, `PROD_URL`

Ветки `stage` и `main` используют отдельные Compose-проекты
`tramplin-frontend-stage` и `tramplin-frontend-prod`. При ошибке deploy job
печатает состояние и последние логи контейнера.
