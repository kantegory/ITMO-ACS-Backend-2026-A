"""Create missing per-service secrets without printing or rotating existing values."""
import os
from pathlib import Path
import secrets
import sys
from urllib.parse import quote


def ensure_secrets(path):
    values = dict(line.split('=', 1) for line in path.read_text().splitlines() if '=' in line) if path.exists() else {}
    keys = ['JWT_SECRET_KEY', 'SERVICE_TOKEN', 'POSTGRES_PASSWORD', 'RABBITMQ_PASSWORD', 'GRAFANA_ADMIN_PASSWORD']
    keys += [role.upper() + '_DB_PASSWORD' for role in ['users', 'companies', 'dictionaries', 'vacancies', 'resumes', 'applications', 'interactions']]
    for key in keys:
        values.setdefault(key, secrets.token_hex(24))
    values.setdefault('RABBITMQ_USER', 'jobplatform')
    values.setdefault('RABBITMQ_URL', 'amqp://jobplatform:' + quote(values['RABBITMQ_PASSWORD'], safe='') + '@rabbitmq:5672')
    temporary = path.with_suffix('.new')
    descriptor = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(descriptor, 'w', encoding='utf-8', newline='\n') as output:
        output.write(''.join(key + '=' + value + '\n' for key, value in values.items()))
    os.chmod(temporary, 0o600)
    os.replace(temporary, path)


if __name__ == '__main__':
    ensure_secrets(Path(sys.argv[1]))
