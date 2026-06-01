FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd/server

FROM alpine:3.19
RUN apk add --no-cache ca-certificates wget

WORKDIR /app
COPY --from=builder /app/server .
COPY --from=builder /app/docs ./docs

EXPOSE 8080
CMD ["/app/server"]
