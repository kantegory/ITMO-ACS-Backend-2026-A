#!/usr/bin/env bash
# Forced SSH command for publishing one immutable auth image.
set -euo pipefail
umask 077
cd /opt/itmo-auth
if [[ ! ${SSH_ORIGINAL_COMMAND:-} =~ ^deploy-(vm|cloud)\ ([0-9a-f]{40})$ ]]; then
    echo 'Expected: deploy-vm|deploy-cloud <40-character SHA>' >&2
    exit 2
fi
target="${BASH_REMATCH[1]}"
tag="${BASH_REMATCH[2]}"
image="itmo-backend/auth-service:$tag"
exec 9>.release-lock
flock -w 300 9
if docker image inspect "$image" >/dev/null 2>&1; then
    # The same immutable commit can be delivered again without unpacking it twice.
    cat >/dev/null
else
    docker load
fi
docker image inspect "$image" >/dev/null

if [[ $target == vm ]]; then
    export IMAGE_TAG="$tag" AUTH_MONITORING=1
    bash scripts/semester2/auth-compose.sh up -d --no-build --pull never --wait --wait-timeout 350
    python3 scripts/semester2/auth-smoke.py http://127.0.0.1:18083
else
    export KUBECONFIG=/opt/itmo-auth/kubeconfig
    if ! docker exec k3d-itmo-auth-server-0 k3s ctr images ls -q |
        grep -Fxq "docker.io/$image"; then
        bin/k3d image import "$image" -c itmo-auth --mode direct
    fi
    bin/kubectl -n itmo-auth rollout status statefulset/auth-db --timeout=480s
    bin/kubectl -n itmo-auth set image deployment/auth-service auth="$image"
    bin/kubectl -n itmo-auth rollout status deployment/auth-service --timeout=720s
    python3 scripts/semester2/auth-smoke.py http://127.0.0.1:18084 --prefix ""
fi
