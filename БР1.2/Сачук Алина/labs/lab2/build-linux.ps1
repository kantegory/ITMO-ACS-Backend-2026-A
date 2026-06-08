$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path "dist" | Out-Null

$env:GOOS = "linux"
$env:GOARCH = "amd64"
$env:CGO_ENABLED = "0"

go build -o dist/auth-service ./cmd/auth-service
go build -o dist/recipe-service ./cmd/recipe-service
go build -o dist/social-service ./cmd/social-service
go build -o dist/api-gateway ./cmd/api-gateway

Write-Host "Linux binaries are ready in ./dist"
