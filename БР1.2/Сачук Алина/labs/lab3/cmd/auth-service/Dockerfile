FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod ./
COPY internal ./internal
COPY cmd/auth-service ./cmd/auth-service
RUN go build -o /service ./cmd/auth-service

FROM alpine:3.20
WORKDIR /app
COPY --from=builder /service /service
EXPOSE 8081
ENTRYPOINT ["/service"]
