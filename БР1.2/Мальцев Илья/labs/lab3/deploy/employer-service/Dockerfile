FROM golang:1.25-alpine AS builder

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/employer-service ./cmd/employer-service

FROM alpine:3.20

WORKDIR /app
COPY --from=builder /bin/employer-service /app/employer-service
EXPOSE 8084
ENTRYPOINT ["/app/employer-service"]
