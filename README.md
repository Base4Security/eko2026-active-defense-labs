# Active Cyber Defense: Hunt the Fox on His Land

**Laboratorios · Ekoparty 2026** — Diego Staino · Mariano Quintana · BASE4 Security

Ejercicios prácticos del curso. Levantás honeypots, plantás engaño sobre un
sistema real y cazás sobre telemetría real.

---

## Las guías

Cada ejercicio es una guía en Markdown, en la carpeta **[`labs/`](labs/)**.
Se leen en cualquier visor de Markdown o directo en GitHub.

| Guía | Qué es | Dura |
|---|---|---|
| [`labs/e01-guia-de-ejecucion.md`](labs/e01-guia-de-ejecucion.md) | E1 · Armá tu laboratorio y rompelo | 10 min |
| [`labs/e02-plantar-el-engano.md`](labs/e02-plantar-el-engano.md) | E2 · Plantá el engaño en el Home Banking | 10 min |
| [`labs/e03-hunting-lsass-y-lateral.md`](labs/e03-hunting-lsass-y-lateral.md) | E3 · Cazá el volcado de LSASS y el salto lateral | 6 min |
| [`labs/e04-hunting-con-agente.md`](labs/e04-hunting-con-agente.md) | E4 · Cazá con un agente (Claude Code / Cursor) | 6 min |

Los labs de hunting (E3 · E4) traen cada comando en `jq` (macOS · Linux) y en
PowerShell (Windows).

```bash
git clone https://github.com/Base4Security/eko2026-active-defense-labs
cd eko2026-active-defense-labs
```

---

## Antes del curso: Docker

Los ejercicios de la primera parte corren en tu máquina. Necesitás **Docker**
instalado y corriendo, y conviene levantar el laboratorio una vez antes de
empezar: la primera construcción tarda dos o tres minutos.

```bash
cd mi-lab
docker compose up -d --build
docker compose ps        # portal, cowrie y opencanary en "running"
```

Puertos, credenciales y resolución de problemas:
**[`mi-lab/README.md`](mi-lab/README.md)**.

El lab de hunting no usa `mi-lab/`: baja su propia telemetría de
[OTRF Security-Datasets](https://github.com/OTRF/Security-Datasets). El E3 corre
sobre un Home Banking hosteado, sin instalar nada.

---

## Qué hay en el repositorio

| Carpeta | Qué es |
|---|---|
| [`labs/`](labs/) | Las guías, una por ejercicio |
| [`mi-lab/`](mi-lab/) | Tu laboratorio: el portal y los dos honeypots |
| [`resources/`](resources/) | El caso, fichas y mapas de referencia |

---

## Herramientas de línea de comandos

Docker es lo único que hay que tener sí o sí antes de empezar. El resto se
instala cuando hace falta, pero conviene mirar la lista ahora: en el aula, sin
buen wifi, bajar un paquete puede costar más que el ejercicio.

| Herramienta | La usan | Para qué |
|---|---|---|
| `jq` | E1 · E6 · E7 · E13 · Hunting | Leer los logs JSON del honeypot, del portal y la telemetría del hunting |
| `curl` | E2 · E13 · E14 · Hunting | Disparar tokens, probar servicios, bajar los datasets |
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

El curso corre entero en Windows, sin WSL. Cada guía trae los comandos con su
equivalente en **PowerShell** — abrí PowerShell, no `cmd`.

De la lista de arriba, en Windows:

| Herramienta | Cómo |
|---|---|
| `ssh` | ya viene, desde Windows 10 1809 — no hace falta PuTTY |
| `curl` | ya viene, pero escribí **`curl.exe`**: `curl` a secas es alias de `Invoke-WebRequest` |
| `nmap` | `winget install Insecure.Nmap` |
| `aws` | `winget install Amazon.AWSCLI` |
| `jq` | **opcional** — PowerShell lee JSON de fábrica con `ConvertFrom-Json`, y las guías traen esa variante. Si lo querés igual: `winget install jqlang.jq` |
| `smbclient` | no existe, y Windows no sabe hablar SMB a un puerto que no sea el 445 (que ya tiene tomado). El E4 usa `mi-lab/herramientas/smb-touch.py` |
| `sqlcmd` | tampoco hace falta: el E4 usa `mi-lab/herramientas/tds-login.py` |

Los dos scripts son stdlib pura y sirven en cualquier plataforma: si no querés
instalar `smbclient` ni `sqlcmd` en macOS o Linux, usalos también ahí.

Dos detalles que muerden: donde en Linux va `python3`, en Windows el binario se
llama **`python`**; y `dig` no existe — el E2 usa `Resolve-DnsName`.

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

Las técnicas se enseñan para **defender infraestructura propia**.
