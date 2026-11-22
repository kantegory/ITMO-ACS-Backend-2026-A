#!/usr/bin/env bash
# ДЗ6: forced command для SSH-ключа CI (authorized_keys пользователя rb-deploy).
# Ключ из GitHub Actions НЕ даёт shell: допускается ровно одна команда вида
#   "app <sha40>"  — деплой compose-стенда (ДЗ6)
#   "k8s <sha40>"  — деплой в k3d-кластер (ДЗ8)
# Всё остальное отклоняется. stdin (короткоживущий токен GHCR) передаётся дальше.
set -euo pipefail
cmd=${SSH_ORIGINAL_COMMAND:-}
if [[ ! $cmd =~ ^(app|k8s)\ ([0-9a-f]{40})$ ]]; then
  echo "rejected: expected '<app|k8s> <40-hex sha>'" >&2
  logger -t rb-deploy "rejected command: ${cmd:0:80}"
  exit 2
fi
logger -t rb-deploy "accepted: ${BASH_REMATCH[1]} ${BASH_REMATCH[2]}"
exec sudo -n /opt/rb-sem2/bin/deploy.sh "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}"
