# E4 · Guía descriptiva: volcado de LSASS y movimiento lateral con PsExec

> Complemento del [E4 · Cazá el volcado de LSASS y el salto lateral](e04-hunting-lsass-y-lateral.md).
> El E4 es la versión de teclado, para hacer contra reloj; esta guía es la
> versión explicada, comando por comando, para leer con calma o repasar después.

Esta guía acompaña al alumno comando por comando. Trabajamos con dos datasets reales del proyecto **OTRF Security-Datasets** (antes "Mordor"): grabaciones de eventos generadas al ejecutar técnicas de ataque en un laboratorio controlado. Son dos escenarios independientes (hosts y usuarios distintos), pero juntos cuentan una historia típica: primero el atacante roba credenciales y después las usa para moverse a otra máquina.

---

## Paso 1 — Preparar el entorno y descargar la evidencia

```powershell
mkdir evidencia; cd evidencia
$B = 'https://raw.githubusercontent.com/OTRF/Security-Datasets/master/datasets/atomic/windows'
iwr "$B/credential_access/host/psh_lsass_memory_dump_comsvcs.zip" -OutFile lsass.zip
iwr "$B/lateral_movement/host/empire_psexec_dcerpc_tcp_svcctl.zip" -OutFile lateral.zip
Expand-Archive lsass.zip . -Force; Expand-Archive lateral.zip . -Force
Get-ChildItem psh_lsass_memory_dump_comsvcs_*.json  | Rename-Item -NewName lsass.json
Get-ChildItem empire_psexec_dcerpc_tcp_svcctl_*.json | Rename-Item -NewName lateral.json
```

Creamos una carpeta de trabajo y guardamos en `$B` la parte común de la URL para no repetirla. `iwr` es el alias de `Invoke-WebRequest`. Los nombres de los archivos ya adelantan lo que vamos a investigar:

- **psh_lsass_memory_dump_comsvcs**: volcado de la memoria de LSASS usando `comsvcs.dll` (MITRE ATT&CK T1003.001, *OS Credential Dumping: LSASS Memory*).
- **empire_psexec_dcerpc_tcp_svcctl**: movimiento lateral estilo PsExec con el framework Empire, creando un servicio remoto por RPC sobre la interfaz `svcctl` (T1021.002 y T1569.002).

Después descomprimimos y renombramos los JSON a nombres cortos (`lsass.json` y `lateral.json`) para trabajar más cómodos.

> **Para pensar:** en un caso real nunca trabajarías sobre la evidencia original. Siempre sobre una copia, y calculando hashes (`Get-FileHash`) antes y después.

---

## Paso 2 — Cargar los eventos en memoria

```powershell
$lsass   = Get-Content lsass.json   | ForEach-Object { $_ | ConvertFrom-Json }
$lateral = Get-Content lateral.json | ForEach-Object { $_ | ConvertFrom-Json }
```

Los archivos están en formato **JSON Lines**: cada línea es un evento completo. Por eso no los convertimos de una sola vez, sino línea por línea. El resultado son dos arrays de objetos donde cada campo del evento (`EventID`, `Image`, `CommandLine`, etc.) es una propiedad que podemos filtrar con `Where-Object` (`?`).

---

## Paso 3 — Inventario del dataset de LSASS: ¿qué tipo de eventos tenemos?

```powershell
$lsass | Group-Object Channel,EventID | Sort-Object Count -Descending | Select Count,Name
```

Antes de buscar nada, siempre conviene saber **qué fuentes de telemetría existen**. Si no hay Sysmon, no podés buscar eventos de Sysmon. Tenemos dos canales:

**Sysmon (Microsoft-Windows-Sysmon/Operational):** 1 = creación de proceso, 5 = fin de proceso, 7 = carga de DLL, 10 = acceso a otro proceso, 11 = creación de archivo, 12/13 = cambios en el registro.

**Security:** 4688/4689 = creación/fin de proceso, 4656/4663/4658 = solicitud de handle, acceso y cierre sobre un objeto auditado, 4690 = duplicación de handle, 5156/5158 = conexiones y bindings permitidos por el firewall (WFP), 1102 = **se borró el log de auditoría**.

> **Ojo con el 1102.** En un incidente real, un borrado del log de Security es una alarma enorme. En estos datasets suele aparecer al principio porque los autores limpian los logs antes de grabar el escenario. Lección: un evento aislado no es una conclusión; mirá siempre su marca de tiempo y su contexto.

El evento más numeroso es el **Sysmon 10 (ProcessAccess)**, con 68 apariciones. Ahí vamos.

---

## Paso 4 — ¿Quién accedió a la memoria de LSASS?

```powershell
$lsass | ? { $_.EventID -eq 10 -and $_.TargetImage -match 'lsass\.exe$' } | Select SourceImage, GrantedAccess
```

`lsass.exe` es el proceso que guarda en memoria hashes, tickets Kerberos y a veces credenciales en texto claro de los usuarios logueados. Leer su memoria es el objetivo clásico de herramientas como Mimikatz.

De los 68 accesos a procesos, solo **2** apuntan a LSASS, y ambos vienen de **`rundll32.exe`**. Eso ya es muy sospechoso: `rundll32` no tiene ningún motivo legítimo habitual para abrir LSASS.

El campo `GrantedAccess` es una máscara de permisos:

- **0x1fffff** = `PROCESS_ALL_ACCESS`, control total sobre el proceso.
- **0x1410** = `0x1000` (QUERY_LIMITED_INFORMATION) + `0x400` (QUERY_INFORMATION) + `0x10` (**VM_READ**). Es justamente la combinación mínima que necesita la API `MiniDumpWriteDump` para volcar memoria.

> **Para pensar:** ¿qué pasó con los otros 66 eventos Sysmon 10? Son ruido normal del sistema. Filtrar por destino (`TargetImage`) es lo que separa la señal del ruido.

---

## Paso 5 — ¿Qué comando lanzó ese rundll32?

```powershell
$lsass | ? EventID -eq 1 | Select Image, ParentImage, User, IntegrityLevel, CommandLine
```

El único evento de creación de proceso nos da la foto completa:

- **Image:** `rundll32.exe`, un binario legítimo de Windows (técnica *Living off the Land*, LOLBin).
- **ParentImage:** `powershell.exe`. El atacante lo ejecutó desde una consola PowerShell.
- **User:** `WORKSTATION5\wardog`.
- **IntegrityLevel:** `High`. Hacía falta ser administrador (con `SeDebugPrivilege`) para abrir LSASS.
- **CommandLine:** `comsvcs.dll MiniDump 756 C:\Users\wardog\AppData\Local\Temp\lsass-comsvcs.dmp full`

Leamos la línea de comandos: `comsvcs.dll` es una DLL legítima de Windows que exporta una función `MiniDump`. El `756` es el **PID de LSASS** en esa máquina, el segundo argumento es dónde guardar el volcado y `full` indica un volcado completo de memoria.

> **Idea de detección:** una regla que alerte cuando `CommandLine` contenga `comsvcs` y `MiniDump` a la vez tiene muy pocos falsos positivos.

---

## Paso 6 — ¿Quedó algo escrito en disco?

```powershell
$lsass | ? EventID -eq 11 | Select -Expand TargetFilename
```

Dos archivos creados:

1. `C:\Windows\Prefetch\RUNDLL32.EXE-B1101E56.pf`: el archivo de **Prefetch** que Windows genera al ejecutar un programa. Es un artefacto forense útil porque registra ejecuciones aunque el atacante borre otras huellas.
2. `C:\Users\wardog\AppData\Local\Temp\lsass-comsvcs.dmp`: **el volcado de LSASS**. Con ese archivo, el atacante puede llevárselo y extraer las credenciales tranquilamente fuera de la máquina.

**Resumen del escenario 1:** ya tenemos la cadena completa de tres eventos que se confirman entre sí: se crea el proceso (Sysmon 1) → accede a LSASS (Sysmon 10) → escribe el `.dmp` (Sysmon 11). Como ejercicio, el alumno puede comprobar que los tres comparten el mismo `ProcessGuid` o `ProcessId` y ordenarlos por hora.

---

## Paso 7 — Escenario 2: un servicio nuevo en WORKSTATION6

```powershell
$lateral | ? EventID -eq 7045 | Select Hostname, ServiceName, ImagePath
```

El evento **7045** (canal System) indica que **se instaló un servicio**. Esta es la huella central de PsExec y sus imitaciones: para ejecutar algo en otra máquina, crean un servicio remoto y lo arrancan.

- **ServiceName:** `Updater`, un nombre genérico elegido para pasar desapercibido.
- **ImagePath:** en lugar de apuntar a un `.exe` de servicio, ejecuta `cmd.exe` (`%COMSPEC%`), que a su vez lanza PowerShell con estos parámetros:
  - `-noP`: no carga el perfil del usuario.
  - `-sta`: modo single-threaded apartment.
  - `-w 1`: ventana oculta.
  - `-enc`: el comando viene codificado en Base64.

Esta combinación es la firma típica del *launcher* de Empire. Para ver qué esconde el Base64, el alumno puede extraer el campo completo (la tabla lo trunca con `...`) y decodificarlo como UTF-16LE:

```powershell
$cmd = ($lateral | ? EventID -eq 7045).ImagePath
$b64 = ($cmd -split '-enc\s+')[1].Trim()
[Text.Encoding]::Unicode.GetString([Convert]::FromBase64String($b64))
```

El comienzo se decodifica como `If($PSVErSiOnTablE.PSVERsI...`. Las mayúsculas y minúsculas mezcladas son una ofuscación deliberada para evadir firmas que buscan texto exacto.

---

## Paso 8 — ¿Quién se conectó y desde dónde?

```powershell
$lateral | ? { $_.EventID -eq 4624 -and $_.LogonType -eq '3' -and $_.Hostname -eq 'WORKSTATION6.theshire.local' } | Select TargetUserName, IpAddress
```

El 4624 es un inicio de sesión exitoso y el **LogonType 3** es un inicio de sesión **por red**, que es exactamente lo que genera PsExec al conectarse al recurso `ADMIN$`/`IPC$` de la víctima.

Resultado: el usuario **`pgustavo`** se autenticó en WORKSTATION6 desde **172.18.39.5**. Esa IP es la máquina de origen del ataque, el siguiente lugar donde habría que investigar.

> **Detalle técnico:** comparamos `LogonType` con `'3'` entre comillas porque en este JSON el campo viene como texto, no como número. Conocer los tipos de datos del origen evita filtros que no devuelven nada "sin razón".

---

## Paso 9 — ¿Qué ejecutó el servicio?

```powershell
$lateral | ? { $_.EventID -eq 1 -and $_.ParentImage -eq 'C:\Windows\System32\services.exe' } | Select Hostname, Image, User
```

`services.exe` es el Service Control Manager: todo servicio que arranca es hijo suyo. Acá vemos que lanzó **`cmd.exe` como `NT AUTHORITY\SYSTEM`**, que coincide con el `ImagePath` del paso 7.

Esto muestra el valor de esta técnica para el atacante: se autenticó como `pgustavo`, pero el código termina corriendo con **la cuenta de mayor privilegio de la máquina**.

---

## Paso 10 — Inventario del dataset lateral

```powershell
$lateral | Group-Object Channel,EventID | Sort-Object Count -Descending | Select Count,Name
```

Conviene hacerlo al principio, como en el paso 3. Tres observaciones:

**Hay muchísimo más ruido.** Son miles de eventos contra unos 190 del primer dataset. Los eventos PowerShell 800 y 4103 (logging de módulos y pipeline) son el agente de Empire trabajando después de la infección.

**El nombre del canal viene inconsistente** (`security` y `Security`). Los datos provienen de distintos recolectores. PowerShell compara sin distinguir mayúsculas por defecto, así que los filtros funcionan, pero en Python, jq o algunos SIEM esto rompe búsquedas en silencio.

**Aparecen eventos que completan la historia del movimiento lateral:**

| Evento | Significado |
|---|---|
| 5140 / 5145 | Acceso a recursos compartidos de red (`IPC$` y el pipe `svcctl`) |
| 4697 | Instalación del servicio vista desde Security (complementa el 7045) |
| 7036 / 7000 / 7009 | Cambios de estado y fallos del servicio: `cmd.exe` no es un binario de servicio real, así que el SCM reporta que no arrancó bien, pero el payload ya se ejecutó |
| 4672 | Logon con privilegios especiales |
| 4769 | Solicitud de ticket Kerberos de servicio |
| Sysmon 17 / 18 | Creación y conexión a named pipes |
| 4104 | Script Block Logging: puede contener el script de Empire ya decodificado |

---

## Reconstrucción final del ataque lateral

1. `pgustavo` se autentica por red desde 172.18.39.5 contra WORKSTATION6 (4624, tipo 3).
2. Se conecta a `IPC$` y abre el pipe `svcctl` para hablar con el Service Control Manager remoto (5140, 5145).
3. Crea el servicio `Updater` con un comando PowerShell codificado (7045, 4697).
4. `services.exe` lo arranca como SYSTEM y lanza `cmd.exe` → `powershell -enc` (Sysmon 1).
5. El agente de Empire queda corriendo y genera abundante actividad de PowerShell (800, 4103, 4104).

---

## Ejercicios propuestos para el alumno

1. Filtrar los eventos 5145 y encontrar el `RelativeTargetName` que muestre el pipe `svcctl`.
2. Buscar el evento 4104 y comparar su contenido con el Base64 decodificado del paso 7.
3. Ordenar por hora (`EventTime` o `@timestamp`) todos los eventos de los pasos 7 a 9 y armar una línea de tiempo.
4. Escribir en pseudocódigo una regla de detección para cada escenario y discutir qué falsos positivos podría tener.
