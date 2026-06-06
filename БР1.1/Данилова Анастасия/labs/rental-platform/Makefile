.PHONY: tidy build test docker-up docker-down docker-build

tidy:
	cd shared && go mod tidy
	cd services/auth-service && go mod tidy
	cd services/property-service && go mod tidy
	cd services/rental-service && go mod tidy
	cd services/chat-service && go mod tidy

build:
	cd services/auth-service && go build -o ../../bin/auth-service ./cmd
	cd services/property-service && go build -o ../../bin/property-service ./cmd
	cd services/rental-service && go build -o ../../bin/rental-service ./cmd
	cd services/chat-service && go build -o ../../bin/chat-service ./cmd

test:
	go work sync
	cd services/auth-service && go test ./...
	cd services/property-service && go test ./...
	cd services/rental-service && go test ./...
	cd services/chat-service && go test ./...

docker-build:
	docker compose -f deploy/docker-compose.yml build

docker-build auth-service:
	docker compose -f deploy/docker-compose.yml up -d --build auth-service

docker-build property-service:
	docker compose -f deploy/docker-compose.yml up -d --build property-service

docker-build chat-service:
	docker compose -f deploy/docker-compose.yml up -d --build chat-service

docker-build rental-service:
	docker compose -f deploy/docker-compose.yml up -d --build rental-service

docker-up:
	docker compose -f deploy/docker-compose.yml up -d --build

docker-reset:
	docker compose -f deploy/docker-compose.yml down -v --remove-orphans
	docker compose -f deploy/docker-compose.yml up -d --build --remove-orphans

docker-down:
	docker compose -f deploy/docker-compose.yml down

docker-logs:
	docker compose -f deploy/docker-compose.yml logs -f
