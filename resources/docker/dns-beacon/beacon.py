#!/usr/bin/env python3
"""
Sumidero DNS mínimo para demos de engaño.

Responde cualquier consulta A con una dirección fija y registra en stdout
qué nombre se pidió y desde dónde. Es la contraparte del honeyfile con
beacon: el señuelo emite una consulta a un subdominio único, y el nombre
consultado identifica qué artefacto se tocó.

No pretende ser un servidor DNS. Implementa lo mínimo del formato de
mensaje (RFC 1035) para que un `dig` o un cliente del sistema queden
conformes, porque el punto pedagógico es el registro, no la resolución.
"""
import os
import socket
import struct
import datetime

# El puerto se toma del entorno: dentro del contenedor 5353 está libre, pero
# si esto se corre directo en la máquina del instructor y es una Mac, 5353 lo
# ocupa mDNSResponder y el bind falla. De ahí el override.
BIND = ("0.0.0.0", int(os.environ.get("BEACON_PORT", "5353")))
ANSWER_IP = os.environ.get("BEACON_ANSWER_IP", "192.0.2.10")  # RFC 5737, no ruteable


def parse_qname(data, offset=12):
    """Devuelve (nombre, offset_final) leyendo las etiquetas del QNAME."""
    labels = []
    while offset < len(data):
        length = data[offset]
        if length == 0:
            offset += 1
            break
        if length & 0xC0:            # puntero de compresión: no se espera acá
            offset += 2
            break
        offset += 1
        labels.append(data[offset:offset + length].decode("utf-8", "replace"))
        offset += length
    return ".".join(labels), offset


def build_response(query, qname_end):
    txn = query[:2]
    question = query[12:qname_end + 4]           # QNAME + QTYPE + QCLASS
    header = txn + struct.pack(">HHHHH", 0x8180, 1, 1, 0, 0)
    answer = (
        b"\xc0\x0c"                              # puntero al QNAME de la pregunta
        + struct.pack(">HHIH", 1, 1, 60, 4)      # A, IN, TTL 60, rdlength 4
        + socket.inet_aton(ANSWER_IP)
    )
    return header + question + answer


def main():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(BIND)
    print(f"[*] sumidero DNS escuchando en {BIND[0]}:{BIND[1]} — respondiendo {ANSWER_IP}", flush=True)

    while True:
        try:
            data, addr = sock.recvfrom(512)
            if len(data) < 13:
                continue
            qname, end = parse_qname(data)
            ts = datetime.datetime.now().isoformat(timespec="seconds")
            print(f'{{"ts":"{ts}","event":"dns_beacon","src_ip":"{addr[0]}",'
                  f'"src_port":{addr[1]},"qname":"{qname}"}}', flush=True)
            sock.sendto(build_response(data, end), addr)
        except KeyboardInterrupt:
            break
        except Exception as exc:                 # un paquete malformado no baja el demo
            print(f'{{"event":"error","detail":"{exc}"}}', flush=True)


if __name__ == "__main__":
    main()
