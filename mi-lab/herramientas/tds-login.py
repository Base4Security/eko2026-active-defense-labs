#!/usr/bin/env python3
"""Handshake TDS minimo contra un MSSQL: PRELOGIN + LOGIN7.
Solo biblioteca estandar. Sirve para tocar el MSSQL falso sin instalar sqlcmd."""
import socket, struct, sys

host = sys.argv[1] if len(sys.argv) > 1 else "localhost"
port = int(sys.argv[2]) if len(sys.argv) > 2 else 1433
user = sys.argv[3] if len(sys.argv) > 3 else "sa"
pwd  = sys.argv[4] if len(sys.argv) > 4 else "Password123"

def paquete(tipo, cuerpo):
    return struct.pack(">BBHHBB", tipo, 1, 8 + len(cuerpo), 0, 1, 0) + cuerpo

def ucs2(t): return t.encode("utf-16-le")
def ofuscar(p):                      # TDS: nibbles invertidos y XOR 0xA5
    return bytes(((c << 4 | c >> 4) & 0xFF) ^ 0xA5 for c in ucs2(p))

s = socket.create_connection((host, port), timeout=8); s.settimeout(8)

# ── PRELOGIN ──────────────────────────────────────────────────────────
val = b"\x00\x00\x00\x00\x00\x00"
pre = struct.pack(">BHH", 0x00, 5 + 1, len(val)) + b"\xff" + val
s.sendall(paquete(0x12, pre)); s.recv(4096)

# ── LOGIN7 ────────────────────────────────────────────────────────────
CAB = 94                             # porcion fija, antes de los datos
campos = [ucs2("EKO-WS041"), ucs2(user), ofuscar(pwd), ucs2("sqlcmd"),
          ucs2(host), b"", ucs2("ODBC"), ucs2(""), ucs2("master")]

datos, pares, cur = b"", b"", CAB
for i, v in enumerate(campos):
    # la longitud va en caracteres, salvo password (bytes) y el campo sin uso
    n = 0 if i == 5 else len(v) // 2
    pares += struct.pack("<HH", cur if v else 0, n)
    datos += v; cur += len(v)

cab  = struct.pack("<I", 0)                       # largo total, se completa abajo
cab += struct.pack("<I", 0x71000001)              # TDS 7.1
cab += struct.pack("<I", 4096)                    # tamano de paquete
cab += struct.pack("<I", 7)                       # version del cliente
cab += struct.pack("<I", 1234)                    # PID
cab += struct.pack("<I", 0)                       # connection id
cab += bytes([0xE0, 0x03, 0x00, 0x00])            # flags 1,2,type,3
cab += struct.pack("<i", 0)                       # huso horario
cab += struct.pack("<I", 0)                       # LCID
cab += pares                                      # 9 pares offset/largo
cab += b"\x00" * 6                                # ClientID (MAC)
cab += struct.pack("<HH", 0, 0)                   # SSPI
cab += struct.pack("<HH", 0, 0)                   # AtchDBFile
cab += struct.pack("<HH", 0, 0)                   # ChangePassword
cab += struct.pack("<I", 0)                       # cbSSPILong
assert len(cab) == CAB, f"cabecera de {len(cab)} bytes, esperaba {CAB}"

cuerpo = cab + datos
cuerpo = struct.pack("<I", len(cuerpo)) + cuerpo[4:]
s.sendall(paquete(0x10, cuerpo))
try:
    r = s.recv(4096); print(f"el servidor respondio {len(r)} bytes")
except Exception as e:
    print("sin respuesta:", e)
s.close()
