FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
COPY internal ./internal
COPY cmd ./cmd

ARG SERVICE
RUN go build -o /service ./cmd/${SERVICE}

FROM alpine:3.20

WORKDIR /app
COPY --from=builder /service /service

ENTRYPOINT ["/service"]
