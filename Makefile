PNPM = pnpm

.PHONY: install lint format typecheck test build check run e2e

install:
	$(PNPM) install --frozen-lockfile

lint:
	$(PNPM) lint
	$(PNPM) format:check

format:
	$(PNPM) format

typecheck:
	$(PNPM) typecheck

test:
	$(PNPM) test

build:
	$(PNPM) build

# Локальный эквивалент quality job из .gitlab-ci.yml.
check: lint test build

run:
	$(PNPM) dev

# Smoke-обход страниц в браузере против живого стенда (нужен бэкенд с сидами),
# поэтому не входит в check. Закрытые страницы — с E2E_REFRESH_TOKEN, его выдаёт
# backend: uv run python scripts/issue_refresh_token.py <login>.
e2e:
	$(PNPM) e2e
