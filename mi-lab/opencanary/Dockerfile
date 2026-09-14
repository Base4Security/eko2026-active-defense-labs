# Carril B · servicios falsos varios
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

EXPOSE 8081 445 1433
CMD ["opencanaryd", "--dev"]
