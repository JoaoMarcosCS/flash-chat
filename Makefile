SHELL := /bin/bash
.SHELLFLAGS := -o pipefail -c

export FORCE_COLOR := 1

NODE := source $${NVM_DIR:-$$HOME/.nvm}/nvm.sh >/dev/null && nvm use >/dev/null &&

.PHONY: dev deploy db migrate seed infra services traefik logs front down

dev: services
	@$(MAKE) --no-print-directory -j2 logs front

deploy: traefik
	@$(MAKE) --no-print-directory logs

db:
	cd backend && docker compose up -d --wait postgres

migrate: db
	cd backend && $(NODE) yarn --silent migration:run

seed: migrate
	cd backend && $(NODE) yarn --silent seed

infra: seed
	cd backend && docker compose up -d --wait redis rabbitmq

services: infra
	cd backend && docker compose up -d --build --wait api ws persist-consumer

traefik: services
	cd backend && docker compose up -d --wait traefik

logs:
	@cd backend && docker compose logs -f api ws persist-consumer

front:
	@cd frontend && $(NODE) yarn dev 2>&1 | sed -u 's/^/[front]    /'

down:
	cd backend && docker compose down
