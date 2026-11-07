#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ANSIBLE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/../ansible" && pwd)

if ! command -v ansible-playbook >/dev/null 2>&1; then
    if [ -x /opt/ansible-venv/bin/ansible-playbook ]; then
        export PATH="/opt/ansible-venv/bin:$PATH"
    else
        echo "ansible-playbook is not installed; run setup-server.sh first." >&2
        exit 1
    fi
fi

cd "$ANSIBLE_DIR"
ansible-playbook -i localhost, -c local deploy.yml
