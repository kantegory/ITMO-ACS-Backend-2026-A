FROM golang:1.23-alpine AS builder

WORKDIR /src

COPY shared ./shared
COPY services/chat-service ./services/chat-service

WORKDIR /src/services/chat-service

RUN go mod download

RUN CGO_ENABLED=0 GOOS=linux go build -o /chat-service ./cmd


FROM alpine:3.20
RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /chat-service .

EXPOSE 8084
CMD ["./chat-service"]