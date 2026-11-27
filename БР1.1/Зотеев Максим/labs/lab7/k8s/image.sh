#!/bin/sh
# Records the application image that deploy.sh writes into the manifests (.build/image).
#   sh image.sh ci     use the image CI (.github/workflows/rental-image.yml) pushed for HEAD
#   sh image.sh build  build locally from labs/lab2 and push; log in first:
#                      echo "$GHCR_TOKEN" | docker login ghcr.io -u <github-user> --password-stdin
set -eu
here=$(CDPATH='' cd -- "$(dirname "$0")" && pwd)
lab2="$here/../../lab2"
repo=${IMAGE_REPO:-ghcr.io/f0x1d/rental-lab7}
tag=$(git -C "$lab2" rev-parse --short=7 HEAD)
mkdir -p "$here/.build"

case "${1:-ci}" in
  ci)
    git -C "$lab2" diff --quiet HEAD -- . "$here/Dockerfile" ||
      { echo 'lab2 has uncommitted changes: commit and push them, or use: sh image.sh build' >&2; exit 1; }
    digest=$(docker buildx imagetools inspect "$repo:$tag" --format '{{json .Manifest}}' | jq -er '.digest') ||
      { echo "No $repo:$tag yet: wait for the CI run of $tag" >&2; exit 1; }
    ;;
  build)
    git -C "$lab2" diff --quiet HEAD -- . || tag="$tag-dirty"
    # The UKS workers are x86-64; --push is needed because a cross-built image is not loaded locally.
    docker buildx build --platform linux/amd64 -f "$here/Dockerfile" -t "$repo:$tag" \
      --metadata-file "$here/.build/image.json" --push "$lab2"
    digest=$(jq -er '."containerimage.digest"' "$here/.build/image.json")
    ;;
  *) echo 'Usage: sh image.sh {ci|build}' >&2; exit 2 ;;
esac
printf '%s@%s\n' "$repo" "$digest" > "$here/.build/image"
echo "Using $(cat "$here/.build/image") ($tag)"
