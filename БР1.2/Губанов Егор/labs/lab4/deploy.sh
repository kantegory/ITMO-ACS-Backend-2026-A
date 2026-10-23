#!/usr/bin/env bash
set -euo pipefail
lab4_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
export COMPOSE_PARALLEL_LIMIT=1
bash "$lab4_dir/compose.sh" config --quiet
bash "$lab4_dir/compose.sh" build auth
bash "$lab4_dir/compose.sh" up --detach --no-build --wait --wait-timeout 300
bash "$lab4_dir/smoke.sh"
bash "$lab4_dir/compose.sh" ps
