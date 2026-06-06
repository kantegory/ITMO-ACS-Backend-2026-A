FROM golang:1.23-alpine AS builder

ENV GOTOOLCHAIN=local

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /app ./src/service

FROM alpine:3.20

WORKDIR /app

COPY --from=builder /app ./server

EXPOSE 8081

CMD ["./server"]
