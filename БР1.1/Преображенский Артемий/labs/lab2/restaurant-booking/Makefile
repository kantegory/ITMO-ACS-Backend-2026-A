SHELL := /bin/sh -eu

COMPOSE := docker compose --env-file .env -f deploy/docker-compose.yml
SERVICE ?= auth-service
DB_USER ?= postgres

.DEFAULT_GOAL := build

.PHONY: build clean up down restart logs shell test deps fmt fmt-check vet lint check psql-auth psql-catalog psql-booking

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

restart:
	$(COMPOSE) restart $(SERVICE)

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

psql-auth:
	$(COMPOSE) exec auth-db psql -U $(DB_USER) -d auth_db

psql-catalog:
	$(COMPOSE) exec catalog-db psql -U $(DB_USER) -d catalog_db

psql-booking:
	$(COMPOSE) exec booking-db psql -U $(DB_USER) -d booking_db
