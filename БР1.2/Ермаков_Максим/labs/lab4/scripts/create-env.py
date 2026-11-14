"""Create private deployment secrets once. Never print their values."""
from pathlib import Path
import os
import secrets

path = Path(__file__).resolve().parents[1] / '.env'
keys = ['DB_PASSWORD', 'RABBITMQ_PASSWORD', 'JWT_SECRET_KEY',
        'JWT_REFRESH_SECRET_KEY', 'ADMIN_PASSWORD']
fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, 'w') as stream:
    for key in keys:
        stream.write(f'{key}={secrets.token_hex(32)}\n')
print('Created .env with random secrets; permissions: 600. Values hidden.')
