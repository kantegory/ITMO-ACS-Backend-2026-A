FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/server .
RUN adduser -D -g '' appuser
RUN mkdir -p /app/storage && chown -R appuser:appuser /app/storage
USER appuser
EXPOSE 8082
CMD ["./server"]