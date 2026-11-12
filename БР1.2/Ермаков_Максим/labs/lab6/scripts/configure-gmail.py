#!/usr/bin/env python3
"""Проверяет Gmail SMTP и сохраняет пароль приложения без вывода секрета.

Запускать вручную в SSH-терминале сервера. Отправку в Grafana этот шаг
не включает: после него применяются настройки и проверяются реальные письма.
"""
import argparse
import getpass
import os
from pathlib import Path
import smtplib
import ssl
import sys
import tempfile
import warnings


def main():
    root = Path(__file__).resolve().parents[1]
    if os.geteuid() != 0:
        raise SystemExit('Запустите скрипт на сервере от root.')
    if not sys.stdin.isatty() or not sys.stderr.isatty():
        raise SystemExit('Нужен интерактивный SSH-терминал: скрытый ввод обязателен.')
    env_path = root / '.env'
    if not env_path.is_file():
        raise SystemExit('Сначала выполните первоначальную подготовку мониторинга.')
    lines = env_path.read_text().splitlines()
    values = dict(line.split('=', 1) for line in lines if '=' in line and not line.startswith('#'))
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sender', default=values.get('ALERT_EMAIL', ''), help='Gmail отправителя; по умолчанию адрес получателя из .env')
    args = parser.parse_args()
    sender = args.sender.strip()
    if not sender.endswith('@gmail.com') or any(c.isspace() for c in sender):
        raise SystemExit('Укажите личный Gmail отправителя через --sender.')
    print('Для SMTP будет использован Gmail из настроек. Письмо на этом шаге не отправляется.')
    warnings.simplefilter('error', getpass.GetPassWarning)
    password = ''.join(getpass.getpass('Вставьте 16-символьный пароль ПРИЛОЖЕНИЯ Google (ввод скрыт): ').split())
    if len(password) != 16:
        raise SystemExit('Ожидается 16-символьный пароль приложения. Настройки не изменены.')
    try:
        with smtplib.SMTP('smtp.gmail.com', 587, timeout=20) as smtp:
            smtp.ehlo()
            smtp.starttls(context=ssl.create_default_context())
            smtp.ehlo()
            smtp.login(sender, password)
    except smtplib.SMTPAuthenticationError as error:
        raise SystemExit(f'Gmail отклонил вход (SMTP {error.smtp_code}). Проверьте аккаунт и пароль приложения. Настройки не изменены.') from None
    except (OSError, smtplib.SMTPException):
        raise SystemExit('Не удалось завершить безопасное подключение к Gmail SMTP. Настройки не изменены.') from None
    secret_dir = root / 'secrets'
    secret_dir.mkdir(mode=0o700, exist_ok=True)
    secret_dir.chmod(0o700)
    fd, temporary = tempfile.mkstemp(prefix='.smtp-', dir=secret_dir)
    try:
        with os.fdopen(fd, 'w') as file:
            file.write(password)
        os.chown(temporary, 472, 472)
        os.chmod(temporary, 0o400)
        os.replace(temporary, secret_dir / 'smtp_password')
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    updates = {'SMTP_HOST': 'smtp.gmail.com:587', 'SMTP_USER': sender, 'SMTP_FROM_ADDRESS': sender}
    output = []
    for line in lines:
        key = line.split('=', 1)[0]
        if key in updates:
            output.append(key + '=' + updates.pop(key))
        else:
            output.append(line)
    output.extend(key + '=' + value for key, value in updates.items())
    env_path.write_text('\n'.join(output) + '\n')
    env_path.chmod(0o600)
    print('Gmail SMTP: вход по TLS подтверждён.')
    print('Пароль сохранён в закрытом файле на сервере; в командную строку и Git он не попал.')
    print('Настройки отправителя подготовлены. Для применения требуется пересоздать контейнер Grafana.')


if __name__ == '__main__':
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        raise SystemExit('\nВвод отменён.') from None
