$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$services = @(
    @{ Name = "Auth Service"; Dir = "auth-service"; Port = 8001 },
    @{ Name = "Profile Service"; Dir = "profile-service"; Port = 8002 },
    @{ Name = "Resume Service"; Dir = "resume-service"; Port = 8003 },
    @{ Name = "Vacancy Service"; Dir = "vacancy-service"; Port = 8004 },
    @{ Name = "Application Service"; Dir = "application-service"; Port = 8005 },
    @{ Name = "Reference Service"; Dir = "reference-service"; Port = 8006 }
)
Set-Location $root
& "$PSScriptRoot\create-databases.ps1"
npm run build
foreach ($service in $services) {
    $servicePath = Join-Path $root $service.Dir
    $command = "cd /d `"$servicePath`" && title $($service.Name) && npx tsx --env-file=.env dist/app.js"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", $command
}
foreach ($service in $services) { Write-Host "$($service.Name): http://localhost:$($service.Port)/docs" }
