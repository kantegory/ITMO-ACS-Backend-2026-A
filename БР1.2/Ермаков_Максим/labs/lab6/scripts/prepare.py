#!/usr/bin/env python3
"""Однократная подготовка локальных секретов на сервере, без их печати."""
import argparse
import json
import os
from pathlib import Path
import secrets
import subprocess

root = Path(__file__).resolve().parents[1]
if os.geteuid() != 0:
    raise SystemExit("Запустите подготовку на сервере от root.")
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--alert-email', help='Адрес получателя при первом создании .env')
args = parser.parse_args()
env = root / ".env"
if not env.exists() and not args.alert_email:
    parser.error('При первом запуске укажите --alert-email с адресом получателя.')
secret_dir = root / "secrets"
secret_dir.mkdir(mode=0o700, exist_ok=True)
secret_dir.chmod(0o700)
for name, value in [
    ("grafana_admin_password", secrets.token_urlsafe(24)),
    ("smtp_password", ""),
]:
    target = secret_dir / name
    if not target.exists():
        target.write_text(value)
    os.chown(target, 472, 472)
    target.chmod(0o400)

if not env.exists():
    network = json.loads(subprocess.check_output(["docker", "network", "inspect", "bridge"]))
    gateway = network[0]["IPAM"]["Config"][0]["Gateway"]
    env.write_text(
        f"DOCKER_BRIDGE_IP={gateway}\n"
        f"ALERT_EMAIL={args.alert_email}\n"
        "SMTP_ENABLED=false\n"
        "SMTP_HOST=smtp.gmail.com:587\n"
        "SMTP_USER=\n"
        "SMTP_FROM_ADDRESS=monitoring@example.invalid\n"
    )
env.chmod(0o600)
print("Конфигурация окружения и секреты подготовлены. Значения секретов не выводились.")
