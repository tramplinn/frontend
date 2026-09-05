PNPM = pnpm

.PHONY: install lint format typecheck test build check run

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
