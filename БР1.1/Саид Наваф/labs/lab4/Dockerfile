
FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o api ./cmd/api


FROM debian:bookworm-slim


RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app


COPY --from=builder /app/api .

COPY --from=builder /app/internal/db/migrations/ ./migrations/

EXPOSE 8080

CMD ["./api"]