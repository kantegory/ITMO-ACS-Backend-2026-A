.PHONY: test build vet check up down logs

test:
	go test ./...

build:
	go build ./...

vet:
	go vet ./...

check: test build vet

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f app
