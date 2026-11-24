#!/usr/bin/env bash
# Install the auth virtual host after its selected loopback proxy responds.
set -euo pipefail
cd /opt/itmo-auth
case "${1:-}" in
    vm) port=18083 ;;
    cloud) port=18085 ;;
    *) echo 'Usage: auth-publish.sh vm|cloud' >&2; exit 2 ;;
esac

caddyfile=/root/finplan/Caddyfile
candidate=$(mktemp)
trap 'rm -f "$candidate"' EXIT
curl -fsS --max-time 25 -o /dev/null "http://127.0.0.1:$port/v3/api-docs"
awk '
/^# Public read-only test routes / { next }
/^ab[.]pxdkxvan[.]lol[[:space:]]*[{]$/ { skip=1; next }
skip && /^}[[:space:]]*$/ { skip=0; next }
!skip { print }
END { if (skip) exit 2 }
' "$caddyfile" > "$candidate"
printf '\n' >> "$candidate"
sed "s/:18083/:$port/g" infra/semester2/caddy/ab.pxdkxvan.lol.caddy >> "$candidate"
docker exec -i finplan-caddy-1 caddy validate --config /dev/stdin --adapter caddyfile < "$candidate"
backup=$(mktemp /root/finplan/Caddyfile.pre-auth.XXXXXX)
cp -p "$caddyfile" "$backup"
docker exec -i finplan-caddy-1 caddy reload --config /dev/stdin --adapter caddyfile < "$candidate"
cat "$candidate" > "$caddyfile"
