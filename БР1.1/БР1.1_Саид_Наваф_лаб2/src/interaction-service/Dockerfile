FROM golang:1.26-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod init interaction-service 2>/dev/null || true
RUN go mod tidy 2>/dev/null || true
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

FROM scratch
COPY --from=builder /app/main .
EXPOSE 8084
CMD ["./main"]
