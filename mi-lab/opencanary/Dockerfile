# Un sistema falso entero · servicios varios
# SMB, un portal HTTP de login y un MSSQL. Cada uno captura una cosa
# distinta del adversario: eso es el ejercicio E4.
FROM python:3.11-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends gcc libpcap-dev python3-dev samba rsyslog \
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

# El SMB falso necesita dos mitades. OpenCanary aporta la segunda --leer la
# auditoria y emitir el evento-- pero NO la primera: el servidor que atiende
# el 445 es un smbd de verdad, configurado con el VFS full_audit. Sin esto el
# puerto acepta el TCP por el docker-proxy y no contesta nada.
COPY smb.conf /etc/samba/smb.conf
COPY rsyslog-smb.conf /etc/rsyslog.d/10-opencanary-smb.conf
COPY contabilidad /srv/contabilidad
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8081 445 1433
CMD ["/usr/local/bin/entrypoint.sh"]
