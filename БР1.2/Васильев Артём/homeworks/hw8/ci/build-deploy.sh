#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/ci.env"
: "${GITHUB_SHA:?}"
images=()
for service in $SERVICES; do
  image="$REGISTRY/job-platform/$service:$GITHUB_SHA"
  docker build --quiet -f "$CLOUD/Dockerfile" -t "$image" "$ROOT/$APP_DIR/services/$service"
  docker push "$image"
  images+=("$image")
done
context="$RUNNER_TEMP/cloud-gateway"
mkdir -p "$context/site"
cp "$CLOUD/gateway/Dockerfile" "$context/Dockerfile"
cp -R "$BASE/homeworks/hw9/site/." "$context/site/"
image="$REGISTRY/job-platform/gateway:$GITHUB_SHA"
docker build --quiet -t "$image" "$context"
images+=("$image")
docker push "$image"
curl -fsS http://127.0.0.1:5000/v2/_catalog > "$RESULTS/registry-catalog.json"
printf '%s\n' "${images[@]}" > "$RESULTS/images.txt"
IMAGE_TAG="$GITHUB_SHA" bash "$CLOUD/scripts/deploy.sh"
