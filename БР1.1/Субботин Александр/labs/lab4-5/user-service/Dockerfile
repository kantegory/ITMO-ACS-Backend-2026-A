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

# привязка пакета GHCR к репозиторию: без неё GITHUB_TOKEN может создать пакет,
# но не может перезаписать его при следующем деплое (permission_denied: write_package)
LABEL org.opencontainers.image.source="https://github.com/ZZISST/ITMO-ACS-Backend-2026-A" \
      org.opencontainers.image.title="rental-user-service" \
      org.opencontainers.image.description="Сервис аренды недвижимости: user-service"

# ca-certificates — для HTTPS до Sentry, tzdata — корректное время в логах
RUN apk add --no-cache ca-certificates tzdata \
    && adduser -D -H -u 10001 app

WORKDIR /app

COPY --from=builder /app ./server

USER app

EXPOSE 8081

CMD ["./server"]
