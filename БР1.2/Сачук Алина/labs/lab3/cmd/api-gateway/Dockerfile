FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod ./
COPY internal ./internal
COPY cmd/api-gateway ./cmd/api-gateway
RUN go build -o /service ./cmd/api-gateway

FROM alpine:3.20
WORKDIR /app
COPY --from=builder /service /service
EXPOSE 8080
ENTRYPOINT ["/service"]
