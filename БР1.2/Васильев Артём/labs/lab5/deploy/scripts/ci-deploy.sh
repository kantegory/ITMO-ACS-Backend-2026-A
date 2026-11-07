#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
LAB5_DIR="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/../config/ci.env"
# shellcheck disable=SC1090
source "${CONFIG_FILE}"

: "${SSH_HOST:?SSH_HOST is required}"
: "${SSH_PRIVATE_KEY:?SSH_PRIVATE_KEY is required}"
: "${REPO_URL:?REPO_URL is required}"

SSH_USER="${SSH_USER:-root}"
SSH_PORT="${SSH_PORT:-${SSH_PORT_DEFAULT}}"
BRANCH="${BRANCH:-${BRANCH_DEFAULT}}"
RUNNER_TEMP="${RUNNER_TEMP:-${TMPDIR:-/tmp}}"
ANSIBLE_VENV="${RUNNER_TEMP}/ansible-venv"
SSH_KEY="${RUNNER_TEMP}/deploy_key"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-https://${SSH_HOST}${PUBLIC_BASE_PATH}}"

mkdir -p "${HOME}/.ssh" "${RUNNER_TEMP}"
printf '%s\n' "${SSH_PRIVATE_KEY}" > "${SSH_KEY}"
chmod 600 "${SSH_KEY}"
ssh-keyscan -p "${SSH_PORT}" -H "${SSH_HOST}" >> "${HOME}/.ssh/known_hosts" 2>/dev/null

python3 -m venv "${ANSIBLE_VENV}"
"${ANSIBLE_VENV}/bin/pip" install --quiet --upgrade pip
"${ANSIBLE_VENV}/bin/pip" install --quiet "${ANSIBLE_CORE_SPEC}"
"${ANSIBLE_VENV}/bin/ansible-galaxy" collection install \
  -r "${LAB5_DIR}/deploy/ansible/requirements.yml"

export SSH_USER SSH_PORT SSH_KEY REPO_URL BRANCH
cd "${LAB5_DIR}/deploy/ansible"
"${ANSIBLE_VENV}/bin/ansible-playbook" deploy.yml

curl -kfsS "${PUBLIC_BASE_URL}${HEALTH_PATH}" >/dev/null
