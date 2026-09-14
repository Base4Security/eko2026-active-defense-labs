# Un sistema falso entero · servicios varios
# SMB, un portal HTTP de login y un MSSQL. Cada uno captura una cosa
# distinta del adversario: eso es el ejercicio E4.
FROM python:3.11-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends gcc libpcap-dev python3-dev samba \
 && pip install --no-cache-dir opencanary \
 && apt-get purge -y gcc python3-dev && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*

COPY opencanary.conf /root/.opencanary.conf
RUN mkdir -p /var/tmp/opencanary

# Piel propia del portal HTTP falso, apuntada desde "http.skindir".
#
# Las que trae opencanary son dos logins de NAS genericos, y uno de ellos
# --basicLogin-- ni siquiera incluye el redirect.html que el modulo abre
# para responder "/": sin ese archivo la raiz devuelve 500 y, lo que
# importa, el toque no queda registrado.
#
# Esta cuenta la historia de SIGCON, el sistema anterior del que el Portal
# de Pagos esta migrando. Un empleado ya migrado no tiene motivo para
# abrirlo, que es la prueba que tiene que pasar toda pieza de engano.
COPY skin /opt/skin

EXPOSE 8081 445 1433
CMD ["opencanaryd", "--dev"]
