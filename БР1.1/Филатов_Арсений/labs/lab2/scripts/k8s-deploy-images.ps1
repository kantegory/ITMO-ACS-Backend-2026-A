#Requires -Version 5.1
# Local analogue of deploy-lab2-k8s.yml: build, kind load, set image, rollout.
$ErrorActionPreference = "Continue"

$Lab2Root = Split-Path -Parent $PSScriptRoot
$ClusterName = "lab2"
$Namespace = "lab2"
$Tag = if ($args[0]) { $args[0] } else { "local-$(Get-Date -Format 'yyyyMMddHHmmss')" }
$Services = @("auth", "catalog", "jobseeker", "employer", "application", "gateway")

Set-Location $Lab2Root
foreach ($svc in $Services) {
  $image = "lab2/${svc}:$Tag"
  Write-Host "==> build $image"
  docker build --target $svc -t $image .
  if ($LASTEXITCODE -ne 0) { throw "docker build failed for $svc" }
  Write-Host "==> kind load $image"
  kind load docker-image $image --name $ClusterName
  if ($LASTEXITCODE -ne 0) { throw "kind load failed for $svc" }
  Write-Host "==> set image deploy/$svc"
  kubectl -n $Namespace set image "deploy/$svc" "${svc}=$image"
  kubectl -n $Namespace rollout status "deploy/$svc" --timeout=180s
  if ($LASTEXITCODE -ne 0) { throw "rollout failed for $svc" }
}

Write-Host "Done. Tag=$Tag"
Write-Host "Health: http://localhost:8080/health"
