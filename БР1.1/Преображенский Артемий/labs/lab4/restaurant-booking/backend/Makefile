SHELL := /bin/sh -eu

COMPOSE := docker compose --env-file .env -f deploy/docker-compose.dev.yml
SERVICE ?= auth-service

.DEFAULT_GOAL := build

.PHONY: build clean up down down-volumes restart logs logs-auth logs-catalog logs-booking shell test deps fmt fmt-check vet lint check psql-auth psql-catalog psql-booking

build:
	mkdir -p bin
	go build -o bin/auth-service ./auth-service/cmd/auth-service
	go build -o bin/catalog-service ./catalog-service/cmd/catalog-service
	go build -o bin/booking-service ./booking-service/cmd/booking-service

clean:
	rm -rf bin
	go clean -cache

up:
	$(COMPOSE) up --build -d

down:
	$(COMPOSE) down

down-volumes:
	$(COMPOSE) down -v

restart:
	$(COMPOSE) restart $(SERVICE)

logs-auth:
	$(COMPOSE) logs -f auth-service

logs-catalog:
	$(COMPOSE) logs -f catalog-service

logs-booking:
	$(COMPOSE) logs -f booking-service

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

psql-auth:
	$(COMPOSE) exec auth-db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

psql-catalog:
	$(COMPOSE) exec catalog-db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

psql-booking:
	$(COMPOSE) exec booking-db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'
