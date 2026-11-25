#!/usr/bin/env bash
# Back up seven DBs, restore into isolated temporary DBs and compare exact row counts.
set -Eeuo pipefail
CLOUD_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
source "$CLOUD_DIR/config.env"
k() { k3s kubectl -n "$NAMESPACE" "$@"; }
stamp="$(date -u +%Y%m%d_%H%M%S)"
directory="${1:-/opt/job-platform-cloud/backups/$stamp}"
umask 077
mkdir -p "$directory"
current=''
cleanup() {
  if [ -n "$current" ]; then
    k exec postgres-0 -- dropdb -U clusteradmin --if-exists "$current" >/dev/null
  fi
}
trap cleanup EXIT
counts() {
  printf '%s\n' "SELECT format('SELECT %L, count(*) FROM %I.%I;', table_name, table_schema, table_name) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name;" '\gexec' | k exec -i postgres-0 -- psql -XAt -U clusteradmin -d "$1"
}
for role in users companies dictionaries vacancies resumes applications interactions; do
  database="${role}_db"
  k exec postgres-0 -- pg_dump -U clusteradmin --format=custom "$database" > "$directory/$database.dump"
  test -s "$directory/$database.dump"
  current="restore_${role}_$stamp"
  k exec postgres-0 -- createdb -U clusteradmin "$current"
  k exec -i postgres-0 -- pg_restore -U clusteradmin --no-owner --exit-on-error -d "$current" < "$directory/$database.dump"
  counts "$database" > "$directory/$database.source-counts.txt"
  counts "$current" > "$directory/$database.restored-counts.txt"
  diff -u "$directory/$database.source-counts.txt" "$directory/$database.restored-counts.txt"
  k exec postgres-0 -- dropdb -U clusteradmin "$current"
  current=''
  printf 'RESTORE_OK %s %s_bytes\n' "$database" "$(wc -c < "$directory/$database.dump")"
done
printf 'BACKUP_DIR=%s\n' "$directory"
