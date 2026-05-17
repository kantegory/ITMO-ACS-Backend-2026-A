FROM golang:1.22-alpine AS builder
WORKDIR /src
COPY go.work ./
COPY shared ./shared
COPY services/property-service ./services/property-service
WORKDIR /src/services/property-service
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o /property-service ./cmd

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /property-service .
EXPOSE 8082
CMD ["./property-service"]
