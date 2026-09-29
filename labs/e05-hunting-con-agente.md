# E5 · Cazá con un agente · Claude Code o Cursor

**Lab de hunting · sobre telemetría real · 6 minutos · grupos de 2-3**

La misma telemetría del E4, pero ahora el que escribe las consultas es un
**agente de IA** (Claude Code o Cursor) y vos lo conducís. El ejercicio no es
«que la IA encuentre el ataque»: es aprender a **dirigirla por hipótesis y a
verificar lo que afirma**, porque un agente rápido y convincente también inventa.

> Hacé primero el [E4](e04-hunting-lsass-y-lateral.md) a mano. Saber cómo se ve
> la evidencia cruda es lo que te deja detectar cuándo el agente se la inventa.

---

## Objetivo

Reconstruir los dos ataques conduciendo a un agente, y salir con una regla de
oro: **ninguna conclusión del agente vale hasta que la podés reproducir vos
contra el evento crudo.**

---

## El reloj

| Min | Paso | Qué tiene que quedar |
|---|---|---|
| 0-1 | 1 · Preparar la carpeta | Evidencia + reglas del agente |
| 1-2 | 2 · Abrir el agente y que mapee | Fuentes, eventos y máquinas, con cita |
| 2-4 | **3 · Cazar por hipótesis** | Los dos ataques, cada afirmación con su evento |
| 4-6 | **4 · Verificar, quebrar y cerrar** | Una afirmación reproducida y una tumbada |

---

## Antes de empezar

- **Docker no hace falta.** Este lab no usa `mi-lab/`.
- Para verificar a mano lo que dice el agente: **`jq`** (macOS · Linux) o
  **PowerShell** (Windows, ya viene).
- **Un agente**, con internet y cuenta activa:
  - **Claude Code** — `npm install -g @anthropic-ai/claude-code`, después `claude`.
  - **Cursor** — <https://cursor.com>. Abrís la carpeta y el chat del agente (`Cmd/Ctrl + L`).

---

## 1 · Prepará la carpeta · 0-1 min

```bash
mkdir -p hunt-agente/evidencia && cd hunt-agente/evidencia
B=https://raw.githubusercontent.com/OTRF/Security-Datasets/master/datasets/atomic/windows
curl -sLO $B/credential_access/host/psh_lsass_memory_dump_comsvcs.zip
curl -sLO $B/lateral_movement/host/empire_psexec_dcerpc_tcp_svcctl.zip
unzip -o psh_lsass_memory_dump_comsvcs.zip && unzip -o empire_psexec_dcerpc_tcp_svcctl.zip
mv psh_lsass_memory_dump_comsvcs_*.json lsass.json
mv empire_psexec_dcerpc_tcp_svcctl_*.json lateral.json && cd ..
```

```powershell
# Windows · PowerShell
mkdir hunt-agente\evidencia; cd hunt-agente\evidencia
$B = 'https://raw.githubusercontent.com/OTRF/Security-Datasets/master/datasets/atomic/windows'
iwr "$B/credential_access/host/psh_lsass_memory_dump_comsvcs.zip" -OutFile lsass.zip
iwr "$B/lateral_movement/host/empire_psexec_dcerpc_tcp_svcctl.zip" -OutFile lateral.zip
Expand-Archive lsass.zip . -Force; Expand-Archive lateral.zip . -Force
Get-ChildItem psh_lsass_memory_dump_comsvcs_*.json  | Rename-Item -NewName lsass.json
Get-ChildItem empire_psexec_dcerpc_tcp_svcctl_*.json | Rename-Item -NewName lateral.json
cd ..
```

**El paso que hace la diferencia.** Un agente sin reglas te devuelve una historia
linda y sin fundamento. Creá `hunt-agente/CLAUDE.md` (Claude Code lo lee solo) y,
si usás Cursor, copiá lo mismo a `hunt-agente/.cursorrules`:

```markdown
# Reglas · hunting sobre esta carpeta

Sos un analista de amenazas. Trabajás SOLO con los .json de evidencia/.

- Cada afirmación lleva su evidencia: archivo, EventID y el valor del campo.
  Si no lo podés citar, decí "no tengo evidencia", no lo completes.
- No inventes EventIDs, procesos, cuentas ni IPs.
- Antes de concluir algo, mostrame el comando exacto (jq, PowerShell o grep)
  que corriste, para que yo lo pueda repetir.
- Tiempos: Sysmon usa UtcTime y Security usa TimeCreated, en zonas distintas.
- Trabajás por hipótesis de a una. No saltes a "encontré el ataque".
- Con cada detección, dame el falso positivo legítimo más probable.
```

Estas reglas **son parte del ejercicio**: sin ellas, el resto no enseña nada.

---

## 2 · Abrí el agente y que mapee · 1-2 min

```bash
cd hunt-agente && claude       # o en Cursor: abrí la carpeta y el chat del agente
```

Primer mensaje:

```
Leé CLAUDE.md y seguilo al pie. Sin sacar conclusiones: por cada .json de
evidencia/, decime qué Channel y EventIDs contiene con su cuenta, y qué
Hostnames aparecen. Mostrame el comando que usaste.
```

**Vos, en paralelo, corré la verdad** y compará:

```bash
jq -r '"\(.Channel)  \(.EventID)"' evidencia/lsass.json | sort | uniq -c | sort -rn
```

```powershell
# Windows · PowerShell
$lsass   = Get-Content evidencia\lsass.json   | ForEach-Object { $_ | ConvertFrom-Json }
$lateral = Get-Content evidencia\lateral.json | ForEach-Object { $_ | ConvertFrom-Json }
$lsass | Group-Object Channel,EventID | Sort-Object Count -Descending | Select Count,Name
```

**El hábito de todo el lab: pedir, y chequear.**

---

## 3 · Cazá por hipótesis · 2-4 min

Una hipótesis por vez. Dejá que el agente pivotee, pero exigile la cita.

```
Hipótesis 1: alguien leyó la memoria de lsass.exe. En lsass.json, decime qué
proceso abrió lsass y con qué permiso, la línea de comandos, el padre y su
integridad, y si algo quedó en disco. Cada dato con su EventID y su consulta.
```

```
Hipótesis 2: en lateral.json crearon un servicio remoto para ejecutar código.
Reconstruí qué servicio y qué ejecuta, desde qué máquina y con qué cuenta llegó,
por qué puerto, con qué usuario corrió en el destino, y si salió a alguna IP.
```

Anotá cada afirmación en una columna «lo que dice el agente» — sin creerle todavía.

---

## 4 · Verificá, quebrá y cerrá · 4-6 min

**a) Reproducí una.** La afirmación más fuerte —el permiso con que abrió lsass, o
la cuenta del login remoto— correla vos:

```bash
jq -c 'select(.EventID==10 and (.TargetImage|test("lsass.exe$";"i"))) | {SourceImage, GrantedAccess}' evidencia/lsass.json
```

```powershell
# Windows · PowerShell
$lsass | ? { $_.EventID -eq 10 -and $_.TargetImage -match 'lsass\.exe$' } | Select SourceImage, GrantedAccess
```

**b) Tratá de quebrar una.** Tendele la trampa:

```
En lsass.json hay un EventID 1102 (borrado del log). ¿Fue el mismo adversario
del volcado? Solo con lo que la evidencia banca: compará la hora del 1102 con la
del volcado y decime la diferencia exacta.
```

¿El agente **afirma** que el atacante borró los logs, o **nota** que el 1102 pasó
*antes* del volcado y se planta en «no alcanza para atribuirlo»? Las dos
respuestas sirven: una muestra la confabulación, la otra el agente bien conducido.

**c) Cerrá.** Pedile la línea de tiempo y una detección por caso con su falso
positivo, y quedátelo con tu criterio:

| | La detección | Falso positivo el martes |
|---|---|---|
| LSASS | *Alertar cuando…* | |
| Lateral | *Alertar cuando…* | |

> Un agente te da velocidad, no criterio. El valor no es lo que produce: es tu
> capacidad de reproducirlo.

---

## Entregable

- Las dos detecciones, cada una con su falso positivo.
- **Una afirmación del agente que reprodujiste** y **una que tuviste que corregir
  o tumbar.**

---

## Créditos

Datasets: [OTRF Security-Datasets](https://github.com/OTRF/Security-Datasets).
Archivos: `credential_access/host/psh_lsass_memory_dump_comsvcs.zip` y
`lateral_movement/host/empire_psexec_dcerpc_tcp_svcctl.zip`.
