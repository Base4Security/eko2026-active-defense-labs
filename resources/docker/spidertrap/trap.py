#!/usr/bin/env python3
"""
Laberinto de enlaces: cada página devuelve enlaces a páginas nuevas
generadas al vuelo, así que un crawler nunca termina de recorrer el sitio.

En el curso ilustra el objetivo Affect de MITRE Engage: no se bloquea el
reconocimiento, se lo degrada — y a diferencia de un bloqueo, esto no le
informa al adversario que fue detectado.
"""
import random
import string
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import datetime

WORDS = ["informe", "backup", "conciliacion", "legacy", "export", "anexo",
         "balance", "auditoria", "prod", "staging", "archivo", "cierre"]


def slug():
    return f"{random.choice(WORDS)}-{''.join(random.choices(string.digits, k=4))}"


class Trap(BaseHTTPRequestHandler):
    def do_GET(self):
        ts = datetime.datetime.now().isoformat(timespec="seconds")
        ua = self.headers.get("User-Agent", "-")
        print(f'{{"ts":"{ts}","event":"spidertrap_hit","src_ip":"{self.client_address[0]}",'
              f'"path":"{self.path}","user_agent":"{ua}"}}', flush=True)

        links = "\n".join(
            f'    <li><a href="/{slug()}.html">{slug()}</a></li>'
            for _ in range(random.randint(8, 15))
        )
        body = f"""<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>Repositorio documental</title></head>
<body>
  <h1>Repositorio documental interno</h1>
  <p>Indice generado automaticamente. No modificar.</p>
  <ul>
{links}
  </ul>
</body></html>"""
        payload = body.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args):
        pass                                    # ya registramos en JSON arriba


if __name__ == "__main__":
    print("[*] spidertrap escuchando en 0.0.0.0:8000", flush=True)
    ThreadingHTTPServer(("0.0.0.0", 8000), Trap).serve_forever()
