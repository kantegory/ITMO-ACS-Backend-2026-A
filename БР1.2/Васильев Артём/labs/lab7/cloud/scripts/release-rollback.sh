#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/../config.env"
: "${2:?Usage: release-rollback.sh save|restore snapshot-directory}"
umask 077
snapshot="$2"
k() { kubectl -n "$NAMESPACE" "$@"; }
case "$1" in
  save)
    mkdir -p "$snapshot"
    chmod 700 "$snapshot"
    k get deployments -o json | python3 -c '
import json, sys
names = sys.argv[1].split()
json.dump({item["metadata"]["name"]: item["spec"]["template"]
           for item in json.load(sys.stdin)["items"] if item["metadata"]["name"] in names}, sys.stdout)
' "$SERVICES gateway" > "$snapshot/templates.json"
    chmod 600 "$snapshot/templates.json"
    ;;
  restore)
    # shortcut: application templates only; database/schema and shared configuration are not rolled back.
    python3 - "$snapshot" "$SERVICES gateway" <<'PY'
import json, sys
from pathlib import Path
snapshot = Path(sys.argv[1])
templates = json.loads((snapshot / 'templates.json').read_text())
names = sys.argv[2].split()
if any(name not in templates for name in names):
    sys.exit('No complete previous application release; fresh apps and all data are preserved')
for name in names:
    (snapshot / (name + '.json')).write_text(json.dumps([
        {'op': 'replace', 'path': '/spec/template', 'value': templates[name]}]))
PY
    for service in $SERVICES gateway; do
      k patch "deployment/$service" --type=json --patch-file "$snapshot/$service.json"
    done
    for service in $SERVICES gateway; do
      k rollout status "deployment/$service" --timeout=600s
    done
    ;;
  *) echo 'Expected save or restore' >&2; exit 2 ;;
esac
