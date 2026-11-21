# Build stage
FROM golang:1.26-alpine AS builder

WORKDIR /app

# Install dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Generate Swagger docs from annotations

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o rental-api ./cmd/server

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

# Copy binary and Swagger docs from builder
COPY --from=builder /app/rental-api .
COPY --from=builder /app/internal/docs ./internal/docs 

# Create a non-root user
RUN adduser -D -g '' appuser

# Create storage directory and set permissions
RUN mkdir -p /app/storage && chown -R appuser:appuser /app/storage

USER appuser

EXPOSE 8080

CMD ["./rental-api"]
