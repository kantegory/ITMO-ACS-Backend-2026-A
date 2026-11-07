#!/usr/bin/env sh
set -eu

if [ "$(id -u)" -ne 0 ]; then
    echo "Run this script as root." >&2
    exit 1
fi

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ANSIBLE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/../ansible" && pwd)

export PATH="${ANSIBLE_VENV:-/opt/ansible-venv}/bin:$PATH"

if ! command -v ansible-playbook >/dev/null 2>&1; then
    apt-get update
    apt-get install -y ansible-core
fi

ansible-playbook --version
ansible-galaxy collection install -r "$ANSIBLE_DIR/requirements.yml"

cd "$ANSIBLE_DIR"
ansible-playbook -i localhost, -c local site.yml
