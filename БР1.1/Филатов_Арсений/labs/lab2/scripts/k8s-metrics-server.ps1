#Requires -Version 5.1
# metrics-server for kind (нужен для HPA по CPU)
$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$Patch = Join-Path $Root "kind\metrics-server-patch.yaml"

kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl -n kube-system patch deploy metrics-server --patch-file $Patch
Write-Host "Wait for metrics-server..."
kubectl -n kube-system rollout status deploy/metrics-server --timeout=120s
Start-Sleep -Seconds 20
kubectl top nodes
