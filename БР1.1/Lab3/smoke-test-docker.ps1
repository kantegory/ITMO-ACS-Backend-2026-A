param(
    [string]$BaseUrl = "http://localhost:8080/api/v1"
)

$ErrorActionPreference = "Stop"

Write-Host "Checking gateway at $BaseUrl ..."
$healthUri = "$BaseUrl/health"
$ready = $false
for ($attempt = 1; $attempt -le 30; $attempt++) {
    try {
        $health = Invoke-RestMethod $healthUri -TimeoutSec 3
        if ($health.status -eq "healthy") {
            $ready = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}
if (-not $ready) {
    throw "Gateway did not become healthy within 60 seconds"
}

$smokeScript = "$PSScriptRoot\..\Lab2\smoke-test.ps1"
for ($attempt = 1; $attempt -le 10; $attempt++) {
    try {
        & $smokeScript -BaseUrl $BaseUrl
        if (-not $LASTEXITCODE -or $LASTEXITCODE -eq 0) {
            Write-Host "Docker Lab3 smoke test passed"
            exit 0
        }
    } catch {
        if ($attempt -eq 10) {
            throw
        }
        Write-Host "Dependencies are still starting; retrying in 5 seconds ($attempt/10) ..."
        Start-Sleep -Seconds 5
    }
}
