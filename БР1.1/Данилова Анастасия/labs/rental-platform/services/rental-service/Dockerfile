FROM golang:1.23-alpine AS builder

WORKDIR /src

COPY shared ./shared
COPY services/rental-service ./services/rental-service

WORKDIR /src/services/rental-service

RUN go mod download

RUN CGO_ENABLED=0 GOOS=linux go build -o /rental-service ./cmd


FROM alpine:3.20
RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /rental-service .

EXPOSE 8083
CMD ["./rental-service"]