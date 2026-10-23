#!/usr/bin/env bash
set -euo pipefail
base="${1:?Usage: bash scripts/check.sh http://SERVER_IP}"
base="${base%/}"
curl --fail --silent --show-error "$base/" >/dev/null
for service in auth profile resume vacancy application reference; do
    curl --fail --silent --show-error "$base/$service/docs/" >/dev/null
    echo "OK $service/docs/"
done
curl --fail --silent --show-error "$base/reference/api/industries/"
echo
echo 'HTTP checks passed'
