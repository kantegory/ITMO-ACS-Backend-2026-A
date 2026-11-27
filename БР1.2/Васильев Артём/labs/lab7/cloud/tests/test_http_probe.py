"""The real deployment probe must tolerate NodePort rule propagation."""
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
import subprocess
import shlex
import threading
import unittest


class DeploymentProbe(unittest.TestCase):
    def test_retries_an_empty_reply_during_ingress_startup(self):
        source = (Path(__file__).resolve().parents[1] / 'scripts/deploy.sh').read_text(encoding='utf-8')
        command = next(line for line in source.splitlines() if line.startswith('curl '))

        class Handler(BaseHTTPRequestHandler):
            attempts = 0

            def do_GET(self):
                Handler.attempts += 1
                if Handler.attempts == 1:
                    self.close_connection = True
                    return
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'[]')

            def log_message(self, format, *args):
                pass

        server = HTTPServer(('127.0.0.1', 0), Handler)
        worker = threading.Thread(target=server.serve_forever, daemon=True)
        worker.start()
        command = command.replace('127.0.0.1:30080', f'127.0.0.1:{server.server_port}')
        try:
            result = subprocess.run(shlex.split(command.split(' >')[0]), capture_output=True, text=True, timeout=20)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertGreaterEqual(Handler.attempts, 2)
        finally:
            server.shutdown()
            worker.join(timeout=2)
            server.server_close()

    def test_waits_for_a_temporarily_refused_connection(self):
        source = (Path(__file__).resolve().parents[1] / 'scripts/deploy.sh').read_text(encoding='utf-8')
        command = next(line for line in source.splitlines() if line.startswith('curl '))

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'[]')

            def log_message(self, format, *args):
                pass

        server = HTTPServer(('127.0.0.1', 0), Handler, bind_and_activate=False)
        server.server_bind()
        server.timeout = 0.1
        stop = threading.Event()

        def serve_later():
            if stop.wait(3):
                return
            server.server_activate()
            while not stop.is_set():
                server.handle_request()

        worker = threading.Thread(target=serve_later, daemon=True)
        worker.start()
        command = command.replace('127.0.0.1:30080', f'127.0.0.1:{server.server_port}')
        try:
            result = subprocess.run(shlex.split(command.split(' >')[0]), capture_output=True, text=True, timeout=20)
            self.assertEqual(result.returncode, 0, result.stderr)
        finally:
            stop.set()
            worker.join(timeout=2)
            server.server_close()


if __name__ == '__main__':
    unittest.main()
