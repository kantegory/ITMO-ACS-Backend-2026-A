FROM golang:1.25-alpine AS builder

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/catalog-service ./cmd/catalog-service

FROM alpine:3.20

WORKDIR /app
COPY --from=builder /bin/catalog-service /app/catalog-service
EXPOSE 8082
ENTRYPOINT ["/app/catalog-service"]
