#!/usr/bin/env python3
"""
Portal de Pagos · EkoFinance
═══════════════════════════════════════════════════════════════════════════

Esta es una aplicación REAL. Tiene usuarios que entran, pagos con
datos, documentos que se descargan y una API. Nada de lo que hay acá adentro
es un señuelo.

El engaño es lo que VOS le agregás encima, en seis lugares:

  1. archivos/              un documento tokenizado entre los reales
  2. config/.env            una credencial señuelo entre las de verdad
  3. config/senuelos.json   una ruta que se ve jugosa y no existe en la app
  4. data/usuarios.json     un usuario señuelo en el directorio
  5. static/robots.txt      un Disallow que invita a mirar
  6. static/app.js          una API key falsa en el bundle del navegador

Todo eso son archivos montados desde el disco: para plantar algo se edita un
archivo y listo, no hace falta entrar al contenedor ni reconstruir la imagen.

El log de acceso sale en JSON por línea a logs/access.log, listo para jq.
Las fechas de los documentos se reaplican al arrancar desde data/archivos.json,
porque git no las preserva. Sin dependencias: sólo biblioteca estándar.
"""

import html
import http.server
import json
import mimetypes
import os
import socketserver
import sys
import threading
import time
import urllib.parse
import uuid
from datetime import datetime, timezone

BASE = os.path.dirname(os.path.abspath(__file__))
PUERTO = int(os.environ.get("PUERTO", "8080"))

# ─── Rutas de los archivos que el alumno edita ──────────────────────────────
F_ENV = os.path.join(BASE, "config", ".env")
F_SENUELOS = os.path.join(BASE, "config", "senuelos.json")
F_USUARIOS = os.path.join(BASE, "data", "usuarios.json")
F_PAGOS = os.path.join(BASE, "data", "pagos.json")
F_FECHAS = os.path.join(BASE, "data", "archivos.json")
D_ARCHIVOS = os.path.join(BASE, "archivos")
D_STATIC = os.path.join(BASE, "static")
F_LOG = os.path.join(BASE, "logs", "access.log")

_lock = threading.Lock()
_sesiones = {}          # cookie -> usuario


# ════════════════════════════════════════════════════════════════════════════
# Carga de datos. Se relee en cada request a propósito: así el alumno planta
# algo, recarga el navegador, y lo ve — sin reiniciar el contenedor.
# ════════════════════════════════════════════════════════════════════════════

def leer_json(ruta, por_defecto):
    try:
        with open(ruta, encoding="utf-8") as fh:
            return json.load(fh)
    except Exception:
        return por_defecto


def leer_env():
    """Parser mínimo de .env. Devuelve dict CLAVE -> valor."""
    valores = {}
    try:
        with open(F_ENV, encoding="utf-8") as fh:
            for linea in fh:
                linea = linea.strip()
                if not linea or linea.startswith("#") or "=" not in linea:
                    continue
                k, v = linea.split("=", 1)
                valores[k.strip()] = v.strip().strip('"').strip("'")
    except Exception:
        pass
    return valores


def usuarios():
    return leer_json(F_USUARIOS, [])


def pagos():
    return leer_json(F_PAGOS, [])


def senuelos():
    """Rutas señuelo declaradas por el alumno.
    Formato: [{"ruta": "/admin-pagos", "titulo": "...", "cuerpo": "..."}]
    """
    return leer_json(F_SENUELOS, [])


def aplicar_fechas():
    """Reaplica las fechas de modificación de los documentos al arrancar.

    Git no guarda los mtimes, así que después de un clone todos los archivos
    del repositorio quedan con la fecha del checkout — y un repositorio de
    documentos donde TODO se modificó el mismo minuto se cae ante el primer
    `ls -la`. Las fechas reales viven en data/archivos.json.

    Los archivos que no estén en ese mapa conservan su fecha real. Para algo
    recién copiado eso es hoy, y en un listado donde el resto tiene meses se
    nota enseguida: si plantás un documento, dale una fecha que cierre.

    Es mejor esfuerzo. Si el montaje es de sólo lectura no pasa nada: el
    portal arranca igual.
    """
    mapa = leer_json(F_FECHAS, {})
    for nombre, cuando in mapa.items():
        if nombre.startswith("_"):
            continue
        ruta = os.path.join(D_ARCHIVOS, nombre)
        try:
            ts = datetime.strptime(cuando, "%Y-%m-%d %H:%M").timestamp()
            os.utime(ruta, (ts, ts))
        except Exception:
            pass


# ════════════════════════════════════════════════════════════════════════════
# Log de acceso · una línea JSON por request
# ════════════════════════════════════════════════════════════════════════════

def registrar(ip, metodo, ruta, estado, usuario, agente, bytes_, es_senuelo):
    evento = {
        "time": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
        "remote_addr": ip,
        "method": metodo,
        "path": ruta,
        "status": estado,
        "usuario": usuario or "-",
        "user_agent": agente or "-",
        "bytes": bytes_,
    }
    # Marcamos los toques a señuelos. El atacante no ve este log: es
    # instrumentación nuestra, y saber cuál de nuestros activos es un señuelo
    # es precisamente lo que nos deja medir la latencia en el E13.
    if es_senuelo:
        evento["senuelo"] = True
    linea = json.dumps(evento, ensure_ascii=False)
    with _lock:
        os.makedirs(os.path.dirname(F_LOG), exist_ok=True)
        with open(F_LOG, "a", encoding="utf-8") as fh:
            fh.write(linea + "\n")
    print(linea, flush=True)


# ════════════════════════════════════════════════════════════════════════════
# Plantilla HTML
# ════════════════════════════════════════════════════════════════════════════

CABECERA = """<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{titulo} · Portal de Pagos</title>
<link rel="stylesheet" href="/static/estilo.css">
</head><body>
<header class="barra">
  <a class="marca" href="/pagos">EkoFinance <span>· Pagos</span></a>
  <nav>
    <a href="/pagos">Pagos</a>
    <a href="/archivos">Documentos</a>
    <a href="/usuarios">Directorio</a>
    {admin}
  </nav>
  <div class="sesion">{sesion}</div>
</header>
<main>
"""

PIE = """</main>
<footer>
  <p>Portal de Pagos v2.4.1 &middot; migración en curso desde SIGCON &middot;
     dudas a <a href="mailto:pagos@ekofinance.local">pagos@ekofinance.local</a></p>
</footer>
<script src="/static/app.js"></script>
</body></html>
"""


def pagina(titulo, cuerpo, usuario=None, es_admin=False):
    if usuario:
        sesion = ('<span class="quien">%s</span> <a class="salir" href="/logout">Salir</a>'
                  % html.escape(usuario.get("nombre", usuario.get("usuario", ""))))
    else:
        sesion = '<a class="salir" href="/">Ingresar</a>'
    admin = '<a href="/admin">Administración</a>' if es_admin else ""
    return (CABECERA.format(titulo=html.escape(titulo), sesion=sesion, admin=admin)
            + cuerpo + PIE)


def e(v):
    return html.escape(str(v))


# ════════════════════════════════════════════════════════════════════════════
# Vistas
# ════════════════════════════════════════════════════════════════════════════

def vista_login(error=None):
    aviso = '<p class="error">%s</p>' % e(error) if error else ""
    return pagina("Ingreso", """
<div class="ingreso">
  <h1>Portal de Pagos</h1>
  <p class="bajada">Acceso restringido al personal de Tesorería y Contaduría.</p>
  %s
  <form method="post" action="/login">
    <label>Usuario<input name="usuario" autocomplete="username" autofocus></label>
    <label>Contraseña<input name="clave" type="password" autocomplete="current-password"></label>
    <button type="submit">Ingresar</button>
  </form>
  <p class="nota">¿Problemas para entrar? Mesa de ayuda interna, interno 2140.</p>
</div>
""" % aviso)


def vista_pagos(usuario):
    filas = []
    for c in pagos():
        filas.append(
            '<tr><td class="mono"><a href="/pagos/%s">%s</a></td>'
            '<td>%s</td><td>%s</td><td class="num">%s</td><td class="mono">%s</td>'
            '<td><span class="estado %s">%s</span></td><td>%s</td></tr>'
            % (e(c["id"]), e(c["id"]), e(c["fecha"]), e(c["contraparte"]),
               e("{:,.2f}".format(c["monto"]).replace(",", "·").replace(".", ",").replace("·", ".")),
               e(c["moneda"]), e(c["estado"].lower().replace(" ", "-")),
               e(c["estado"]), e(c["operador"])))
    return pagina("Pagos", """
<h1>Pagos</h1>
<p class="bajada">Pagos y transferencias del período en curso.
   Los cerrados se archivan a los 90 días.</p>
<table class="grilla">
  <thead><tr><th>ID</th><th>Fecha</th><th>Contraparte</th><th>Monto</th>
             <th>Mon.</th><th>Estado</th><th>Operador</th></tr></thead>
  <tbody>%s</tbody>
</table>
<p class="nota">%d pagos. Exportación a CSV deshabilitada durante la migración.</p>
""" % ("".join(filas), len(pagos())), usuario, es_admin(usuario))


def vista_pago(usuario, cid):
    for c in pagos():
        if c["id"] == cid:
            detalle = "".join(
                '<div class="campo"><dt>%s</dt><dd>%s</dd></div>' % (e(k), e(v))
                for k, v in c.items())
            return pagina("Pago %s" % cid, """
<h1>Pago <span class="mono">%s</span></h1>
<dl class="detalle">%s</dl>
<p><a class="volver" href="/pagos">&larr; Volver al listado</a></p>
""" % (e(cid), detalle), usuario, es_admin(usuario)), 200
    return pagina("No encontrado", "<h1>404</h1><p>No existe ese pago.</p>",
                  usuario, es_admin(usuario)), 404


def vista_usuarios(usuario):
    filas = []
    for u in usuarios():
        filas.append('<tr><td class="mono">%s</td><td>%s</td><td>%s</td>'
                     '<td>%s</td><td class="mono">%s</td></tr>'
                     % (e(u["usuario"]), e(u.get("nombre", "")), e(u.get("area", "")),
                        e(u.get("rol", "")), e(u.get("ultimo_acceso", "—"))))
    return pagina("Directorio", """
<h1>Directorio de usuarios</h1>
<p class="bajada">Usuarios con acceso al portal. Las altas y bajas las gestiona
   Seguridad Informática; este listado se sincroniza una vez por día.</p>
<table class="grilla">
  <thead><tr><th>Usuario</th><th>Nombre</th><th>Área</th><th>Rol</th><th>Último acceso</th></tr></thead>
  <tbody>%s</tbody>
</table>
""" % "".join(filas), usuario, es_admin(usuario))


def vista_archivos(usuario):
    try:
        nombres = sorted(n for n in os.listdir(D_ARCHIVOS) if not n.startswith("."))
    except FileNotFoundError:
        nombres = []
    filas = []
    for n in nombres:
        ruta = os.path.join(D_ARCHIVOS, n)
        try:
            st = os.stat(ruta)
            tam = "%.1f KB" % (st.st_size / 1024.0)
            mod = time.strftime("%d/%m/%Y %H:%M", time.localtime(st.st_mtime))
        except OSError:
            tam, mod = "—", "—"
        filas.append('<tr><td><a href="/archivos/%s">%s</a></td>'
                     '<td class="num">%s</td><td class="mono">%s</td></tr>'
                     % (urllib.parse.quote(n), e(n), e(tam), e(mod)))
    return pagina("Documentos", """
<h1>Repositorio de documentos</h1>
<p class="bajada">Documentación operativa del área de Pagos.
   Parte del material quedó desactualizado durante la migración desde SIGCON.</p>
<table class="grilla">
  <thead><tr><th>Archivo</th><th>Tamaño</th><th>Modificado</th></tr></thead>
  <tbody>%s</tbody>
</table>
""" % "".join(filas), usuario, es_admin(usuario))


def vista_admin(usuario):
    env = leer_env()
    visibles = {k: v for k, v in env.items() if not k.endswith(("_SECRET", "_PASSWORD"))}
    filas = "".join('<tr><td class="mono">%s</td><td class="mono">%s</td></tr>'
                    % (e(k), e(v)) for k, v in sorted(visibles.items()))
    return pagina("Administración", """
<h1>Administración</h1>
<p class="bajada">Parámetros del entorno. Los valores sensibles no se muestran acá:
   están en <span class="mono">config/.env</span> del servidor.</p>
<table class="grilla"><thead><tr><th>Clave</th><th>Valor</th></tr></thead>
<tbody>%s</tbody></table>
<p class="nota">Para cambiar un parámetro, abrí un ticket a Infraestructura.</p>
""" % filas, usuario, True)


def es_admin(usuario):
    return bool(usuario) and usuario.get("rol", "").lower() in ("administrador", "admin")


# ════════════════════════════════════════════════════════════════════════════
# Servidor
# ════════════════════════════════════════════════════════════════════════════

class Handler(http.server.BaseHTTPRequestHandler):
    server_version = "nginx/1.24.0"
    sys_version = ""
    protocol_version = "HTTP/1.1"

    # ─── utilidades ──────────────────────────────────────────────────────
    def log_message(self, *args):
        pass  # usamos nuestro propio registro

    def sesion(self):
        galletas = self.headers.get("Cookie", "")
        for parte in galletas.split(";"):
            if "=" in parte:
                k, v = parte.strip().split("=", 1)
                if k == "sesion":
                    return _sesiones.get(v)
        return None

    def responder(self, cuerpo, estado=200, tipo="text/html; charset=utf-8",
                  cabeceras=None, senuelo=False):
        if isinstance(cuerpo, str):
            cuerpo = cuerpo.encode("utf-8")
        self.send_response(estado)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(cuerpo)))
        for k, v in (cabeceras or []):
            self.send_header(k, v)
        self.end_headers()
        try:
            self.wfile.write(cuerpo)
        except BrokenPipeError:
            pass
        u = self.sesion()
        registrar(self.client_address[0], self.command, self.path, estado,
                  u["usuario"] if u else None, self.headers.get("User-Agent"),
                  len(cuerpo), senuelo)

    def redirigir(self, a, cabeceras=None):
        self.send_response(302)
        self.send_header("Location", a)
        self.send_header("Content-Length", "0")
        for k, v in (cabeceras or []):
            self.send_header(k, v)
        self.end_headers()
        u = self.sesion()
        registrar(self.client_address[0], self.command, self.path, 302,
                  u["usuario"] if u else None, self.headers.get("User-Agent"), 0, False)

    def requiere_sesion(self):
        u = self.sesion()
        if not u:
            self.redirigir("/")
            return None
        return u

    # ─── GET ─────────────────────────────────────────────────────────────
    def do_GET(self):
        ruta = urllib.parse.urlparse(self.path).path.rstrip("/") or "/"

        # 1 · rutas señuelo declaradas por el alumno en config/senuelos.json
        for s in senuelos():
            if ruta == s.get("ruta", "").rstrip("/"):
                cuerpo = pagina(s.get("titulo", "Administración"),
                                "<h1>%s</h1><p>%s</p>" % (e(s.get("titulo", "")),
                                                          e(s.get("cuerpo", ""))),
                                self.sesion())
                return self.responder(cuerpo, 200, senuelo=True)

        # 2 · estáticos
        if ruta == "/robots.txt":
            return self.servir_archivo(os.path.join(D_STATIC, "robots.txt"), "text/plain; charset=utf-8")
        if ruta.startswith("/static/"):
            nombre = os.path.basename(ruta)
            return self.servir_archivo(os.path.join(D_STATIC, nombre))

        # 3 · API pública (sin sesión, como tantas APIs internas mal expuestas)
        if ruta == "/api/pagos":
            return self.responder(json.dumps(pagos(), ensure_ascii=False, indent=2),
                                  200, "application/json; charset=utf-8")
        if ruta == "/api/usuarios":
            publicos = [{k: v for k, v in u.items() if k != "clave"} for u in usuarios()]
            return self.responder(json.dumps(publicos, ensure_ascii=False, indent=2),
                                  200, "application/json; charset=utf-8")
        if ruta == "/api/estado":
            return self.responder(json.dumps({"servicio": "pagos",
                                              "version": "2.4.1",
                                              "migracion": "en curso"}, ensure_ascii=False),
                                  200, "application/json; charset=utf-8")

        # 4 · páginas
        if ruta == "/":
            return self.redirigir("/pagos") if self.sesion() else self.responder(vista_login())
        if ruta == "/logout":
            galletas = self.headers.get("Cookie", "")
            for parte in galletas.split(";"):
                if "sesion=" in parte:
                    _sesiones.pop(parte.strip().split("=", 1)[1], None)
            return self.redirigir("/", [("Set-Cookie", "sesion=; Max-Age=0; Path=/")])

        u = self.requiere_sesion()
        if not u:
            return

        if ruta == "/pagos":
            return self.responder(vista_pagos(u))
        if ruta.startswith("/pagos/"):
            cuerpo, estado = vista_pago(u, ruta.split("/")[-1])
            return self.responder(cuerpo, estado)
        if ruta == "/usuarios":
            return self.responder(vista_usuarios(u))
        if ruta == "/archivos":
            return self.responder(vista_archivos(u))
        if ruta.startswith("/archivos/"):
            nombre = urllib.parse.unquote(ruta.split("/", 2)[2])
            if "/" in nombre or nombre.startswith("."):
                return self.responder(pagina("Prohibido", "<h1>403</h1>", u), 403)
            return self.servir_archivo(os.path.join(D_ARCHIVOS, nombre), descarga=nombre)
        if ruta == "/admin":
            if not es_admin(u):
                return self.responder(pagina("Sin permiso",
                    "<h1>403</h1><p>Tu usuario no tiene rol de administrador.</p>", u), 403)
            return self.responder(vista_admin(u))

        return self.responder(pagina("No encontrado",
            "<h1>404</h1><p>La ruta <span class=\"mono\">%s</span> no existe.</p>"
            % e(ruta), u), 404)

    # ─── POST ────────────────────────────────────────────────────────────
    def do_POST(self):
        ruta = urllib.parse.urlparse(self.path).path.rstrip("/") or "/"
        largo = int(self.headers.get("Content-Length", "0") or 0)
        datos = urllib.parse.parse_qs(self.rfile.read(largo).decode("utf-8", "replace"))

        if ruta != "/login":
            return self.responder(pagina("No encontrado", "<h1>404</h1>"), 404)

        nombre = (datos.get("usuario") or [""])[0].strip()
        clave = (datos.get("clave") or [""])[0]

        for u in usuarios():
            if u["usuario"] == nombre and u.get("clave") == clave:
                if not u.get("habilitado", True):
                    # Una cuenta deshabilitada que alguien intenta usar es una
                    # señal, no un error: registramos el intento igual.
                    registrar(self.client_address[0], "POST", "/login", 403,
                              nombre, self.headers.get("User-Agent"), 0,
                              bool(u.get("senuelo")))
                    return self.responder(vista_login("Esa cuenta está deshabilitada."), 403)
                sid = uuid.uuid4().hex
                _sesiones[sid] = u
                return self.redirigir("/pagos",
                                      [("Set-Cookie", "sesion=%s; Path=/; HttpOnly" % sid)])

        # Login fallido. Si el usuario intentado es un señuelo, lo marcamos.
        marcado = any(x["usuario"] == nombre and x.get("senuelo") for x in usuarios())
        registrar(self.client_address[0], "POST", "/login", 401, nombre,
                  self.headers.get("User-Agent"), 0, marcado)
        return self.responder(vista_login("Usuario o contraseña incorrectos."), 401)

    # ─── archivos ────────────────────────────────────────────────────────
    def servir_archivo(self, ruta, tipo=None, descarga=None):
        try:
            with open(ruta, "rb") as fh:
                datos = fh.read()
        except Exception:
            return self.responder(pagina("No encontrado", "<h1>404</h1>", self.sesion()), 404)
        if tipo is None:
            tipo = mimetypes.guess_type(ruta)[0] or "application/octet-stream"
        cabeceras = []
        if descarga:
            cabeceras.append(("Content-Disposition",
                              'attachment; filename="%s"' % descarga.replace('"', "")))
        self.responder(datos, 200, tipo, cabeceras)


class Servidor(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    os.makedirs(os.path.dirname(F_LOG), exist_ok=True)
    aplicar_fechas()
    print("Portal de Pagos · EkoFinance", file=sys.stderr)
    print("  http://localhost:%d" % PUERTO, file=sys.stderr)
    print("  log: logs/access.log (JSON por línea)", file=sys.stderr)
    Servidor(("0.0.0.0", PUERTO), Handler).serve_forever()
