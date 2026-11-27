#!/usr/bin/env bash
set -euo pipefail

mode="${1:?Use vm or k8s}"
[[ "$mode" == vm || "$mode" == k8s ]] || exit 2
root="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
repo=Deraxus/ITMO-ACS-Backend-2026-A
labs='K3439/Катков Алексей Сергеевич/labs'
app="$root/$labs/lab4/app"
if [[ "$mode" == k8s && "$(kubectl config current-context)" != "k3d-recipes-s2" ]]; then
  echo "Unexpected Kubernetes context" >&2
  exit 1
fi

state="${RECIPES_STATE_DIR:-$root/.git/recipes-delivery}"
mkdir -p "$state"
exec 9>"$state/$mode.lock"
flock -n 9 || exit 0

record="$state/$mode.sha"
current=local
if [[ -s "$record" ]]; then
  read -r current < "$record"
fi
read -r run tag <<< "$(gh run list --repo "$repo" --workflow recipes.yml --branch katkov-deploy \
  --status success --limit 1 --json databaseId,headSha --jq '.[0] | "\(.databaseId) \(.headSha)"')"
[[ "$run" =~ ^[0-9]+$ && "$tag" =~ ^[a-f0-9]{40}$ ]] || exit 1
[[ "$current" != "$tag" ]] || exit 0

temp="$(mktemp -d)"
trap 'rm -f "$temp/release/recipes.tar.gz" "$temp/release/SHA256SUMS"; rmdir "$temp/release" "$temp" 2>/dev/null || true' EXIT
mkdir "$temp/release"
gh run download "$run" --repo "$repo" --name recipes-images --dir "$temp/release"
(cd "$temp/release" && sha256sum --check --status SHA256SUMS)
gzip -dc "$temp/release/recipes.tar.gz" | docker load

rollout() {
  local revision="$1"
  if [[ "$mode" == vm ]]; then
    IMAGE_PREFIX=recipes IMAGE_TAG="$revision" docker compose --project-directory "$app" \
      up --no-build --wait --wait-timeout 180
  else
    for service in api-gateway auth-service recipe-service social-service; do
      kubectl -n recipes set image "deployment/$service" "app=recipes/$service:$revision" || return
    done
    for service in api-gateway auth-service recipe-service social-service; do
      kubectl -n recipes rollout status "deployment/$service" --timeout=180s || return
    done
  fi
}

url=${RECIPES_VM_URL:-http://127.0.0.1:80}
if [[ "$mode" == k8s ]]; then
  url=http://127.0.0.1:18081
  if [[ "$current" == local ]]; then
    kubectl -n recipes get deployment api-gateway >/dev/null
  fi
  k3d image import -c recipes-s2 recipes/{api-gateway,auth-service,recipe-service,social-service}:"$tag"
fi

if ! rollout "$tag" || ! curl -fsS --retry 5 --retry-all-errors --retry-delay 2 "$url/ready"; then
  echo "Release $tag failed, rolling back to $current" >&2
  rollout "$current"
  exit 1
fi

printf '%s\n' "$tag" > "$record.tmp"
mv -f "$record.tmp" "$record"
printf '\n%s %s %s\n' "$(date -u +%FT%TZ)" "$mode" "$tag"
