# E3 · Cazá el volcado de LSASS y el salto lateral

**Lab de hunting · sobre telemetría real · 6 minutos · grupos de 2-3**

Dos capturas de ataques reales, grabadas por el proyecto
[OTRF Security-Datasets](https://github.com/OTRF/Security-Datasets) en un
dominio de laboratorio (`theshire.local`). Logs de Sysmon, Security y PowerShell,
un evento JSON por línea. No hay que levantar nada.

> **Cada bloque trae las dos formas: `jq` (macOS · Linux) y PowerShell
> (Windows).** Usá la de tu máquina. Los datos son Windows: PowerShell es tan
> natural como `jq` acá.

---

## Objetivo

Partir de una **hipótesis**, encontrar la evidencia, y reconstruir **qué pasó,
en qué máquina y con qué cuenta**. Al final, escribir en una línea por caso la
detección que lo habría atrapado.

> **Los tiempos engañan:** Sysmon usa `UtcTime` y Security usa `TimeCreated`, en
> zonas distintas. Fijate cuántas horas los separan antes de armar una línea de tiempo.

---

## El reloj

| Min | Paso | Qué tiene que quedar |
|---|---|---|
| 0-1 | 1 · Bajá y mirá | Los dos JSON, y qué eventos trae cada uno |
| 1-3 | **2 · Cazá el volcado de LSASS** | Quién, cómo y dónde quedó el volcado |
| 3-5 | **3 · Cazá el salto lateral** | De qué máquina a cuál, con qué cuenta |
| 5-6 | 4 · Cerrá | Línea de tiempo y una detección por caso |

---

## 1 · Bajá y mirá · 0-1 min

```bash
mkdir -p evidencia && cd evidencia
B=https://raw.githubusercontent.com/OTRF/Security-Datasets/master/datasets/atomic/windows
curl -sLO $B/credential_access/host/psh_lsass_memory_dump_comsvcs.zip
curl -sLO $B/lateral_movement/host/empire_psexec_dcerpc_tcp_svcctl.zip
unzip -o psh_lsass_memory_dump_comsvcs.zip && unzip -o empire_psexec_dcerpc_tcp_svcctl.zip
mv psh_lsass_memory_dump_comsvcs_*.json lsass.json
mv empire_psexec_dcerpc_tcp_svcctl_*.json lateral.json

# qué fuentes y eventos, de más a menos
jq -r '"\(.Channel)  \(.EventID)"' lsass.json | sort | uniq -c | sort -rn
```

```powershell
# Windows · PowerShell
mkdir evidencia; cd evidencia
$B = 'https://raw.githubusercontent.com/OTRF/Security-Datasets/master/datasets/atomic/windows'
iwr "$B/credential_access/host/psh_lsass_memory_dump_comsvcs.zip" -OutFile lsass.zip
iwr "$B/lateral_movement/host/empire_psexec_dcerpc_tcp_svcctl.zip" -OutFile lateral.zip
Expand-Archive lsass.zip . -Force; Expand-Archive lateral.zip . -Force
Get-ChildItem psh_lsass_memory_dump_comsvcs_*.json  | Rename-Item -NewName lsass.json
Get-ChildItem empire_psexec_dcerpc_tcp_svcctl_*.json | Rename-Item -NewName lateral.json

# cargá los dos (una línea por evento) y usalos el resto del lab
$lsass   = Get-Content lsass.json   | ForEach-Object { $_ | ConvertFrom-Json }
$lateral = Get-Content lateral.json | ForEach-Object { $_ | ConvertFrom-Json }
$lsass | Group-Object Channel,EventID | Sort-Object Count -Descending | Select Count,Name
```

**Mirá qué tenés antes de cazar.** Si una técnica deja rastro en un evento que no
recolectás, es invisible para vos — esa pregunta es la mitad del hunting.

---

## 2 · Cazá el volcado de LSASS · 1-3 min

**Hipótesis:** *alguien leyó la memoria de `lsass.exe` para sacar credenciales.*
Para leer la memoria de un proceso primero hay que abrirlo: Sysmon lo registra en
el evento **10 (ProcessAccess)**.

```bash
# ¿quién abrió lsass, y con qué permiso?
jq -c 'select(.EventID==10 and (.TargetImage|test("lsass.exe$";"i"))) | {SourceImage, GrantedAccess}' lsass.json
# ¿con qué línea de comandos, quién es el padre y qué quedó en disco?
jq -c 'select(.EventID==1)  | {Image, ParentImage, User, IntegrityLevel, CommandLine}' lsass.json
jq -r 'select(.EventID==11) | .TargetFilename' lsass.json
```

```powershell
# Windows · PowerShell
$lsass | ? { $_.EventID -eq 10 -and $_.TargetImage -match 'lsass\.exe$' } | Select SourceImage, GrantedAccess
$lsass | ? EventID -eq 1  | Select Image, ParentImage, User, IntegrityLevel, CommandLine
$lsass | ? EventID -eq 11 | Select -Expand TargetFilename
```

**Contestá:** ¿qué proceso abrió `lsass` (¿binario raro o de Windows?), qué DLL y
función usó, qué permiso pidió (`GrantedAccess`) y dónde quedó el volcado.
**La trampa:** hay un `1102` (borrado del log) al principio — fijate *cuándo* pasó
respecto del volcado antes de atribuírselo al atacante.

---

## 3 · Cazá el salto lateral · 3-5 min

**Hipótesis:** *crearon un servicio en una máquina remota para ejecutar código.*
Un servicio nuevo deja el evento **7045** en System.

```bash
# ¿qué servicio se instaló, y dónde?
jq -c 'select(.EventID==7045) | {Hostname, ServiceName, ImagePath: .ImagePath[0:80]}' lateral.json
# ¿quién entró por red a esa máquina, y desde qué IP?
jq -c 'select(.EventID==4624 and .LogonType=="3" and .Hostname=="WORKSTATION6.theshire.local") | {TargetUserName, IpAddress}' lateral.json
# ¿qué lanzó services.exe, y con qué usuario?
jq -c 'select(.EventID==1 and .ParentImage=="C:\\Windows\\System32\\services.exe") | {Hostname, Image, User}' lateral.json
```

```powershell
# Windows · PowerShell
$lateral | ? EventID -eq 7045 | Select Hostname, ServiceName, ImagePath
$lateral | ? { $_.EventID -eq 4624 -and $_.LogonType -eq '3' -and $_.Hostname -eq 'WORKSTATION6.theshire.local' } | Select TargetUserName, IpAddress
$lateral | ? { $_.EventID -eq 1 -and $_.ParentImage -eq 'C:\Windows\System32\services.exe' } | Select Hostname, Image, User
```

**Contestá:** cómo se llama el servicio y qué ejecuta en realidad, desde qué
máquina y con qué cuenta llegó, y con qué usuario corrió el código en el destino.

---

## 4 · Cerrá · 5-6 min

Ordená los dos casos en una línea de tiempo (aclarando la zona de cada hora) y
escribí una detección por caso, en palabras:

| Caso | La detección | ¿Qué proceso legítimo la dispararía el martes? |
|---|---|---|
| LSASS | *Alertar cuando…* | |
| Lateral | *Alertar cuando…* | |

---

## Entregable

- La línea de tiempo de cada caso, con la zona horaria.
- Las dos detecciones, cada una con su posible falso positivo.

---

## Créditos

Datasets: [OTRF Security-Datasets](https://github.com/OTRF/Security-Datasets). Archivos:
`credential_access/host/psh_lsass_memory_dump_comsvcs.zip` y
`lateral_movement/host/empire_psexec_dcerpc_tcp_svcctl.zip`.
