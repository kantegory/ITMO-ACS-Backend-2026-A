# сборка всегда на платформе сборщика, Go кросс-компилирует под целевую
# (например, на Mac arm64 → сервер linux/amd64 без эмуляции)
FROM --platform=$BUILDPLATFORM golang:1.25-alpine AS builder

ARG TARGETOS=linux
ARG TARGETARCH
ENV GOTOOLCHAIN=local

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -trimpath -ldflags="-s -w" -o /app ./src/service

FROM alpine:3.20

# ca-certificates — для HTTPS до Sentry, tzdata — корректное время в логах
RUN apk add --no-cache ca-certificates tzdata \
    && adduser -D -H -u 10001 app

WORKDIR /app

COPY --from=builder /app ./server

USER app

EXPOSE 8083 9083

CMD ["./server"]
