# RecipeHub lab1 — локальный запуск и Docker (Compose v2+).
# Требования: Go 1.23+ и PostgreSQL (см. DATABASE_URL в .env).

.DEFAULT_GOAL := help

.PHONY: help run tidy vet build verify sync-openapi \
	docker-build docker-db docker-up docker-down docker-down-v docker-logs docker-ps docker-restart docker-dev

help: ## Список целей
	@echo RecipeHub Makefile
	@echo ==================
	@echo ''
	@echo 'Локально:'
	@echo '  make run            — go run (нужен Postgres, см. DATABASE_URL)'
	@echo '  make verify         — go vet + go build в bin/'
	@echo '  make sync-openapi   — unix: cp openapi из ../homeworks/hw2'
	@echo ''
	@echo 'Docker:'
	@echo '  make docker-db      — только Postgres (для make run на хосте)'
	@echo '  make docker-dev     — build + up -d (db + api)'
	@echo '  make docker-down-v  — down и удалить том PostgreSQL'
	@echo ''
	@echo Подсказка: curl http://localhost:8080/healthz  ·  Swagger: /swagger/

run: ## Запуск без Docker
	go run ./cmd/gateway

tidy: ## go mod tidy
	go mod tidy

vet: ## go vet ./...
	go vet ./...

build: ## Сборка bin/recipehub
	@mkdir -p bin
	go build -trimpath -ldflags="-s -w" -o bin/recipehub$(EXE) ./cmd/gateway

verify: vet build ## go vet и сборка бинарника

sync-openapi: ## Обновить docs/openapi.yaml из ДЗ2
	cp "../homeworks/hw2/docs/openapi.yaml" "./docs/openapi.yaml"

docker-build: ## docker compose build
	docker compose build

docker-db: ## Только сервис Postgres (порт 5432 → хост)
	docker compose up -d db

docker-up: ## docker compose up -d
	docker compose up -d

docker-down: ## Остановить контейнеры (том БД сохраняется)
	docker compose down

docker-down-v: ## Остановить и удалить том с данными Postgres
	docker compose down -v

docker-logs: ## Логи api
	docker compose logs -f gateway

docker-ps: ## Статус
	docker compose ps

docker-restart: ## Перезапуск api
	docker compose restart gateway

docker-dev: docker-build docker-up ## Сборка и фоновый запуск
	@echo ''
	@echo Готово. Проверка: curl -s http://localhost:8080/healthz
	@echo Порт — RECIPEHUB_PORT в .env

ifeq ($(OS),Windows_NT)
EXE := .exe
else
EXE :=
endif
