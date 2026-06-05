# syntax=docker/dockerfile:1

FROM golang:1.23-bookworm AS build

WORKDIR /src

COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

COPY . .

ENV CGO_ENABLED=0

RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -trimpath -ldflags="-s -w" -o /out/recipehub ./cmd/gateway

FROM debian:bookworm-slim AS runtime

ARG VERSION=dev
LABEL org.opencontainers.image.title="RecipeHub Gateway"
LABEL org.opencontainers.image.description="RecipeHub gateway service"
LABEL org.opencontainers.image.version="${VERSION}"

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    wget \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --system --uid 65532 --home /nonexistent --shell /usr/sbin/nologin appuser \
    && mkdir -p /app/docs \
    && chown -R appuser:appuser /app

WORKDIR /app

COPY --from=build --chown=appuser:appuser /out/recipehub /app/recipehub
COPY --chown=appuser:appuser docs/openapi.yaml /app/docs/openapi.yaml

USER appuser

ENV HTTP_ADDR=:8080 \
    OPENAPI_SPEC_PATH=/app/docs/openapi.yaml

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1

ENTRYPOINT ["/app/recipehub"]
