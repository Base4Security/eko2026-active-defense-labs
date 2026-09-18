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

### En Windows

El curso corre entero en Windows, sin WSL. Los bloques de código de las guías
traen una **pestaña Windows** con el equivalente en PowerShell: se aprieta una
vez y las diecisiete guías se acomodan solas. Abrí **PowerShell**, no `cmd`.

De la lista de arriba, en Windows:

| Herramienta | Cómo |
|---|---|
| `ssh` | ya viene, desde Windows 10 1809 — no hace falta PuTTY |
| `curl` | ya viene, pero escribí **`curl.exe`**: `curl` a secas es alias de `Invoke-WebRequest` |
| `nmap` | `winget install Insecure.Nmap` |
| `aws` | `winget install Amazon.AWSCLI` |
| `jq` | **opcional** — PowerShell lee JSON de fábrica con `ConvertFrom-Json`, y las pestañas de Windows están escritas así. Si lo querés igual: `winget install jqlang.jq` |
| `smbclient` | no existe, y Windows no sabe hablar SMB a un puerto que no sea el 445 (que ya tiene tomado). El E4 usa `mi-lab/herramientas/smb-touch.py` |
| `sqlcmd` | tampoco hace falta: el E4 usa `mi-lab/herramientas/tds-login.py` |

Los dos scripts son stdlib pura y sirven en cualquier plataforma: si no querés
instalar `smbclient` ni `sqlcmd` en macOS o Linux, usalos también ahí.

Dos detalles que muerden: donde en Linux va `python3`, en Windows el binario se
llama **`python`**; y `dig` no existe — el E2 usa `Resolve-DnsName`.

`sqlcmd` y `smbclient` son los más incómodos de instalar —en macOS el primero es
directamente molesto y en Windows el segundo no existe—. Para los dos el
repositorio trae un reemplazo que no necesita instalar nada, sólo Python 3:

```bash
python3 mi-lab/herramientas/tds-login.py  localhost 1433 sa Password123
python3 mi-lab/herramientas/smb-touch.py  localhost 1445 svc_backup Verano2026
#  en Windows el binario se llama python, y las barras van al revés
```

Cada uno hace el handshake mínimo que el honeypot necesita para registrar el
toque: PRELOGIN + LOGIN7 en el MSSQL, y NEGOTIATE + SESSION_SETUP +
TREE_CONNECT en el SMB. **Un `curl` o un `nc` al 1433 o al 1445 no alcanzan**:
el honeypot sólo registra cuando hay sesión negociada, así que un TCP connect
pelado no deja rastro — aunque el puerto *parezca* abierto, porque quien acepta
la conexión es el redirector de Docker y no el servicio. Vale la pena probarlo
y verlo, es media respuesta del E4.

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
