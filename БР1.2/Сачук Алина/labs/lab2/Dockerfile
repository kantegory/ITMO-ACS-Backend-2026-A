FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod ./
COPY internal ./internal
COPY cmd ./cmd

ARG SERVICE
RUN go build -o /service ./cmd/${SERVICE}

FROM alpine:3.20

WORKDIR /app
COPY --from=builder /service /service

ENTRYPOINT ["/service"]
