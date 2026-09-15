# Active Cyber Defense: Hunt the Fox on His Land

**Laboratorios · Ekoparty 2026** — Diego Staino · Mariano Quintana · BASE4 Security

Diecisiete ejercicios sobre las ocho horas prácticas del curso. Catorce de
teclado y tres de escribir. Levantás honeypots, plantás tokens, cazás sobre
telemetría real y al final intentás quemar el diseño de otro grupo.

---

## Abrí la guía

Todo el programa —los diecisiete ejercicios, el cronograma y las guías— está en
**[`index.html`](index.html)**. Empezá ahí.

```bash
git clone https://github.com/Base4Security/eko2026-active-defense-labs
cd eko2026-active-defense-labs

open index.html          # macOS
# xdg-open index.html    # Linux
# start index.html       # Windows
```

No hace falta servidor ni instalar nada para leer las guías: son HTML plano y
funcionan abriéndolas con doble clic.

---

## Antes del curso: Docker

Los ejercicios de la primera parte corren en tu máquina. Necesitás **Docker** instalado y
corriendo, y conviene levantar el laboratorio una vez antes de empezar: la
primera construcción tarda dos o tres minutos.

```bash
cd mi-lab
docker compose up -d --build
docker compose ps        # portal, cowrie y opencanary en "running"
```

Puertos, credenciales y resolución de problemas:
**[`mi-lab/README.md`](mi-lab/README.md)**.

---

## Qué hay en el repositorio

| Carpeta | Qué es |
|---|---|
| **[`index.html`](index.html)** | **El programa. Empezá acá.** |
| [`labs/`](labs/) | Las diecisiete guías, una por ejercicio |
| [`mi-lab/`](mi-lab/) | Tu laboratorio: el portal y los dos honeypots |
| [`material-extra.html`](material-extra.html) | Material extra: el caso, fichas y mapas de referencia |
| `resources/` | Los archivos que esa página indexa |
| `assets/` | Estilos y scripts de las guías |

---

## Las guías son cuadernos, no PDFs

Las tablas se completan en la página y se guardan solas en tu navegador.

- **Exportar** → devuelve tu trabajo en Markdown, listo para pegar
- **Importar** → recupera un respaldo `.json` en otra máquina
- **Limpiar** → borra lo cargado en esa guía

> **Al cerrar cada ejercicio, apretá Exportar y mandate el texto al chat del
> grupo.** El trabajo se guarda en el navegador de *esa* máquina, y varios
> ejercicios usan lo que produjo el anterior.

---

## Herramientas de línea de comandos

Docker es lo único que hay que tener sí o sí antes de empezar. El resto se
instala cuando hace falta, pero conviene mirar la lista ahora: en el aula, sin
buen wifi, bajar un paquete puede costar más que el ejercicio.

| Herramienta | La usan | Para qué |
|---|---|---|
| `jq` | E1 · E6 · E7 · E13 | Leer los logs JSON del honeypot y del portal |
| `curl` | E2 · E13 · E14 | Disparar tokens y probar servicios |
| `ssh` | E1 · E5 · E7 · E14 | Entrar al honeypot |
| `nmap` | E5 · E14 | Fingerprint del honeypot, antes y después |
| `aws` | E2 | Disparar el token de credenciales |
| `smbclient` | E4 | Tocar el SMB falso |
| `sqlcmd` | E4 | Tocar el MSSQL falso — **o cualquier otro cliente** |

```bash
# macOS
brew install jq nmap awscli samba
# Debian / Ubuntu
sudo apt install jq nmap awscli smbclient
```

`sqlcmd` es el más incómodo de instalar, y en macOS es directamente molesto. Si
no lo tenés, el repositorio trae un reemplazo que no necesita instalar nada
—sólo Python 3, que ya está en todos lados—:

```bash
python3 mi-lab/herramientas/tds-login.py localhost 1433 sa Password123
```

Hace el handshake TDS mínimo (PRELOGIN + LOGIN7) contra el MSSQL falso, que es
lo único que el ejercicio necesita. **Un `curl` o un `nc` al 1433 no alcanzan**:
el honeypot sólo registra el evento cuando recibe un paquete de login completo,
así que un TCP connect pelado no deja rastro. Vale la pena probarlo y verlo, es
media respuesta del E4.

Además del teclado, el **E2** pide dos cosas que no son software:

- **Word o LibreOffice** para abrir el token `.docx`.
- **Un celular con cámara** para el token QR — y vale la pena que sea con datos
  móviles, porque el callback va a traer esa red y no la del aula. Es otro punto
  de observación, no un accidente.

---

## Aviso

Todo el escenario es **ficticio**. EkoFinance, sus activos, el incidente y los
documentos del caso fueron construidos para este curso. Cualquier dominio, IP o
identificador que aparezca está en rangos reservados para documentación
(RFC 5737, RFC 2606) o es inventado.

Las técnicas se enseñan para **defender infraestructura propia**. El ejercicio
[W2](labs/w2-ficha-de-operacion.html) incluye el límite legal y ético explícito
de lo que se puede y no se puede hacer.
