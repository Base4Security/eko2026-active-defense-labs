#!/bin/sh
# Tres procesos, no uno. El SMB falso se arma en cadena:
#
#   smbd        atiende el 445 y audita cada toque via syslog (LOCAL7)
#   rsyslogd    deja esas lineas en /var/tmp/opencanary/smb.log
#   opencanaryd tail-ea ese archivo y emite el evento --y ademas atiende
#               el HTTP falso y el MSSQL falso, que no necesitan nada mas
#
# Si se cae cualquiera de los dos primeros, el 445 sigue aceptando conexiones
# --el docker-proxy del host las acepta igual-- y el honeypot deja de
# registrar sin avisar. Vale la pena mirar "docker compose logs opencanary"
# despues del primer arranque.
set -e

mkdir -p /var/tmp/opencanary /var/log/samba /run/samba /srv/contabilidad

# El watcher de opencanary abre el archivo al arrancar: si todavia no existe,
# el modulo smb queda mudo hasta que alguien reinicie el contenedor.
touch /var/tmp/opencanary/smb.log

rsyslogd
smbd --daemon --configfile=/etc/samba/smb.conf

exec opencanaryd --dev
