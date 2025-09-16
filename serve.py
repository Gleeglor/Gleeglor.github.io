import http.server
import mimetypes
import socketserver
import os

PORT = 8080
WEB_DIR = os.path.join(os.path.dirname(__file__), '.')
os.chdir(WEB_DIR)

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    print("Press Ctrl+C to stop the server.")
    httpd.serve_forever()
