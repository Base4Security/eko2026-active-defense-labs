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
| [`labs/e02-cinco-tokens.md`](labs/e02-cinco-tokens.md) | E2 · Cinco tokens, cinco disparos | 10 min |
| [`labs/e03-plantar-el-engano.md`](labs/e03-plantar-el-engano.md) | E3 · Plantá el engaño en el Home Banking | 10 min |
| [`labs/e04-hunting-lsass-psexec.md`](labs/e04-hunting-lsass-psexec.md) | E4 · Cazá el volcado de LSASS y el movimiento lateral | 6 min |
| [`labs/e05-hunting-con-agente.md`](labs/e05-hunting-con-agente.md) | E5 · Cazá con un agente (Claude Code / Cursor) | 6 min |
| [`labs/e06-acceso-home-banking.md`](labs/e06-acceso-home-banking.md) | E6 · Entrá a tu Home Banking | 5 min |

El **E4** trae además una [guía descriptiva paso a paso](labs/e04-hunting-lsass-psexec-guia-descriptiva.md)
que explica cada comando y cada evento.

Los labs de hunting (E4 · E5) traen cada comando en `jq` (macOS · Linux) y en
PowerShell (Windows). El **E2** necesita internet y una casilla de correo.

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
docker compose ps        # cowrie en "running"
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
| `ssh` | E1 | Entrar al honeypot |
| `jq` | E1 · E4 · E5 | Leer los logs JSON del honeypot y la telemetría del hunting |
| `curl` | E2 · E4 · E5 | Disparar tokens y bajar los datasets |
| `aws` | E2 | Disparar el token de credenciales |

```bash
# macOS
brew install jq awscli
# Debian / Ubuntu
sudo apt install jq awscli
```

### En Windows

El curso corre entero en Windows, sin WSL. Cada guía trae los comandos con su
equivalente en **PowerShell** — abrí PowerShell, no `cmd`.

De la lista de arriba, en Windows:

| Herramienta | Cómo |
|---|---|
| `ssh` | ya viene, desde Windows 10 1809 — no hace falta PuTTY |
| `curl` | ya viene, pero escribí **`curl.exe`**: `curl` a secas es alias de `Invoke-WebRequest` |
| `aws` | `winget install Amazon.AWSCLI` |
| `jq` | **opcional** — PowerShell lee JSON de fábrica con `ConvertFrom-Json`, y los labs de hunting traen esa variante. Si lo querés igual: `winget install jqlang.jq` |

Un detalle que muerde: `dig` no existe en Windows — el E2 usa `Resolve-DnsName`.

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
