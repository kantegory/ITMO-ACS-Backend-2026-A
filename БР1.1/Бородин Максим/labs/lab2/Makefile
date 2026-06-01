SERVICES := api-gateway auth-service restaurant-service booking-service notification-service

.PHONY: test build vet check up down logs $(SERVICES)

test:
	@for service in $(SERVICES); do \
		echo "==> $$service: go test ./..."; \
		(cd $$service && go test ./...); \
	done

build:
	@for service in $(SERVICES); do \
		echo "==> $$service: go build ./..."; \
		(cd $$service && go build ./...); \
	done

vet:
	@for service in $(SERVICES); do \
		echo "==> $$service: go vet ./..."; \
		(cd $$service && go vet ./...); \
	done

check: test build vet

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f
