# E3 · Cazá el volcado de LSASS y el salto lateral

**Lab de hunting · sobre telemetría real · 10 minutos · grupos de 2-3**

Dos capturas de ataques reales, grabadas por el proyecto
[OTRF Security-Datasets](https://github.com/OTRF/Security-Datasets) en un
dominio de laboratorio (`theshire.local`). Tienen logs de Sysmon, Security y
PowerShell, un evento JSON por línea. No hay que levantar nada: bajás los
archivos y cazás con `jq`.

---

## Objetivo

Partir de una **hipótesis**, encontrar la evidencia que la confirma o la tira,
y reconstruir **qué pasó, en qué orden, en qué máquina y con qué cuenta**.

Al final tenés que poder escribir, en una línea por caso, la detección que lo
habría atrapado.

---

## El reloj

| Min | Paso | Qué tiene que quedar |
|---|---|---|
| 0-1 | 1 · Bajá la evidencia | Los dos JSON en `evidencia/` |
| 1-2 | 2 · Mirá qué hay | Qué fuentes y qué eventos tiene cada archivo |
| 2-5 | **3 · Cazá el volcado de LSASS** | Quién, cómo y dónde quedó el volcado |
| 5-9 | **4 · Cazá el salto lateral** | De qué máquina a cuál, con qué cuenta, y qué corrió |
| 9-10 | 5 · Cerrá | Línea de tiempo y una detección por caso |

---

## Antes de empezar

- `curl`, `unzip` y **`jq`**, los mismos del E1.
- En Windows, PowerShell alcanza: al final hay equivalentes con `ConvertFrom-Json`.
- **Los tiempos:** los eventos de Sysmon traen `UtcTime` y los de Security
  traen `TimeCreated`, que **no están en la misma zona horaria**. Antes de
  ordenar una línea de tiempo, fijate cuántas horas los separan.

---

## 1 · Bajá la evidencia · 0-5 min

```bash
mkdir -p evidencia && cd evidencia
B=https://raw.githubusercontent.com/OTRF/Security-Datasets/master/datasets/atomic/windows

curl -sLO $B/credential_access/host/psh_lsass_memory_dump_comsvcs.zip
curl -sLO $B/lateral_movement/host/empire_psexec_dcerpc_tcp_svcctl.zip

unzip -o psh_lsass_memory_dump_comsvcs.zip
unzip -o empire_psexec_dcerpc_tcp_svcctl.zip

mv psh_lsass_memory_dump_comsvcs_*.json lsass.json
mv empire_psexec_dcerpc_tcp_svcctl_*.json lateral.json
wc -l lsass.json lateral.json
```

**Listo cuando** tenés `lsass.json` (184 líneas) y `lateral.json` (4348 líneas).

Los comandos que siguen se corren desde `evidencia/`.

---

## 2 · Mirá qué hay · 5-8 min

Antes de buscar nada, sabé con qué contás:

```bash
# qué fuentes y qué eventos, de más a menos
jq -r '"\(.Channel)  \(.EventID)"' lsass.json | sort | uniq -c | sort -rn

# qué máquinas aparecen
jq -r '.Hostname' lateral.json | sort | uniq -c
```

Anotá tres cosas:
1. ¿Qué eventos de **Sysmon** hay? Buscá qué significan el 1, el 3, el 10 y el 11.
2. ¿Qué eventos de **Security** hay?
3. ¿Cuántas máquinas aparecen en `lateral.json`, y cuál parece el controlador de dominio?

> Si una técnica deja rastro en un evento que no estás recolectando, esa técnica
> es invisible para vos. Esta pregunta es la mitad del hunting.

---

## 3 · Cazá el volcado de LSASS · 8-18 min

**Hipótesis:** *alguien leyó la memoria de `lsass.exe` para sacar credenciales.*

Para leer la memoria de un proceso primero hay que abrirlo. Sysmon registra eso
en el evento **10 (ProcessAccess)**.

```bash
# ¿quién abrió lsass, y con qué permisos?
jq -c 'select(.EventID==10 and (.TargetImage|test("lsass.exe$";"i")))
       | {SourceImage, GrantedAccess}' lsass.json
```

Si la hipótesis se sostiene, seguí el hilo:

```bash
# ¿con qué línea de comandos se lanzó?
jq -r 'select(.EventID==1) | .CommandLine' lsass.json

# ¿quién fue el padre, con qué usuario y con qué integridad?
jq -c 'select(.EventID==1) | {Image, ParentImage, User, IntegrityLevel}' lsass.json

# ¿quedó algo escrito en disco?
jq -r 'select(.EventID==11) | .TargetFilename' lsass.json
```

**Contestá:**
1. ¿Qué proceso abrió `lsass.exe`? ¿Es un binario raro, o uno de Windows?
2. ¿Qué DLL y qué función usó? ¿Qué significa el número que aparece en la
   línea de comandos?
3. ¿Qué permiso pidió (`GrantedAccess`)? ¿Por qué ese valor en particular es una alerta?
4. ¿Dónde quedó el volcado, y con qué nombre?
5. **La trampa:** hay un evento `1102` al principio del archivo. ¿Qué es? Antes
   de sumarlo a la historia, fijate cuándo pasó respecto del resto.

---

## 4 · Cazá el salto lateral · 18-28 min

**Hipótesis:** *alguien creó un servicio en una máquina remota para ejecutar código en ella.*

Un servicio nuevo deja el evento **7045** en System y el **4697** en Security.

```bash
# ¿se instaló algún servicio?
jq -c 'select(.EventID==7045)
       | {Hostname, ServiceName, ImagePath: .ImagePath[0:80]}' lateral.json
```

Encontraste la máquina de destino. Ahora averiguá de dónde vino:

```bash
# ¿quién inició sesión por red en esa máquina, y desde qué IP?
jq -c 'select(.EventID==4624 and .LogonType=="3"
              and .Hostname=="WORKSTATION6.theshire.local")
       | {TargetUserName, IpAddress, AuthenticationPackageName}' lateral.json

# ¿qué proceso de la máquina de origen habló con el destino?
jq -c 'select(.EventID==3 and .DestinationIp=="172.18.39.6" and .Initiated=="true")
       | {Hostname, Image, DestinationIp, DestinationPort}' lateral.json
```

Y qué pasó en el destino después:

```bash
# ¿qué lanzó services.exe?
jq -c 'select(.EventID==1 and .ParentImage=="C:\\Windows\\System32\\services.exe")
       | {Hostname, UtcTime, Image, User}' lateral.json

# ¿el proceso nuevo salió a algún lado?
jq -c 'select(.EventID==3 and .Hostname=="WORKSTATION6.theshire.local"
              and .Initiated=="true" and (.Image|test("powershell";"i")))
       | {Image, DestinationIp, DestinationPort}' lateral.json
```

**Contestá:**
1. ¿Cómo se llama el servicio? ¿Suena legítimo? ¿Qué ejecuta en realidad?
2. ¿Desde qué máquina y con qué cuenta llegó el adversario?
3. ¿Por qué puerto habló primero la máquina de origen, y qué servicio de
   Windows atiende ahí?
4. ¿Con qué usuario corrió el código en el destino?
5. ¿A qué IP y puerto salió el proceso nuevo? ¿Qué es probablemente esa IP?

### Si te sobra tiempo: ¿qué decía el comando codificado?

```bash
jq -r 'select(.EventID==7045) | .ImagePath | split(" ") | last' lateral.json \
  | base64 -d | iconv -f UTF-16LE -t UTF-8 | head -c 400; echo
```

¿Qué es lo primero que intenta hacer el script? ¿Por qué un adversario haría
eso antes que cualquier otra cosa?

---

## 5 · Cerrá · 28-30 min

**Línea de tiempo.** Ordená lo que encontraste en cada caso, con la hora y la
máquina. Aclará en qué zona horaria está cada hora.

**Una detección por caso.** En una línea, en palabras, sin sintaxis de ninguna
herramienta:

| Caso | La detección |
|---|---|
| LSASS | *Alertar cuando…* |
| Lateral | *Alertar cuando…* |

Después preguntate lo mismo que en el E3, pero al revés: **¿qué proceso
legítimo dispararía tu detección el martes?**

---

## Entregable

- Las respuestas de los pasos 3 y 4.
- La línea de tiempo de cada caso.
- Las dos detecciones, cada una con su posible falso positivo.

---

## En Windows

PowerShell lee JSON sin `jq`. El patrón es siempre el mismo:

```powershell
$lsass   = Get-Content evidencia\lsass.json   | ConvertFrom-Json
$lateral = Get-Content evidencia\lateral.json | ConvertFrom-Json

# qué hay
$lsass | Group-Object Channel, EventID | Sort-Object Count -Descending | Select-Object Count, Name

# quién abrió lsass
$lsass | Where-Object { $_.EventID -eq 10 -and $_.TargetImage -match 'lsass.exe$' } |
  Select-Object SourceImage, GrantedAccess

# servicios nuevos
$lateral | Where-Object EventID -eq 7045 | Select-Object Hostname, ServiceName, ImagePath
```

Para bajar la evidencia: `Invoke-WebRequest -Uri <url> -OutFile <archivo>` y
`Expand-Archive <archivo> -DestinationPath .`.

---

## Créditos

Datasets: [OTRF Security-Datasets](https://github.com/OTRF/Security-Datasets),
de Roberto y José Luis Rodríguez. Los archivos:
`datasets/atomic/windows/credential_access/host/psh_lsass_memory_dump_comsvcs.zip`
y `datasets/atomic/windows/lateral_movement/host/empire_psexec_dcerpc_tcp_svcctl.zip`.
