FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod ./
COPY internal ./internal
COPY cmd/social-service ./cmd/social-service
RUN go build -o /service ./cmd/social-service

FROM alpine:3.20
WORKDIR /app
COPY --from=builder /service /service
EXPOSE 8083
ENTRYPOINT ["/service"]
