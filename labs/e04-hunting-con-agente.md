# E4 · Cazá con un agente · Claude Code o Cursor

**Lab de hunting · sobre telemetría real · 10 minutos · grupos de 2-3**

La misma telemetría del lab de hunting a mano, pero ahora el que escribe las
consultas es un **agente de IA** (Claude Code o Cursor) y vos lo conducís. El
ejercicio no es «que la IA encuentre el ataque»: es aprender a **dirigirla por
hipótesis y a verificar lo que afirma**, porque un agente rápido y convincente
también inventa.

> Si nunca cazaste sobre estos datos, hacé primero
> el [E3](e03-hunting-lsass-y-lateral.md) a mano. Saber cómo
> se ve la evidencia cruda es lo que te deja darte cuenta de cuándo el agente
> se la inventa.

---

## Objetivo

Reconstruir dos ataques —un volcado de LSASS y un salto lateral— conduciendo a
un agente, y salir con una regla de oro: **ninguna conclusión del agente vale
hasta que la podés reproducir vos contra el evento crudo.**

---

## El reloj

| Min | Paso | Qué tiene que quedar |
|---|---|---|
| 0-1 | 1 · Preparar la carpeta | Evidencia + reglas del agente |
| 1-2 | 2 · Abrir el agente | Claude Code o Cursor sobre esa carpeta |
| 2-3 | 3 · Que mapee los datos | Fuentes, eventos y máquinas, con cita |
| 3-6 | **4 · Cazar por hipótesis** | Los dos ataques, cada afirmación con su evento |
| 6-9 | **5 · Verificar y quebrar** | Una afirmación reproducida y una tumbada |
| 9-10 | 6 · Cerrar | Dos detecciones y qué aportó (y qué arruinó) el agente |

---

## Antes de empezar

- **Docker no hace falta.** Este lab no usa `mi-lab/`.
- **`curl`, `unzip` y `jq`** (para verificar a mano lo que dice el agente).
- **Un agente de codificación**, con internet y una cuenta activa:
  - **Claude Code** — en la terminal: `npm install -g @anthropic-ai/claude-code`, después `claude` dentro de la carpeta.
  - **Cursor** — <https://cursor.com>. Abrís la carpeta y usás el chat del agente (`Cmd/Ctrl + L`).
- Cualquiera de los dos sirve. Los pasos son iguales; sólo cambia dónde escribís.

---

## 1 · Prepará la carpeta · 0-5 min

```bash
mkdir -p hunt-agente/evidencia && cd hunt-agente/evidencia
B=https://raw.githubusercontent.com/OTRF/Security-Datasets/master/datasets/atomic/windows

curl -sLO $B/credential_access/host/psh_lsass_memory_dump_comsvcs.zip
curl -sLO $B/lateral_movement/host/empire_psexec_dcerpc_tcp_svcctl.zip
unzip -o psh_lsass_memory_dump_comsvcs.zip && unzip -o empire_psexec_dcerpc_tcp_svcctl.zip
mv psh_lsass_memory_dump_comsvcs_*.json lsass.json
mv empire_psexec_dcerpc_tcp_svcctl_*.json lateral.json
cd ..
```

**Ahora el paso que hace la diferencia.** Un agente sin reglas te devuelve una
historia linda y sin fundamento. Dale un marco. Creá `hunt-agente/CLAUDE.md`
(Claude Code lo lee solo) y, si usás Cursor, copiá lo mismo a
`hunt-agente/.cursorrules`:

```markdown
# Reglas · hunting sobre esta carpeta

Sos un analista de amenazas. Trabajás SOLO con los .json de evidencia/.

- Cada afirmación lleva su evidencia: archivo, EventID y el valor del campo.
  Si no lo podés citar, decí "no tengo evidencia", no lo completes.
- No inventes EventIDs, procesos, cuentas ni IPs. No rellenes con lo que
  "suele pasar" en este tipo de ataque.
- Antes de concluir algo, mostrame el comando exacto (jq o grep) que corriste,
  para que yo lo pueda repetir.
- Tiempos: Sysmon usa UtcTime y Security usa TimeCreated, en zonas distintas.
  Aclará la zona en cada hora antes de armar una línea de tiempo.
- Trabajás por hipótesis de a una. No saltes a "encontré el ataque".
- Cuando propongas una detección, dame también el falso positivo legítimo
  más probable.
```

Estas reglas **son parte del ejercicio**: sin ellas, el resto no enseña nada.

---

## 2 · Abrí el agente · 5-8 min

```bash
# Claude Code
cd hunt-agente && claude
```

En **Cursor**: `File → Open Folder → hunt-agente`, y abrí el chat del agente.

Primer mensaje, para fijar el terreno:

```
Leé CLAUDE.md y seguí esas reglas al pie. No toques evidencia/, solo leela.
Confirmame en una línea qué archivos ves y arrancamos.
```

---

## 3 · Que mapee los datos · 8-13 min

No le pidas que cace todavía. Pedile inventario:

```
Sin sacar conclusiones: por cada archivo de evidencia/, decime qué fuentes
(Channel) y qué EventIDs contiene, con la cuenta de cada uno, y qué máquinas
(Hostname) aparecen. Mostrame el jq que usaste.
```

**Vos, en paralelo,** corré la verdad:

```bash
jq -r '"\(.Channel)  \(.EventID)"' evidencia/lsass.json | sort | uniq -c | sort -rn
jq -r '.Hostname' evidencia/lateral.json | sort | uniq -c
```

¿El inventario del agente coincide con el tuyo? Si difiere, ya aprendiste algo
antes de empezar a cazar. **Este es el hábito de todo el lab: pedir, y chequear.**

---

## 4 · Cazá por hipótesis · 13-22 min

Una hipótesis por vez. Dejá que el agente pivotee, pero exigile la cita.

**Caso 1 — LSASS:**

```
Hipótesis: alguien leyó la memoria de lsass.exe para robar credenciales.
Buscá en lsass.json la evidencia a favor o en contra. Quiero: qué proceso
abrió lsass y con qué permiso, la línea de comandos completa, el proceso padre
y su nivel de integridad, y si algo quedó escrito en disco. Cada dato con su
EventID y su jq.
```

**Caso 2 — lateral:**

```
Hipótesis: en lateral.json alguien creó un servicio en una máquina remota para
ejecutar código. Reconstruí: qué servicio y qué ejecuta, desde qué máquina y
con qué cuenta llegó, por qué puerto, con qué usuario corrió el código en el
destino, y si el proceso nuevo salió a alguna IP. Todo citado.
```

A medida que responde, anotá cada afirmación en una columna «lo que dice el
agente» — todavía sin creerle.

---

## 5 · Verificá y quebrá · 22-30 min

Acá está el ejercicio de verdad. Dos movimientos:

**a) Reproducí una.** Elegí la afirmación más fuerte del agente —el permiso con
que abrió lsass, o la cuenta del login remoto— y corré su jq vos mismo. ¿Da lo
mismo? Marcala como **verificada**.

```bash
# ejemplo: ¿es cierto el permiso que dijo?
jq -c 'select(.EventID==10 and (.TargetImage|test("lsass.exe$";"i")))
       | {SourceImage, GrantedAccess}' evidencia/lsass.json
```

**b) Tratá de quebrar una.** Tendele una trampa donde es fácil que se pase de
la raya:

```
En lsass.json hay un EventID 1102 (borrado del log de seguridad). ¿Fue el
mismo adversario del volcado? Contestá solo con lo que la evidencia banca:
compará la hora del 1102 con la del volcado y decime la diferencia exacta.
```

Fijate si el agente **afirma** que el atacante borró los logs, o si nota que el
1102 pasó **antes** del volcado y se planta en «la evidencia no alcanza para
atribuirlo». Cualquiera de las dos respuestas es material para el cierre: una
muestra la confabulación, la otra muestra un agente bien conducido.

> Un agente te da velocidad, no criterio. Encuentra y pivotea más rápido que
> vos, pero también arma con seguridad una historia que la evidencia no
> sostiene. El valor no es lo que produce: es tu capacidad de reproducirlo.

---

## 6 · Cerrá · 30-35 min

Pedile al agente el borrador y quedátelo con tu criterio:

```
Armá la línea de tiempo de los dos casos aclarando la zona horaria de cada
hora, y proponé una detección por caso con su falso positivo. Marcá cualquier
punto donde no tengas evidencia suficiente.
```

Después completá a mano:

| | La detección | Falso positivo el martes |
|---|---|---|
| LSASS | *Alertar cuando…* | |
| Lateral | *Alertar cuando…* | |

Y respondé en grupo: **¿qué te aportó el agente que a mano hubieras tardado
más, y en qué te quiso hacer comer un dato que no estaba?**

---

## Entregable

- Las dos líneas de tiempo, con las horas y su zona.
- Las dos detecciones, cada una con su falso positivo.
- **Una afirmación del agente que reprodujiste** (con su jq) y **una que
  tuviste que corregir o tumbar**.

---

## Créditos

Datasets: [OTRF Security-Datasets](https://github.com/OTRF/Security-Datasets).
Archivos: `credential_access/host/psh_lsass_memory_dump_comsvcs.zip` y
`lateral_movement/host/empire_psexec_dcerpc_tcp_svcctl.zip`.
