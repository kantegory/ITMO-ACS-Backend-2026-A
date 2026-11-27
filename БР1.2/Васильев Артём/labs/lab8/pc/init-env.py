"""Create a local Grafana bootstrap password without replacing existing credentials."""
from pathlib import Path
import os
import secrets

path = Path(__file__).resolve().with_name('.env')
try:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
except FileExistsError:
    raise SystemExit('.env already exists; kept unchanged.')
with os.fdopen(fd, 'w', encoding='utf-8') as stream:
    stream.write(f'GRAFANA_ADMIN_PASSWORD={secrets.token_urlsafe(32)}\n')
print('Created .env; read it locally for the admin password. Do not commit it.')
