FROM golang:1.25-alpine AS builder
ARG SERVICE
ARG APP_REVISION=local
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
RUN go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@v4.18.3
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w -X main.revision=${APP_REVISION}" -o /out/service ./${SERVICE}/cmd/${SERVICE}

FROM alpine:3.21
ARG SERVICE
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /out/service /app/service
COPY --from=builder /go/bin/migrate /app/migrate
COPY --from=builder /app/${SERVICE}/migrations /app/migrations
CMD ["/app/service"]
