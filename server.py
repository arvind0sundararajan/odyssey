#!/usr/bin/env python3
"""
The Apartment Odyssey — Edge WebAR Server (runs on Raspberry Pi 'luna' or Mac)
Zero external dependencies required (uses Python 3 standard library).
"""

import json
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
PLACEMENTS_FILE = os.path.join(ROOT_DIR, "placements.json")


class OdysseyHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def end_headers(self):
        # Prevent caching during live development/tuning
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if self.path.startswith("/api/placements"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            try:
                with open(PLACEMENTS_FILE, "r", encoding="utf-8") as f:
                    self.wfile.write(f.read().encode("utf-8"))
            except Exception:
                self.wfile.write(b"{}")
            return
        return super().do_GET()

    def do_POST(self):
        if self.path.startswith("/api/placements"):
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
            try:
                incoming = json.loads(raw)
                current = {}
                if os.path.exists(PLACEMENTS_FILE):
                    with open(PLACEMENTS_FILE, "r", encoding="utf-8") as f:
                        current = json.load(f)
                current.update(incoming)
                with open(PLACEMENTS_FILE, "w", encoding="utf-8") as f:
                    json.dump(current, f, indent=2)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True, "placements": current}).encode("utf-8"))
            except Exception as e:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": False, "error": str(e)}).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    server = ThreadingHTTPServer(("0.0.0.0", port), OdysseyHandler)
    print(f"🏛️  The Apartment Odyssey WebAR Server running at http://localhost:{port}")
    print(f"🔧 Tuner Mode: http://localhost:{port}/?tune=1")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        server.server_close()
