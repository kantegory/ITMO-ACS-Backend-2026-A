#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/ci.env"
exec > >(tee "$RESULTS/acceptance.txt") 2>&1
k() { kubectl -n "$NAMESPACE" "$@"; }
collection="$BASE/homeworks/hw9/docs/contracts/job-platform-dz3.postman_collection.json"
k exec -i postgres-0 -- psql -X -v ON_ERROR_STOP=1 -U clusteradmin -d dictionaries_db < "$BASE/homeworks/hw9/docs/contracts/e2e-dictionaries.sql"
k exec rabbitmq-0 -- rabbitmq-diagnostics -q check_local_alarms
npx --yes newman@6.2.1 run "$collection" --env-var "baseUrl=$BASE_URL" --timeout-request 15000 --reporters cli,junit --reporter-junit-export "$RESULTS/newman-before.xml" --bail
for page in index.html architecture.html api.html authentication.html endpoints.html run-deploy.html testing.html observability.html swagger.html contracts/openapi.yaml contracts/job-platform-dz3.postman_collection.json; do
  curl -fsS --max-time 10 "http://127.0.0.1:30080/docs/$page" >/dev/null
done
for service in $SERVICES; do
  curl -fsS --max-time 10 "http://127.0.0.1:30080/docs/contracts/services/$service.yaml" >/dev/null
done
[[ "$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/internal/users/test")" = 404 ]]
[[ "$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/users/me")" = 401 ]]
printf 'DOCUMENTATION_AND_ROUTING_OK\n'
old_uid="$(k get pods -l app=auth-user-service -o jsonpath='{.items[0].metadata.uid}')"
k delete pod -l app=auth-user-service --wait=true --timeout=60s
k rollout status deployment/auth-user-service --timeout=240s
new_uid="$(k get pods -l app=auth-user-service -o jsonpath='{.items[0].metadata.uid}')"
[[ -n "$new_uid" && "$new_uid" != "$old_uid" ]]
printf 'POD_RECREATED old=%s new=%s\n' "$old_uid" "$new_uid"
good_port="$(k get deployment auth-user-service -o jsonpath='{.spec.template.spec.containers[0].readinessProbe.tcpSocket.port}')"
restore_needed=1
trap 'if [ "$restore_needed" = 1 ]; then k rollout undo deployment/auth-user-service; fi' EXIT
k patch deployment auth-user-service --type=strategic -p '{"spec":{"template":{"spec":{"containers":[{"name":"app","readinessProbe":{"tcpSocket":{"port":1}}}]}}}}'
if k rollout status deployment/auth-user-service --timeout=20s; then
  echo 'Incorrect readiness probe unexpectedly passed' >&2
  exit 1
fi
k rollout undo deployment/auth-user-service
restore_needed=0
k rollout status deployment/auth-user-service --timeout=240s
[[ "$(k get deployment auth-user-service -o jsonpath='{.spec.template.spec.containers[0].readinessProbe.tcpSocket.port}')" = "$good_port" ]]
printf 'FAILED_READINESS_AND_ROLLBACK_OK\n'
npx --yes newman@6.2.1 run "$collection" --env-var "baseUrl=$BASE_URL" --timeout-request 15000 --reporters cli,junit --reporter-junit-export "$RESULTS/newman-after.xml" --bail
bash "$CLOUD/scripts/backup-restore-check.sh" "$DEPLOY_STATE_DIR/backups" | tee "$RESULTS/restore-check.txt"
