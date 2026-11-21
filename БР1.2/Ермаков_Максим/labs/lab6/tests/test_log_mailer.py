"""Checks for log selection, safe email formatting and failure handling."""
import importlib.util
import io
import json
import os
from pathlib import Path
import unittest
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

spec = importlib.util.spec_from_file_location('log_mailer', Path(__file__).resolve().parents[1] / 'scripts/log_mailer.py')
mailer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mailer)


class MailerTests(unittest.TestCase):
    def test_loki_selects_only_affected_service_and_orders_logs(self):
        data = {'status': 'success', 'data': {'result': [
            {'stream': {'container': 'lab4-menu-service-1'},
             'values': [['2000000000', 'newer'], ['1000000000', 'older']]},
        ]}}
        with patch.object(mailer, 'urlopen', return_value=io.BytesIO(json.dumps(data).encode())) as request:
            lines, note = mailer.service_logs('menu-service')
        query = parse_qs(urlparse(request.call_args.args[0]).query)
        self.assertEqual(query['query'], ['{job="docker",project="lab4",service="menu-service"}'])
        self.assertEqual(query['limit'], ['20'])
        self.assertEqual(query['direction'], ['backward'])
        self.assertTrue(lines[0].endswith('older'))
        self.assertTrue(lines[1].endswith('newer'))
        self.assertIn('[lab4-menu-service-1]', lines[0])
        self.assertFalse(note)

    def test_unknown_service_does_not_fetch_another_containers_logs(self):
        with patch.object(mailer, 'urlopen') as request:
            lines, note = mailer.service_logs('menu-service"} or {job="docker')
        request.assert_not_called()
        self.assertFalse(lines)
        self.assertIn('не определён', note)

    def test_maximum_twenty_lines_even_for_multiline_entries(self):
        data = {'status': 'success', 'data': {'result': [
            {'stream': {'container': 'lab4-menu-service-1'},
             'values': [['1000000000', '\n'.join('line-' + str(n) for n in range(50))]]},
        ]}}
        with patch.object(mailer, 'urlopen', return_value=io.BytesIO(json.dumps(data).encode())):
            lines, _ = mailer.service_logs('menu-service')
        self.assertEqual(len(lines), 20)
        self.assertTrue(lines[-1].endswith('line-49'))

    def test_credential_formats_are_masked(self):
        for text, secret in [
            ('POSTGRES_PASSWORD=example-private-value', 'example-private-value'),
            ('{"refreshToken":"example-private-value"}', 'example-private-value'),
            ('amqp://username:example-private-value@rabbitmq:5672/', 'example-private-value'),
            ('Authorization: Bearer example-private-value', 'example-private-value'),
            ('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.fakeSignature', 'fakeSignature'),
        ]:
            with self.subTest(text=text):
                self.assertNotIn(secret, mailer.redact(text))
        self.assertEqual(mailer.redact('menu-service listening on port 8203'), 'menu-service listening on port 8203')

    def test_loki_failure_still_produces_an_alert(self):
        payload = {'status': 'firing', 'alerts': [{'status': 'firing',
                   'labels': {'service': 'menu-service'}, 'startsAt': '2026-11-14T10:00:00Z'}]}
        with patch.object(mailer, 'urlopen', side_effect=TimeoutError()):
            subject, body, count = mailer.build_message(payload)
        self.assertIn('firing menu-service', subject)
        self.assertIn('Журналы временно недоступны', body)
        self.assertEqual(count, 0)

    def test_smtp_uses_tls_fixed_recipient_and_safe_html(self):
        env = {'SMTP_ENABLED': 'true', 'SMTP_USER': 'sender@example.com',
               'SMTP_FROM_ADDRESS': 'sender@example.com', 'ALERT_EMAIL': 'recipient@example.com',
               'SMTP_HOST': 'smtp.gmail.com:587'}
        with patch.dict(os.environ, env), patch.object(mailer.Path, 'read_text', return_value='fake-smtp-password'), patch.object(mailer.smtplib, 'SMTP') as smtp_class:
            mailer.send_message('A test subject', '<script>fake-smtp-password</script>')
        smtp = smtp_class.return_value.__enter__.return_value
        smtp.starttls.assert_called_once()
        self.assertIsNotNone(smtp.starttls.call_args.kwargs['context'])
        args, kwargs = smtp.send_message.call_args
        self.assertEqual(kwargs['to_addrs'], ['recipient@example.com'])
        self.assertNotIn('fake-smtp-password', args[0].as_string())
        self.assertIn('&lt;script&gt;', args[0].get_body(preferencelist=('html',)).get_content())

    def test_test_message_does_not_claim_a_real_outage(self):
        payload = {'alerts': [{'status': 'firing', 'labels': {
            'service': 'menu-service', 'alertname': 'TestAlert'}}]}
        with patch.object(mailer, 'service_logs', return_value=(['a genuine log line'], '')):
            subject, body, _ = mailer.build_message(payload)
        self.assertIn('TEST', subject)
        self.assertIn('не останавливался', body)
        self.assertNotIn('menu-service недоступен', body)


if __name__ == '__main__':
    unittest.main()
