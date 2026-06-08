FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod ./
COPY internal ./internal
COPY cmd/recipe-service ./cmd/recipe-service
RUN go build -o /service ./cmd/recipe-service

FROM alpine:3.20
WORKDIR /app
COPY --from=builder /service /service
EXPOSE 8082
ENTRYPOINT ["/service"]
