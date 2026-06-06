FROM golang:latest AS builder

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /app ./src/service

FROM alpine:3.20

WORKDIR /app

COPY --from=builder /app ./server
COPY --from=builder /build/docs ./docs

EXPOSE 8080

CMD ["./server"]
