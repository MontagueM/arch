bl_info = {
    "name": "Arch Blender",
    "author": "https://github.com/MontagueM",
    "version": (0, 1),
    "blender": (3, 0, 0),
    "location": "Console",
    "description": "Receives GLB files from arch and imports them into Blender.",
    "category": "Import-Export",
}

import bpy
import threading
import socket
from http.server import BaseHTTPRequestHandler, HTTPServer
import tempfile

PORT = 5666
server_thread = None

class GLBRequestHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/upload':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            with tempfile.NamedTemporaryFile(delete=False, suffix=".glb") as tmp_file:
                tmp_file.write(post_data)
                tmp_file_path = tmp_file.name
            try:
                bpy.ops.import_scene.gltf(filepath=tmp_file_path)
                self.send_response(204)
                self.end_headers()
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(f'Error importing model: {str(e)}'.encode())
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found.')

    def log_message(self, format, *args):
        pass

class ServerThread(threading.Thread):
    def __init__(self, host='localhost', port=PORT):
        super().__init__()
        self.server = HTTPServer((host, port), GLBRequestHandler)
        self.daemon = True

    def run(self):
        self.server.serve_forever()

    def shutdown(self):
        self.server.shutdown()

def check_multiple_instances():
    try:
        test_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        test_socket.bind(('localhost', PORT))
        test_socket.close()
        return False
    except socket.error:
        return True

def alert_multiple_instances():
    print("More than one instance of Blender is running. Please close the additional instances.")

def register():
    global server_thread
    if check_multiple_instances():
        alert_multiple_instances()
        return
    server_thread = ServerThread()
    server_thread.start()
    bpy.app.timers.register(lambda: None)

def unregister():
    global server_thread
    bpy.app.timers.unregister(lambda: None)
    server_thread.shutdown()

if __name__ == "__main__":
    register()
