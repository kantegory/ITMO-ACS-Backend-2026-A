import os
import secrets
from pathlib import Path

path = Path('/etc/restaurant-lab4/app.env')
password = secrets.token_hex(32)
values = {
    'JWT_SECRET': secrets.token_hex(32),
    'SERVICE_KEY': secrets.token_hex(32),
    'RABBITMQ_PASSWORD': password,
    'RABBITMQ_DEFAULT_USER': 'restaurant',
    'RABBITMQ_DEFAULT_PASS': password,
    'RABBITMQ_URL': f'amqp://restaurant:{password}@rabbitmq:5672',
    'RABBITMQ_ENABLED': 'true',
    'AUTH_SERVICE_URL': 'http://auth-service:3001',
    'RESTAURANT_SERVICE_URL': 'http://restaurant-service:3002',
    'RESERVATION_SERVICE_URL': 'http://reservation-service:3003',
}
os.umask(0o077)
with path.open('x', encoding='utf-8') as stream:
    for key, value in values.items():
        stream.write(f'{key}={value}\n')
