FROM golang:1.25-alpine AS builder

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/api-gateway ./cmd/api-gateway

FROM alpine:3.20

WORKDIR /app
COPY --from=builder /bin/api-gateway /app/api-gateway
EXPOSE 8080
ENTRYPOINT ["/app/api-gateway"]
