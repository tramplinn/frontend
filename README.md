# Tramplin Frontend

Клиентская часть учебной платформы Tramplin: каталог курсов, прохождение уроков и
тестов, прогресс студента, преподавательский редактор и административные экраны.

## Возможности

- публичный каталог треков, курсов и модулей;
- просмотр Markdown-уроков, кода и interview-карточек;
- прохождение тестов всех поддерживаемых типов;
- drag-and-drop и click fallback для сопоставления и группировки;
- загрузка файлов преподавателем и файловый ответ студента;
- прогресс по урокам, тестам и курсам;
- GitHub OAuth без хранения access-токена в localStorage;
- редакторы контента для teacher/admin;
- управление пользователями и группами для admin;
- потоковый ассистент урока;
- светлая и тёмная темы.

## Стек

- Vue 3 с `<script setup>`;
- TypeScript strict и Vite;
- Vue Router и Pinia;
- Reka UI для доступных UI-примитивов;
- Zod для runtime-проверки API-контрактов;
- Vitest, ESLint, vue-tsc и Prettier.

## Требования

- Node.js 22 или новее;
- pnpm через Corepack;
- запущенный Tramplin Backend на `http://localhost:8000`.

Версия Node зафиксирована полем `engines` в `package.json`, зависимости —
`pnpm-lock.yaml`.

## Быстрый старт

Создайте локальную конфигурацию и установите зависимости:

```bash
cp .env.example .env
corepack enable
pnpm install --frozen-lockfile
```

Запустите dev-сервер:

```bash
pnpm dev
```

Приложение откроется на `http://localhost:5173`.

Vite проксирует `/api/*` на `BACKEND_ORIGIN`, поэтому frontend и API для браузера
работают через один origin. Это важно для refresh-cookie и позволяет не добавлять
отдельные CORS-исключения в локальной разработке.

## Команды

| Команда             | Назначение                                   |
| ------------------- | -------------------------------------------- |
| `pnpm dev`          | запустить Vite dev server                    |
| `pnpm build`        | проверить типы и собрать production bundle   |
| `pnpm preview`      | локально открыть собранный bundle            |
| `pnpm typecheck`    | запустить vue-tsc без сборки                 |
| `pnpm lint`         | проверить ESLint                             |
| `pnpm lint:fix`     | исправить поддерживаемые ESLint-ошибки       |
| `pnpm format`       | отформатировать `src` через Prettier         |
| `pnpm format:check` | проверить форматирование                     |
| `pnpm test`         | однократно запустить Vitest                  |
| `pnpm test:watch`   | перезапускать связанные тесты при изменениях |

Перед передачей изменений запускайте:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Конфигурация

| Переменная             | Назначение                               | Значение по умолчанию   |
| ---------------------- | ---------------------------------------- | ----------------------- |
| `BACKEND_ORIGIN`       | адрес backend для dev-proxy Vite         | `http://localhost:8000` |
| `VITE_API_BASE_URL`    | базовый URL API в браузере               | `/api/v1`               |
| `API_UPSTREAM`         | адрес backend в общей Docker-сети       | обязательная            |
| `EDGE_NETWORK`         | внешняя сеть frontend, backend и proxy  | `tramplin-edge`         |
| `WEB_NETWORK_ALIAS`    | DNS-имя frontend в общей Docker-сети    | `tramplin-web`          |
| `WEB_BIND_HOST`        | интерфейс опубликованного frontend-порта | `127.0.0.1`             |
| `WEB_PORT`             | опубликованный порт frontend-контейнера | `8080`                  |
| `CLIENT_MAX_BODY_SIZE` | лимит тела запроса в production Nginx   | `12m`                   |

`BACKEND_ORIGIN` используется только конфигурацией Vite. Переменные с префиксом
`VITE_` встраиваются в клиентский bundle и не должны содержать секретов.

Runtime-переменные читаются контейнером при запуске и не попадают в browser
bundle. Для production задайте `API_UPSTREAM=http://tramplin-prod-api:8000`, для
stage — `API_UPSTREAM=http://tramplin-staging-api:8000`. Внешняя сеть
`tramplin-edge` должна быть создана до запуска compose. Лимит Nginx оставлен
немного выше backend-лимита файлов 10 МБ, чтобы валидированный ответ возвращало
приложение, а не reverse proxy.

В production рекомендуется оставить относительный `VITE_API_BASE_URL=/api/v1` и
разместить frontend и backend за одним reverse proxy.

## Архитектура

```text
src/
  api/
    schemas/       Zod-схемы и выведенные из них TypeScript-типы
    client.ts      fetch, access/refresh и нормализация ошибок
    *.ts           запросы по доменным областям
  components/
    ui/            переиспользуемые UI-примитивы
    layout/        каркас приложения
    course/        граф и навигация курса
    lesson/        отображение материалов урока
    quiz/          прохождение теста
    manage/        общие части редакторов
  features/
    content/       модель и сценарии управления контентом
    quiz-editor/   черновик и сериализация редактора теста
    quiz-runner/   логика интерактивных ответов
  composables/     переиспользуемое Vue-состояние и эффекты
  stores/          Pinia stores с состоянием приложения
  views/           страницы и role-specific экраны
  router/          маршруты и guards
  styles/          tokens, базовые стили, prose и controls
  lib/             небольшая framework-independent логика
```

Поток данных:

```text
View/Component → feature/store → api function → request() → Backend
                                              ↓
                                      Zod schema parse
```

Компонент не должен самостоятельно разбирать произвольный ответ API. Все ответы
проходят через Zod-схему; нарушение контракта превращается в `ContractError`.
Сетевые ошибки и доменные API-ошибки представлены отдельными типами.

## API-клиент и аутентификация

`src/api/client.ts` — единая точка HTTP-доступа:

- добавляет Bearer access-токен;
- заранее обновляет истекающий токен;
- объединяет параллельные refresh-запросы;
- один раз повторяет запрос после 401;
- преобразует snake_case ответа в camelCase;
- проверяет JSON через переданную Zod-схему;
- поддерживает бинарную загрузку и потоковые ответы.

Access-токен хранится только в памяти вкладки. Refresh-токен находится в httpOnly
cookie и недоступен JavaScript. После перезагрузки `auth` store восстанавливает
сессию через `/auth/refresh`.

Router guards скрывают страницы по ролям, но не являются границей безопасности:
backend повторно авторизует каждый защищённый запрос.

## Основные маршруты

| Маршрут                         | Доступ                 |
| ------------------------------- | ---------------------- |
| `/`, `/sections`, `/courses/*`  | публичный контент      |
| `/courses/*/lessons/*`          | урок                   |
| `/courses/*/quizzes/*`          | авторизованный студент |
| `/me`                           | профиль и прогресс     |
| `/manage/*`                     | teacher/admin          |
| `/admin/users`, `/admin/groups` | admin                  |

Страницы загружаются лениво через dynamic import.

## Тесты

Vitest находит файлы `*.spec.ts` в `src`. Текущий набор в основном состоит из
быстрых unit- и contract-тестов:

- преобразование и сортировка дерева контента;
- граф зависимостей и pan/zoom;
- slug, plural и тема;
- сериализация всех типов quiz-вопросов;
- сопоставление, группировка и формат отправляемого ответа;
- Zod-контракты вопросов и файлов;
- разбор Server-Sent Events.

```bash
pnpm test
pnpm test:watch
```

Unit-тесты не заменяют браузерные проверки drag-and-drop, загрузки файла и полного
OAuth flow. Для таких сценариев следующим уровнем должны стать component-тесты с
Vue Test Utils и E2E-тесты в Playwright.

## Правила разработки

- API-типы выводятся из Zod через `z.infer`, параллельные ручные интерфейсы не создаются.
- API-модули принимают и возвращают доменные данные, а не `Response`.
- Бизнес-логика, которую можно проверить без DOM, выносится из `.vue` в `features` или `lib`.
- Компоненты из `components/ui` не зависят от конкретной страницы.
- Авторизация проверяется backend; router guard отвечает только за UX.
- Новый экран подключается лениво и обрабатывает loading, empty и error states.
- Секреты нельзя помещать в `VITE_*` переменные.

## Production build

```bash
pnpm build
```

Результат создаётся в `dist/`. Reverse proxy должен:

- раздавать статические файлы;
- направлять `/api/v1/*` в Tramplin Backend;
- возвращать `index.html` для неизвестных frontend-маршрутов;
- не буферизовать SSE endpoint ассистента;
- использовать HTTPS, чтобы production refresh-cookie передавалась безопасно.

## CI

Стадия DAST называется `scan`, а не `dast`. Пайплайн со стадией `dast` в этом
namespace не проходит валидацию: GitLab отвечает `Insufficient permissions for
dast_configuration keyword` и не ставит в очередь ни одной джобы, включая линт.
DAST у GitLab это возможность тарифа Ultimate, а namespace на Free, поэтому
починить причину нельзя — ни страницы Policies, ни профилей сканирования на этом
тарифе нет. Своего DAST это не касается: `nuclei-scan` как ходил по стенду после
деплоя, так и ходит.
