# Tramplin Frontend

The platform's web app: catalog, lessons, quizzes, progress, profile, authoring,
and algorithm practice.

Stack: Vue 3, TypeScript, Vite, Pinia, Vue Router, Reka UI, Vitest, ESLint, Prettier.

## Quick start

You need Node.js 22+ and pnpm (via Corepack).

```bash
cp .env.dev.example .env
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:5173`. Vite proxies `/api` to `BACKEND_ORIGIN`
(`http://localhost:8000` by default).

### With Docker

Nginx serves the built app and proxies `/api` to the backend. You need the
`tramplin-edge` network from `infra`:

```bash
cp .env.example .env
docker compose up -d --build --wait
```

## Commands

```bash
pnpm dev           # dev server
pnpm lint          # ESLint
pnpm format:check  # Prettier
pnpm typecheck     # TypeScript/Vue
pnpm test          # Vitest
pnpm build         # production build
pnpm preview       # preview the build
```

## Structure

```text
src/
  api/          HTTP client, contracts, SSE
  components/   shared UI components
  composables/  Vue composables
  features/     editors, quizzes, and other features
  router/       routes and guards
  stores/       Pinia stores
  styles/       styles and design tokens
  views/        pages
```

The access token lives in memory; the backend manages the refresh cookie.

Main routes: `/`, `/sections`, `/courses`, `/courses/:course` with nested
lesson/quiz/practice pages, `/me`, `/manage/*`, `/admin/users`.
