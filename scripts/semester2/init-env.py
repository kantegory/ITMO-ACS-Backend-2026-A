#!/usr/bin/env python3
"""Generate a private environment once; never overwrite existing credentials."""
from pathlib import Path
import secrets, os
p = Path(__file__).resolve().parents[2] / 'infra/semester2/secrets.env'
p.parent.mkdir(parents=True, exist_ok=True)
fd = os.open(p, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, 'w') as f:
    for key in ['JWT_SECRET', 'SERVICE_TOKEN', 'DB_PASSWORD', 'GRAFANA_PASSWORD']:
        f.write(f'{key}={secrets.token_hex(32)}\n')
print(f'Created {p}; keep private.')
