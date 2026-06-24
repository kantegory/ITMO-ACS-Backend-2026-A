FROM golang:1.25-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
COPY internal ./internal
COPY cmd/recipe-service ./cmd/recipe-service
RUN go build -o /service ./cmd/recipe-service

FROM alpine:3.20
WORKDIR /app
COPY --from=builder /service /service
EXPOSE 8082
ENTRYPOINT ["/service"]
