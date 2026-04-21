SHELL := /bin/sh -eu

COMPOSE := docker-compose --env-file .env -f deploy/docker-compose.dev.yml
SERVICE ?= app
DB_USER ?= postgres
DB_NAME ?= restaurant_booking

.DEFAULT_GOAL := build

.PHONY: build clean up down restart docker-build logs shell test deps fmt fmt-check vet lint check refresh migrate-up migrate-down psql db-reset

build:
	mkdir -p bin
	go build -o bin/api ./cmd/api

clean:
	rm -rf bin
	go clean -cache

up:
	$(COMPOSE) up --build -d

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart $(SERVICE)

docker-build:
	$(COMPOSE) build

logs:
	$(COMPOSE) logs -f $(SERVICE)

shell:
	$(COMPOSE) exec $(SERVICE) sh

test:
	go test ./...

deps:
	go mod download
	go mod tidy

fmt:
	gofmt -w .

fmt-check:
	test -z $$(gofmt -l .)

vet:
	go vet ./...

lint: fmt-check vet

check: lint test

refresh:
	$(COMPOSE) down
	$(COMPOSE) up -d --build

migrate-up:
	$(COMPOSE) up -d db
	$(COMPOSE) exec -T db psql -U $(DB_USER) -d $(DB_NAME) -v ON_ERROR_STOP=1 -f /migrations/000001_init.up.sql

migrate-down:
	$(COMPOSE) up -d db
	$(COMPOSE) exec -T db psql -U $(DB_USER) -d $(DB_NAME) -v ON_ERROR_STOP=1 -f /migrations/000001_init.down.sql

psql:
	$(COMPOSE) up -d db
	$(COMPOSE) exec db psql -U $(DB_USER) -d $(DB_NAME)

db-reset: migrate-down migrate-up
