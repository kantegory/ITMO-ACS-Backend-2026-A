#!/usr/bin/env bash
# ЛР4: предварительная настройка удалённого сервера (Ubuntu 22.04 / 24.04, Debian 12).
#
#   - обновление системы, базовые утилиты, часовой пояс;
#   - Docker Engine + docker compose plugin из официального репозитория Docker;
#   - пользователь deploy (группа docker, SSH-ключ, sudo только на reload nginx);
#   - swap-файл (на маленьких ВМ сборка Go-образов без него может упасть по OOM);
#   - firewall ufw: наружу открыты только SSH и HTTP/HTTPS;
#   - nginx (конфиг сайта ставит setup-nginx.sh).
#
# Запуск (от root):
#   sudo SSH_PUBKEY="$(cat ~/.ssh/id_ed25519.pub)" bash deploy/scripts/bootstrap.sh
# Скрипт идемпотентен — его можно запускать повторно.
#
# На уже работающем сервере (например, рядом с VPN) скрипт ничего не ломает:
#   - SKIP_UPGRADE=true — не делать apt upgrade (не перезапускать чужие сервисы);
#   - если Docker уже установлен, daemon.json не трогается и docker не перезапускается
#     (ротация логов наших контейнеров задана в docker-compose.yaml);
#   - если ufw уже включён, политики по умолчанию не меняются — только добавляются правила;
#   - часовой пояс меняется, только если явно задан TIMEZONE.
set -euo pipefail

DEPLOY_USER=${DEPLOY_USER:-deploy}
APP_DIR=${APP_DIR:-/opt/rental}
SWAP_SIZE=${SWAP_SIZE:-4G}
TIMEZONE=${TIMEZONE:-}
SKIP_UPGRADE=${SKIP_UPGRADE:-false}
DISABLE_PASSWORD_AUTH=${DISABLE_PASSWORD_AUTH:-false}

log() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }

[[ $EUID -eq 0 ]] || { echo "Запустите от root (sudo)"; exit 1; }
# shellcheck disable=SC1091
. /etc/os-release
[[ "$ID" == "ubuntu" || "$ID" == "debian" ]] || { echo "Поддерживаются Ubuntu/Debian, а тут $ID"; exit 1; }

log "1/7 Обновление пакетов и базовые утилиты"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg git rsync jq htop ufw nginx
# на чужом рабочем сервере не обновляем пакеты и не включаем автообновления
if [[ "$SKIP_UPGRADE" != "true" ]]; then
  apt-get upgrade -y
  apt-get install -y unattended-upgrades
fi
[[ -z "$TIMEZONE" ]] || timedatectl set-timezone "$TIMEZONE"

log "2/7 Docker Engine + compose plugin"
DOCKER_FRESH=false
if ! command -v docker >/dev/null 2>&1; then
  DOCKER_FRESH=true
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL "https://download.docker.com/linux/$ID/gpg" -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/$ID $VERSION_CODENAME stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
# ротация логов для всех контейнеров по умолчанию — только на свежей установке,
# чтобы не перезапускать docker с уже работающими чужими контейнерами
if [[ "$DOCKER_FRESH" == "true" && ! -f /etc/docker/daemon.json ]]; then
  cat > /etc/docker/daemon.json <<'JSON'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
JSON
  systemctl restart docker
else
  echo "docker уже был установлен — daemon.json и перезапуск пропущены"
fi
systemctl enable docker >/dev/null

log "3/7 Пользователь $DEPLOY_USER"
id "$DEPLOY_USER" >/dev/null 2>&1 || adduser --disabled-password --gecos "" "$DEPLOY_USER"
usermod -aG docker "$DEPLOY_USER"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
AUTH_KEYS="/home/$DEPLOY_USER/.ssh/authorized_keys"
touch "$AUTH_KEYS" && chown "$DEPLOY_USER:$DEPLOY_USER" "$AUTH_KEYS" && chmod 600 "$AUTH_KEYS"
if [[ -n "${SSH_PUBKEY:-}" ]] && ! grep -qxF "$SSH_PUBKEY" "$AUTH_KEYS"; then
  echo "$SSH_PUBKEY" >> "$AUTH_KEYS"
fi
# deploy может только проверить и перезагрузить nginx (нужно setup-nginx.sh из CI)
cat > "/etc/sudoers.d/90-$DEPLOY_USER" <<SUDO
$DEPLOY_USER ALL=(root) NOPASSWD: /usr/sbin/nginx -t, /usr/bin/systemctl reload nginx, /usr/bin/install -m 644 * /etc/nginx/sites-available/rental, /usr/bin/ln -sf /etc/nginx/sites-available/rental /etc/nginx/sites-enabled/rental, /usr/bin/rm -f /etc/nginx/sites-enabled/default
SUDO
chmod 440 "/etc/sudoers.d/90-$DEPLOY_USER"
visudo -cf "/etc/sudoers.d/90-$DEPLOY_USER" >/dev/null
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_DIR"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"

log "4/7 Swap $SWAP_SIZE"
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l "$SWAP_SIZE" /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
sysctl -q -w vm.swappiness=10
echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf

log "5/7 Firewall (ufw)"
UFW_WAS_ACTIVE=false
ufw status | grep -q "Status: active" && UFW_WAS_ACTIVE=true
if [[ "$UFW_WAS_ACTIVE" == "false" ]]; then
  ufw default deny incoming >/dev/null
  ufw default allow outgoing >/dev/null
fi
ufw allow OpenSSH >/dev/null
ufw allow 'Nginx Full' >/dev/null
# Prometheus из docker-сети (bridge br-rental, см. docker-compose.yaml) ходит к
# node-exporter, который слушает :9100 в сети хоста. Снаружи порт закрыт.
ufw allow in on br-rental to any port 9100 proto tcp comment 'node-exporter <- prometheus' >/dev/null
[[ "$UFW_WAS_ACTIVE" == "true" ]] || ufw --force enable >/dev/null
# ВАЖНО: порты, опубликованные docker'ом (ports:), обходят ufw — поэтому в
# docker-compose.yaml всё публикуется только на 127.0.0.1.

log "6/7 SSH"
if [[ "$DISABLE_PASSWORD_AUTH" == "true" && -s "$AUTH_KEYS" ]]; then
  cat > /etc/ssh/sshd_config.d/90-hardening.conf <<'SSHD'
PasswordAuthentication no
PermitRootLogin prohibit-password
SSHD
  systemctl reload ssh || systemctl reload sshd
fi

log "7/7 nginx"
rm -f /etc/nginx/sites-enabled/default
systemctl enable --now nginx >/dev/null

log "Готово"
docker --version
docker compose version
nginx -v
ufw status verbose | head -20
echo "Дальше: скопируйте проект в $APP_DIR, создайте .env и запустите deploy/scripts/deploy.sh"
