$ErrorActionPreference = "Stop"

$postgresUser = $env:DB_USER
$postgresPassword = $env:DB_PASSWORD
$postgresHost = $env:DB_HOST
$postgresPort = $env:DB_PORT

if (-not $postgresUser) { $postgresUser = "postgres" }
if (-not $postgresPassword) { $postgresPassword = "1234" }
if (-not $postgresHost) { $postgresHost = "localhost" }
if (-not $postgresPort) { $postgresPort = "5432" }

$databases = @(
    "auth_db",
    "profile_db",
    "resume_db",
    "vacancy_db",
    "application_db",
    "reference_db"
)

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Host "psql was not found in PATH." -ForegroundColor Red
    Write-Host "Install PostgreSQL or add PostgreSQL bin directory to PATH, for example:"
    Write-Host "C:\Program Files\PostgreSQL\16\bin"
    exit 1
}

$env:PGPASSWORD = $postgresPassword

foreach ($database in $databases) {
    $exists = psql `
        -h $postgresHost `
        -p $postgresPort `
        -U $postgresUser `
        -d postgres `
        -tAc "SELECT 1 FROM pg_database WHERE datname = '$database';"

    if ($exists -eq "1") {
        Write-Host "$database already exists" -ForegroundColor DarkGray
        continue
    }

    Write-Host "Creating $database..." -ForegroundColor Green
    psql `
        -h $postgresHost `
        -p $postgresPort `
        -U $postgresUser `
        -d postgres `
        -c "CREATE DATABASE $database;"
}

Write-Host "Databases are ready." -ForegroundColor Cyan
