dev: 
	yarn dev

start:
	docker compose up -d --wait postgres redis
	yarn migration:run
	docker compose up -d --build api
	docker compose logs -f api

# Sobe os containers (banco + app) em background
up:
	docker compose up -d

# Derruba os containers
down:
	docker compose down

# Sobe o banco e roda as migrations de uma vez
# Útil para começar a desenvolver do zero
setup:
	docker compose up -d postgres
	@echo "Aguardando banco ficar pronto..."
	@until docker compose exec postgres pg_isready -U postgres -q 2>/dev/null; do sleep 1; done
	yarn migration:run

# Rebuilda a imagem e sobe tudo
up-build:
	docker compose up -d --build

# Gera uma migration baseada nas diferenças entre entities e o banco
# Uso: make migration-generate name=NomeDaMigration
migration-generate:
	yarn migration:generate src/infra/database/migrations/$(name)

# Executa as migrations pendentes no banco
migration-run:
	yarn migration:run

# Reverte a última migration executada
migration-revert:
	yarn migration:revert