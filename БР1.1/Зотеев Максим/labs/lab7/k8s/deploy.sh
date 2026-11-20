#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
: "${KUBECONFIG:?Set KUBECONFIG to the lab cluster}"
tf=../terraform
cmp -s "$KUBECONFIG" "$tf/.lab7/kubeconfig.yaml" || { echo "Expected the rental-lab7 kubeconfig" >&2; exit 1; }
k=(kubectl --kubeconfig="$KUBECONFIG" -n rental-lab7)
apply() { "${k[@]}" apply --server-side --field-manager=rental-lab7 -f "$1"; }
configmap() {
  "${k[@]}" create configmap "$@" --dry-run=client -o yaml | apply -
}
database_endpoint() {
  endpoint=$(terraform -chdir="$tf" output -json database_endpoint)
  db_host=$(jq -er '.host | strings | select(length>0)' <<<"$endpoint")
  db_port=$(jq -er '.port | tonumber | select(. == floor and . >= 1 and . <= 65535)' <<<"$endpoint")
}
image() {
  image=$(cat .build/image 2>/dev/null || true)
  [[ $image =~ ^[a-z0-9./_-]+@sha256:[0-9a-f]{64}$ ]] || { echo 'Build and push the image first: sh image.sh ci' >&2; exit 1; }
}
# Manifests reference ${IMAGE}; it is replaced with the pushed digest so pods never run a moving tag.
render() { sed 's|${IMAGE}|'"$image"'|g' "$1" | apply -; }
waitjob() { "${k[@]}" wait --for=condition=complete "job/$1" --timeout=15m; }

case "${1:-}" in
  prepare)
    image
    database_endpoint
    apply namespace.yaml
    bash secrets.sh prepare
    configmap database --from-literal="DB_HOST=$db_host" --from-literal="DB_PORT=$db_port"
    configmap cloud-scripts --from-file=jobs/postgres-roles.sh --from-file=jobs/initialize.cjs --from-file=jobs/replay-failed.cjs
    sed 's/${DB_PORT}/'"$db_port"'/g' network.yaml.in | apply -
    apply rabbit.yaml
    apply jobs/pg-roles.yaml
    waitjob pg-roles
    "${k[@]}" logs job/pg-roles
    "${k[@]}" rollout status statefulset/rabbit --timeout=12m
    "${k[@]}" exec rabbit-0 -- rabbitmqctl await_online_nodes 3 --timeout 180
    "${k[@]}" exec rabbit-0 -- rabbitmqctl set_policy --apply-to quorum_queues rental-retry '^messaging[.]rental-events$' '{"dead-letter-exchange":"rental.failed","dead-letter-strategy":"at-least-once","overflow":"reject-publish"}'
    render jobs/initialize.yaml
    waitjob initialize
    "${k[@]}" logs job/initialize
    "${k[@]}" delete job pg-roles initialize
    "${k[@]}" delete secret pg-bootstrap pg-roles
    ;;
  app)
    image
    for manifest in apps/*.yaml; do render "$manifest"; done
    for name in identity-service property-service rental-service messaging-service rental-outbox api-gateway; do
      "${k[@]}" rollout status "deployment/$name" --timeout=12m
    done
    ;;
  public) apply public.yaml ;;
  replay)
    # Re-publish events the consumer gave up on (messaging.failed) once the cause is fixed.
    "${k[@]}" delete job replay-failed --ignore-not-found
    image
    render jobs/replay-failed.yaml
    waitjob replay-failed
    "${k[@]}" logs job/replay-failed
    "${k[@]}" delete job replay-failed
    ;;
  monitoring)
    bash secrets.sh monitoring
    configmap monitor-settings --from-file=monitoring/config/prometheus.yml --from-file=monitoring/config/loki.yml --from-file=monitoring/config/alloy.config
    configmap grafana-settings --from-file=monitoring/config/sources.yaml --from-file=monitoring/config/providers.yaml --from-file=monitoring/config/rental.json
    apply monitoring/
    ;;
  *) echo 'Usage: bash deploy.sh {prepare|app|public|replay|monitoring}' >&2; exit 2 ;;
esac
