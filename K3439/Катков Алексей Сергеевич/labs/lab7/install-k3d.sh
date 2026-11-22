#!/usr/bin/env bash
set -euo pipefail
dest="${1:-$HOME/.local/bin}"
version=5.9.0
asset=k3d-linux-amd64
url="https://github.com/k3d-io/k3d/releases/download/v$version"
if [[ "$(uname -m)" == aarch64 ]]; then asset=k3d-linux-arm64; fi
workdir="$(mktemp -d)"
trap 'rm -f "$workdir/$asset" "$workdir/checksums.txt" "$workdir/check"; rmdir "$workdir"' EXIT
curl -fsSL --retry 3 "$url/$asset" -o "$workdir/$asset"
curl -fsSL --retry 3 "$url/checksums.txt" -o "$workdir/checksums.txt"
awk -v asset="$asset" '$2 == "_dist/" asset { print $1, asset; found=1 } END { if (!found) exit 1 }' \
  "$workdir/checksums.txt" > "$workdir/check"
(cd "$workdir" && sha256sum --check --status check)
mkdir -p "$dest"
install -m 0755 "$workdir/$asset" "$dest/k3d"
