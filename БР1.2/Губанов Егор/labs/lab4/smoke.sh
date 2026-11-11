#!/usr/bin/env bash
set -euo pipefail
base=${1:-http://127.0.0.1:13000}
response=$(curl --fail --silent --show-error --max-time 20 "$base/api/v1/")
python3 -c 'import json,sys; assert json.load(sys.stdin)["service"] == "rent-gateway"' <<< "$response"
printf 'OK: gateway\n'
response=$(curl --fail --silent --show-error --max-time 20 "$base/api/v1/property-types/")
python3 -c 'import json,sys; d=json.load(sys.stdin); assert isinstance(d,list) and len(d)>=3' <<< "$response"
printf 'OK: catalog and PostgreSQL\n'
status=$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 20 "$base/api/v1/me/")
[[ "$status" == 401 ]]
printf 'OK: protected endpoint returns HTTP 401\n'
