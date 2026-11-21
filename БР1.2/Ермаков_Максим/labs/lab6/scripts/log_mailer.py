#!/usr/bin/env python3
"""Receive Grafana alerts, add the affected service's Loki logs and email them."""
import hashlib
import html
import json
import os
import re
import smtplib
import ssl
import time
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

SERVICES = {
    'api-gateway', 'identity-service', 'catalog-service',
    'menu-service', 'reservation-service', 'review-service',
}
MSK = timezone(timedelta(hours=3), 'MSK')
LOG_LIMIT = 20
MAX_LINE = 800
MAX_REQUEST = 65536
SENT = {}


def redact(text):
    """Keep useful text while masking common credential formats."""
    text = re.sub(r'\x1b\[[0-?]*[ -/]*[@-~]', '', str(text))
    text = re.sub(r'(?i)(\b[a-z][a-z0-9+.-]*://)[^\s/@]+:[^\s/@]+@',
                  r'\1[REDACTED]@', text)
    text = re.sub(r'(?i)(\b(?:Bearer|Basic)\s+)[A-Za-z0-9._~+/=-]+',
                  r'\1[REDACTED]', text)
    text = re.sub(r'\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b',
                  '[REDACTED JWT]', text)
    text = re.sub(
        r'''(?ix)(["']?\b[\w-]*(?:password|passwd|pwd|secret|token|api[_-]?key|authorization|cookie)[\w-]*\b["']?\s*[:=]\s*)("[^"\n]*"|'[^'\n]*'|[^\s,;&}\]]+)''',
        r'\1[REDACTED]', text)
    return text


def moment(value):
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00')).astimezone(MSK).strftime('%d.%m.%Y %H:%M:%S MSK')
    except (ValueError, TypeError, AttributeError):
        return 'не указано'


def service_logs(service):
    if service not in SERVICES:
        return [], 'Сервис не определён; журналы других контейнеров не подбирались.'
    query = '{job="docker",project="lab4",service="' + service + '"}'
    params = urlencode({'query': query, 'since': '72h', 'limit': LOG_LIMIT, 'direction': 'backward'})
    try:
        with urlopen('http://loki:3100/loki/api/v1/query_range?' + params, timeout=5) as response:
            result = json.load(response)
        if result.get('status') != 'success':
            raise ValueError('Loki query failed')
        records = []
        for stream in result['data']['result']:
            container = stream['stream'].get('container', service)
            for timestamp, message in stream['values']:
                records.append((int(timestamp), container, message))
        records.sort(key=lambda item: item[0])
        lines = []
        for timestamp, container, message in records[-LOG_LIMIT:]:
            stamp = datetime.fromtimestamp(timestamp / 1_000_000_000, MSK).strftime('%d.%m.%Y %H:%M:%S MSK')
            for line in str(message).splitlines():
                clean = redact(line)
                if len(clean) > MAX_LINE:
                    clean = clean[:MAX_LINE] + ' … [строка сокращена]'
                lines.append(f'{stamp} [{container}] {clean}')
        return lines[-LOG_LIMIT:], '' if lines else 'Loki не вернул сообщений этого сервиса за последние 72 часа.'
    except Exception as error:
        # Deliver the alert even if the log store is temporarily unavailable.
        print(f'Loki unavailable service={service} error={type(error).__name__}', flush=True)
        return [], 'Журналы временно недоступны: не удалось получить ответ Loki.'


def build_message(payload):
    alerts = payload.get('alerts')
    if not isinstance(alerts, list) or not 1 <= len(alerts) <= 20:
        raise ValueError('Expected 1 to 20 alerts')
    names, sections = [], []
    total_lines = 0
    for alert in alerts:
        if not isinstance(alert, dict):
            raise ValueError('Invalid alert')
        labels = alert.get('labels') or {}
        service = labels.get('service', '')
        if service not in SERVICES:
            service = ''
        status = alert.get('status', payload.get('status', 'firing'))
        if status not in ('firing', 'resolved'):
            raise ValueError('Invalid status')
        name = service or 'сервис не определён'
        names.append(service or 'unknown-service')
        lines, note = service_logs(service)
        total_lines += len(lines)
        is_test = labels.get('alertname') == 'TestAlert'
        intro = (f'Тестовое уведомление для {name}. Контейнер для этого письма не останавливался.'
                 if is_test else f'Сервис {name} снова доступен.' if status == 'resolved'
                 else f'Сервис {name} недоступен.')
        details = [intro, 'Сервер: it-garage', 'Состояние оповещения: ' + status,
                   'Начало события: ' + moment(alert.get('startsAt'))]
        if not is_test and status == 'firing':
            description = (alert.get('annotations') or {}).get('description', '')
            if description:
                details.append(redact(description)[:800])
        if status == 'resolved':
            details.append('Восстановление: ' + moment(alert.get('endsAt')))
        details.extend(['', 'Последние строки журнала контейнера из Loki',
                        'До 20 строк за последние 72 часа; время указано по Москве.', ''])
        details.extend(lines or [note])
        sections.append('\n'.join(details))
    status = 'firing' if any(a.get('status', payload.get('status', 'firing')) == 'firing' for a in alerts) else 'resolved'
    prefix = 'TEST — письмо с логами' if any((a.get('labels') or {}).get('alertname') == 'TestAlert' for a in alerts) else status
    subject = '[it-garage LR6] ' + prefix + ' ' + ', '.join(dict.fromkeys(names))
    return subject, '\n\n' + ('\n\n' + '-' * 35 + '\n\n').join(sections), total_lines


def send_message(subject, body):
    if os.environ.get('SMTP_ENABLED', 'false').lower() != 'true':
        raise RuntimeError('SMTP is disabled')
    password = Path('/run/secrets/smtp_password').read_text().strip()
    if not password:
        raise RuntimeError('SMTP secret is empty')
    # The SMTP credential must never end up in a log excerpt or HTML body.
    body = body.replace(password, '[REDACTED]')
    recipient = os.environ['ALERT_EMAIL']
    sender = os.environ['SMTP_FROM_ADDRESS']
    message = EmailMessage()
    message['Subject'] = subject
    message['From'] = f'it-garage monitoring <{sender}>'
    message['To'] = recipient
    message.set_content(body)
    message.add_alternative(
        '<!doctype html><html><body><pre style="font-family:monospace;white-space:pre-wrap">'
        + html.escape(body) + '</pre></body></html>', subtype='html')
    host, port = os.environ.get('SMTP_HOST', 'smtp.gmail.com:587').rsplit(':', 1)
    with smtplib.SMTP(host, int(port), timeout=15) as smtp:
        smtp.ehlo()
        smtp.starttls(context=ssl.create_default_context())
        smtp.ehlo()
        smtp.login(os.environ['SMTP_USER'], password)
        smtp.send_message(message, from_addr=sender, to_addrs=[recipient])


def notification_key(payload):
    # Grafana may retry a webhook. Suppress the same delivery for five minutes,
    # while allowing the configured four-hour reminder and later incidents.
    values = [(a.get('fingerprint'), a.get('status', payload.get('status')),
               a.get('startsAt'), a.get('labels')) for a in payload.get('alerts', [])]
    return hashlib.sha256(json.dumps(values, sort_keys=True).encode()).hexdigest()


class Handler(BaseHTTPRequestHandler):
    def setup(self):
        super().setup()
        self.connection.settimeout(10)

    def log_message(self, *args):
        pass

    def reply(self, code, data):
        data = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path != '/health':
            return self.reply(404, {'status': 'not found'})
        self.reply(200, {'status': 'ok'})

    def do_POST(self):
        if self.path != '/alerts':
            return self.reply(404, {'status': 'not found'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= MAX_REQUEST:
                return self.reply(413, {'status': 'request too large or empty'})
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                raise ValueError('Expected object')
            subject, body, line_count = build_message(payload)
            key = notification_key(payload)
        except (ValueError, TypeError, KeyError, AttributeError):
            return self.reply(400, {'status': 'invalid alert payload'})
        now = time.monotonic()
        for old in [k for k, until in SENT.items() if until < now]:
            del SENT[old]
        if key in SENT:
            return self.reply(200, {'status': 'already sent'})
        try:
            send_message(subject, body)
        except Exception as error:
            print(f'Email delivery failed error={type(error).__name__}', flush=True)
            return self.reply(503, {'status': 'email delivery failed'})
        SENT[key] = time.monotonic() + 300
        names = sorted({(a.get('labels') or {}).get('service', 'unknown') for a in payload['alerts']})
        print(json.dumps({'event': 'email_sent', 'status': payload.get('status'),
                          'services': names, 'log_lines': line_count}, ensure_ascii=False), flush=True)
        self.reply(200, {'status': 'sent', 'log_lines': line_count})


if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 8080), Handler)
    server.timeout = 30
    print('Log mailer listening on internal port 8080', flush=True)
    server.serve_forever()
