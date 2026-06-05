# RecipeHub lab3 - containerized microservices with Docker Compose v2+.

.DEFAULT_GOAL := help

COMPOSE := docker compose -f docker-compose.yml

.PHONY: help tidy vet test build verify docker-build docker-up docker-down docker-logs docker-ps docker-dev

help: ## Show available targets
	@echo RecipeHub lab3 Makefile
	@echo =======================
	@echo ''
	@echo 'Local checks:'
	@echo '  make verify       - go test ./... and build all service binaries'
	@echo ''
	@echo 'Docker:'
	@echo '  make docker-build - build all service images'
	@echo '  make docker-up    - start the whole stack'
	@echo '  make docker-down  - stop containers'
	@echo '  make docker-logs  - follow stack logs'
	@echo '  make docker-ps    - show stack status'
	@echo ''
	@echo 'Gateway: http://localhost:8080/healthz'

tidy: ## Run go mod tidy
	go mod tidy

vet: ## Run go vet ./...
	go vet ./...

test: ## Run go test ./...
	go test ./...

build: ## Build all service binaries into bin/
	@mkdir -p bin
	go build -trimpath -ldflags="-s -w" -o bin/gateway$(EXE) ./cmd/gateway
	go build -trimpath -ldflags="-s -w" -o bin/identity-service$(EXE) ./cmd/identity-service
	go build -trimpath -ldflags="-s -w" -o bin/catalog-service$(EXE) ./cmd/catalog-service
	go build -trimpath -ldflags="-s -w" -o bin/recipe-service$(EXE) ./cmd/recipe-service
	go build -trimpath -ldflags="-s -w" -o bin/blog-service$(EXE) ./cmd/blog-service
	go build -trimpath -ldflags="-s -w" -o bin/engagement-service$(EXE) ./cmd/engagement-service

verify: test build ## Run tests and build all services

docker-build: ## Build Docker images
	$(COMPOSE) build

docker-up: ## Start the whole stack
	$(COMPOSE) up -d

docker-down: ## Stop containers and keep volumes
	$(COMPOSE) down

docker-logs: ## Follow stack logs
	$(COMPOSE) logs -f

docker-ps: ## Show stack status
	$(COMPOSE) ps

docker-dev: docker-build docker-up ## Build and start the stack
	@echo ''
	@echo 'Ready. Check: curl -s http://localhost:8080/healthz'

ifeq ($(OS),Windows_NT)
EXE := .exe
else
EXE :=
endif
