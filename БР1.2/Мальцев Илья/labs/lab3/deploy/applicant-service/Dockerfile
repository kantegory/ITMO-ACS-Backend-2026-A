FROM golang:1.25-alpine AS builder

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/applicant-service ./cmd/applicant-service

FROM alpine:3.20

WORKDIR /app
COPY --from=builder /bin/applicant-service /app/applicant-service
EXPOSE 8083
ENTRYPOINT ["/app/applicant-service"]
