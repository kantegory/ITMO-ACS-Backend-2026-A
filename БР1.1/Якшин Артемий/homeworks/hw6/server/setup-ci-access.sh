#!/usr/bin/env bash
# ДЗ6: настройка доступа CI к серверу (однократно, от root).
#   bash setup-ci-access.sh "<публичный ключ CI>"
# Создаёт пользователя rb-deploy без пароля и shell-доступа: его SSH-ключ может только
# вызвать deploy-gate.sh, а тот — только /opt/rb-sem2/bin/deploy.sh через sudo.
set -euo pipefail
PUBKEY=${1:?usage: setup-ci-access.sh "<ssh public key>"}
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=/opt/rb-sem2

id rb-deploy >/dev/null 2>&1 || useradd --system --create-home --shell /bin/bash --comment "CI deploy (forced command)" rb-deploy
passwd -l rb-deploy >/dev/null

install -d -o root -g root -m 0755 "$ROOT/bin"
install -o root -g root -m 0755 "$HERE/deploy.sh" "$ROOT/bin/deploy.sh"
install -o root -g root -m 0755 "$HERE/deploy-gate.sh" "$ROOT/bin/deploy-gate.sh"

tmp=$(mktemp)
echo 'rb-deploy ALL=(root) NOPASSWD: /opt/rb-sem2/bin/deploy.sh' > "$tmp"
visudo -cf "$tmp" >/dev/null && install -o root -g root -m 0440 "$tmp" /etc/sudoers.d/rb-deploy
rm -f "$tmp"

install -d -o rb-deploy -g rb-deploy -m 0700 /home/rb-deploy/.ssh
echo "restrict,command=\"$ROOT/bin/deploy-gate.sh\" $PUBKEY" > /home/rb-deploy/.ssh/authorized_keys
chown rb-deploy:rb-deploy /home/rb-deploy/.ssh/authorized_keys
chmod 0600 /home/rb-deploy/.ssh/authorized_keys
echo "rb-deploy configured"
