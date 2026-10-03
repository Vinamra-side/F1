import json
import threading
import time
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer

from f1_relay import ForwardingWorker, parse_udp_targets


class _State:
    driver_name = "Test Driver"

    def snapshot(self):
        return {"timestamp": 1, "driverName": self.driver_name}

    def set_target_driver(self, *_args):
        pass


class _IngestHandler(BaseHTTPRequestHandler):
    received_ports = set()

    def do_POST(self):
        self.rfile.read(int(self.headers.get("Content-Length", 0)))
        self.received_ports.add(self.server.server_port)
        body = json.dumps({}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_args):
        pass


class MultiForwardingTest(unittest.TestCase):
    def test_parses_multiple_udp_targets(self):
        self.assertEqual(
            parse_udp_targets(["100.78.202.123:20777", "10.0.0.2:20777,100.78.202.123:20777"]),
            [("100.78.202.123", 20777), ("10.0.0.2", 20777)],
        )

    def test_each_target_receives_telemetry(self):
        servers = [HTTPServer(("127.0.0.1", 0), _IngestHandler) for _ in range(2)]
        workers = [
            ForwardingWorker(_State(), f"http://127.0.0.1:{server.server_port}", sync_hz=50)
            for server in servers
        ]
        for server in servers:
            threading.Thread(target=server.serve_forever, daemon=True).start()
        for worker in workers:
            worker.start()

        expected = {server.server_port for server in servers}
        deadline = time.time() + 2
        while _IngestHandler.received_ports != expected and time.time() < deadline:
            time.sleep(0.02)

        for worker in workers:
            worker.running = False
        for server in servers:
            server.shutdown()
            server.server_close()

        self.assertEqual(_IngestHandler.received_ports, expected)


if __name__ == "__main__":
    unittest.main()
