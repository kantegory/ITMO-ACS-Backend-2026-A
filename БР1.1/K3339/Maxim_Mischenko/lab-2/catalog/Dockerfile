# Stage 1 - build
FROM golang:1.26.3-alpine AS builder

WORKDIR /app

COPY go.mod go.sum /
RUN go mod download

COPY . .
RUN go build -o main ./cmd/main.go

# Stage 2 - run
FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/main .

EXPOSE 8002

CMD ["./main"]
