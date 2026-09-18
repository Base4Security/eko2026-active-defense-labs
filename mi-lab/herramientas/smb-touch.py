#!/usr/bin/env python3
"""Handshake SMB2 minimo: NEGOTIATE + SESSION_SETUP (NTLMSSP) + TREE_CONNECT.

Solo biblioteca estandar. Sirve para tocar el SMB falso sin instalar
smbclient --que en Windows directamente no existe, y donde ademas el cliente
nativo no sabe hablar SMB a un puerto que no sea el 445, que el propio
Windows ya tiene tomado--.

Un TCP connect pelado al 1445 NO alcanza: el honeypot registra el evento
recien cuando hay un tree connect, o sea sesion negociada y share pedido.
Eso es media respuesta del E4.

    python smb-touch.py [host] [puerto] [usuario] [clave] [share]
"""
import socket, struct, sys, uuid

host  = sys.argv[1] if len(sys.argv) > 1 else "localhost"
port  = int(sys.argv[2]) if len(sys.argv) > 2 else 1445
user  = sys.argv[3] if len(sys.argv) > 3 else "svc_backup"
pwd   = sys.argv[4] if len(sys.argv) > 4 else "Verano2026"
share = sys.argv[5] if len(sys.argv) > 5 else "Contabilidad"

DOMINIO = "EKOFINANCE"
ESTACION = "EKO-WS041"

MAS_PROCESAMIENTO = 0xC0000016       # STATUS_MORE_PROCESSING_REQUIRED


def ucs2(t):
    return t.encode("utf-16-le")


def cabecera(comando, msgid, sesion=0, arbol=0):
    """Cabecera SMB2 sincronica: 64 bytes fijos."""
    return (b"\xfeSMB"
            + struct.pack("<HHIHHIIQIIQ", 64, 0, 0, comando, 31, 0, 0,
                          msgid, 0, arbol, sesion)
            + b"\x00" * 16)             # firma: vamos sin firmar


def enviar(s, mensaje):
    """Sobre el 445 el encuadre es un largo de 4 bytes, sin NetBIOS."""
    s.sendall(struct.pack(">I", len(mensaje)) + mensaje)


def recibir(s):
    cab = b""
    while len(cab) < 4:
        b = s.recv(4 - len(cab))
        if not b:
            raise ConnectionError("el servidor cerro la conexion")
        cab += b
    largo = struct.unpack(">I", cab)[0]
    cuerpo = b""
    while len(cuerpo) < largo:
        b = s.recv(largo - len(cuerpo))
        if not b:
            raise ConnectionError("respuesta truncada")
        cuerpo += b
    return cuerpo


def estado(respuesta):
    return struct.unpack("<I", respuesta[8:12])[0]


def id_sesion(respuesta):
    return struct.unpack("<Q", respuesta[40:48])[0]


# ── NTLMSSP ───────────────────────────────────────────────────────────
# Al honeypot no le interesa si la clave es correcta: samba esta con
# "map to guest = Bad User", asi que un usuario que no existe entra como
# invitado y queda registrado con el nombre que PIDIO. Ese nombre es el dato
# que el ejercicio busca, no el acceso.
NEG_UNICODE     = 0x00000001
NEG_OEM         = 0x00000002
NEG_PEDIR_TARGET = 0x00000004
NEG_NTLM        = 0x00000200
NEG_SIEMPRE_FIRMA = 0x00008000
BANDERAS = NEG_UNICODE | NEG_OEM | NEG_PEDIR_TARGET | NEG_NTLM | NEG_SIEMPRE_FIRMA


def ntlm_negotiate():
    return (b"NTLMSSP\x00" + struct.pack("<I", 1) + struct.pack("<I", BANDERAS)
            + struct.pack("<HHI", 0, 0, 32)      # dominio: vacio
            + struct.pack("<HHI", 0, 0, 32))     # estacion: vacia


def ntlm_authenticate():
    CAB = 64                                     # parte fija, antes de los datos
    lm = b"\x00" * 24
    nt = b"\x41" * 24                            # respuesta de mentira, a proposito
    campos = [lm, nt, ucs2(DOMINIO), ucs2(user), ucs2(ESTACION), b""]

    datos, pares, cur = b"", b"", CAB
    for v in campos:
        pares += struct.pack("<HHI", len(v), len(v), cur if v else CAB)
        datos += v
        cur += len(v)

    msg = (b"NTLMSSP\x00" + struct.pack("<I", 3) + pares
           + struct.pack("<I", BANDERAS))
    assert len(msg) == CAB, f"cabecera de {len(msg)} bytes, esperaba {CAB}"
    return msg + datos


# ── El intercambio ────────────────────────────────────────────────────
s = socket.create_connection((host, port), timeout=8)
s.settimeout(8)

# 1 · NEGOTIATE — pedimos 2.0.2 y 2.1, que no necesitan contextos ni cifrado
dialectos = [0x0202, 0x0210]
cuerpo = (struct.pack("<HHHH", 36, len(dialectos), 1, 0)
          + struct.pack("<I", 0)
          + uuid.uuid4().bytes
          + struct.pack("<Q", 0)
          + b"".join(struct.pack("<H", d) for d in dialectos))
enviar(s, cabecera(0x0000, 0) + cuerpo)
r = recibir(s)
if estado(r) != 0:
    print(f"NEGOTIATE rechazado: 0x{estado(r):08X}")
    sys.exit(1)
dialecto = struct.unpack("<H", r[68:70])[0]
print(f"negociado SMB dialecto 0x{dialecto:04X}")

# 2 · SESSION_SETUP, primer tramo: mandamos el NTLMSSP NEGOTIATE
def session_setup(token, msgid, sesion=0):
    cuerpo = (struct.pack("<HBBIIHHQ", 25, 0, 1, 0, 0, 64 + 24, len(token), 0)
              + token)
    enviar(s, cabecera(0x0001, msgid, sesion) + cuerpo)
    return recibir(s)

r = session_setup(ntlm_negotiate(), 1)
if estado(r) != MAS_PROCESAMIENTO:
    print(f"el servidor no pidio continuar: 0x{estado(r):08X}")
    sys.exit(1)
sesion = id_sesion(r)

# 3 · SESSION_SETUP, segundo tramo: el AUTHENTICATE con el usuario que importa
r = session_setup(ntlm_authenticate(), 2, sesion)
if estado(r) != 0:
    print(f"SESSION_SETUP rechazado para {user}: 0x{estado(r):08X}")
    sys.exit(1)
banderas = struct.unpack("<H", r[66:68])[0]
como = "invitado" if banderas & 0x0001 else "usuario"
print(f"sesion abierta como {user} ({como})")

# 4 · TREE_CONNECT — recien aca el honeypot registra el toque
ruta = ucs2(f"\\\\{host}\\{share}")
cuerpo = struct.pack("<HHHH", 9, 0, 64 + 8, len(ruta)) + ruta
enviar(s, cabecera(0x0003, 3, sesion) + cuerpo)
r = recibir(s)
if estado(r) != 0:
    print(f"TREE_CONNECT a {share} rechazado: 0x{estado(r):08X}")
    sys.exit(1)
print(f"conectado al share {share} — el evento ya quedo en el honeypot")

s.close()
