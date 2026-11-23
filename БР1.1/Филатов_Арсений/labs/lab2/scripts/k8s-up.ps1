#Requires -Version 5.1
$ErrorActionPreference = "Continue"

$Lab2Root = Split-Path -Parent $PSScriptRoot
$KindConfig = Join-Path $Lab2Root "kind\config.yaml"
$K8sDir = Join-Path $Lab2Root "k8s"
$ClusterName = "lab2"
$Services = @("auth", "catalog", "jobseeker", "employer", "application", "gateway")

if (-not (Get-Command kind -ErrorAction SilentlyContinue)) {
  throw "kind not found. Put kind.exe on PATH (e.g. %USERPROFILE%\bin)."
}
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) { throw "kubectl not found" }
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw "docker not found" }
docker info | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Docker is not running. Start Docker Desktop." }

$raw = @(kind get clusters 2>&1 | ForEach-Object { "$_" })
$existing = @($raw | Where-Object { $_ -and ($_ -notmatch "No kind clusters") -and ($_ -notmatch "ERROR") })
if ($existing -notcontains $ClusterName) {
  Write-Host "==> kind create cluster --name $ClusterName"
  kind create cluster --name $ClusterName --config $KindConfig
  if ($LASTEXITCODE -ne 0) { throw "kind create cluster failed" }
} else {
  Write-Host "==> cluster '$ClusterName' already exists"
  kind export kubeconfig --name $ClusterName | Out-Null
}

$ready = ""
try {
  $ready = kubectl get pods -n ingress-nginx -l app.kubernetes.io/component=controller -o jsonpath='{.items[0].status.phase}' 2>$null
} catch { $ready = "" }
if ($ready -ne "Running") {
  Write-Host "==> install ingress-nginx for kind"
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
  Write-Host "==> wait ingress controller"
  kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=180s
  if ($LASTEXITCODE -ne 0) { throw "ingress-nginx not ready" }
} else {
  Write-Host "==> ingress-nginx already running"
}

# Port-forward in kind config is on control-plane; pin ingress there.
$IngressPatch = Join-Path $Lab2Root "kind\ingress-controller-patch.yaml"
Write-Host "==> pin ingress-nginx to control-plane"
kubectl -n ingress-nginx patch deploy ingress-nginx-controller --patch-file $IngressPatch
kubectl -n ingress-nginx rollout status deploy/ingress-nginx-controller --timeout=120s

Set-Location $Lab2Root
foreach ($svc in $Services) {
  $tag = "lab2/${svc}:local"
  Write-Host "==> docker build --target $svc -t $tag"
  docker build --target $svc -t $tag .
  if ($LASTEXITCODE -ne 0) { throw "docker build failed for $svc" }
  Write-Host "==> kind load docker-image $tag --name $ClusterName"
  kind load docker-image $tag --name $ClusterName
  if ($LASTEXITCODE -ne 0) { throw "kind load failed for $svc" }
}

Write-Host "==> kubectl apply -f k8s"
Get-ChildItem $K8sDir -Filter *.yaml | Sort-Object Name | ForEach-Object {
  kubectl apply -f $_.FullName
}
Write-Host "==> wait postgres/rabbitmq"
kubectl -n lab2 rollout status deploy/postgres --timeout=180s
kubectl -n lab2 rollout status deploy/rabbitmq --timeout=180s
foreach ($svc in $Services) {
  Write-Host "==> wait $svc"
  kubectl -n lab2 rollout status deploy/$svc --timeout=180s
  if ($LASTEXITCODE -ne 0) { throw "rollout failed for $svc" }
}

Write-Host ""
Write-Host "Ready. Gateway via Ingress: http://localhost:8080/health"
Write-Host "Check: kubectl -n lab2 get all"
