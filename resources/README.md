# resources/ — material extra

**Ningún ejercicio depende de esta carpeta.** Las diecisiete guías se completan
sin abrirla: acá hay material de apoyo para consultar durante el curso y,
sobre todo, para llevarse después.

El programa está en **[`../index.html`](../index.html)**.

---

## Los documentos del caso · `04-insumos/`

Los cuatro informes del incidente de EkoFinance. **Son los únicos que conviene
tener a mano durante el Día 2**: cuando en el E8 reconstruyas la red desde la
telemetría y en el E11 armes la cadena, acá está el contexto que los logs no dan.

1. **[`01-informe-tecnico-dfir.html`](04-insumos/01-informe-tecnico-dfir.html)** — el punto de vista forense: qué se encontró en los sistemas y qué evidencia se preservó
2. **[`02-reporte-inteligencia-cti.html`](04-insumos/02-reporte-inteligencia-cti.html)** — el punto de vista del adversario: campaña, TTPs, atribución tentativa y las lagunas que el propio equipo de CTI declara
3. **[`03-diagrama-red-anotado.html`](04-insumos/03-diagrama-red-anotado.html)** — inventario de activos y el recorrido del adversario, salto por salto
4. **[`04-estado-del-deception.html`](04-insumos/04-estado-del-deception.html)** — los artefactos de engaño que EkoFinance tenía desplegados, y qué reportaron

Los cuatro tienen botón **PDF** y hoja de estilo de impresión en claro.

> **No abras el insumo 03 antes del E8.** El ejercicio es reconstruir la red
> desde los logs; si mirás el diagrama primero, se pierde entero. El E8 te dice
> cuándo abrirlo.

---

## Referencia de caza · `03-hunting/`

Para tener al lado mientras escribís consultas en el E9, E10, E11 y E12.

| Archivo | Qué es |
|---|---|
| `windows-basic-event-logs.pdf` | Mapa mental de los logs nativos de Windows |
| `top-event-codes-vs-techniques.pdf` | Qué event code cubre qué técnica |
| `windows-logging-sysmon-vs-attack-matrix.xlsx` | Mapeo técnica ↔ evento configurable |
| `sysmon-logging-example.xml` | Configuración de Sysmon de referencia |
| `memory-hunting.pdf` | Mapa mental de caza en memoria |

---

## El actor · `01-apt19/`

- `apt19-ekofinance.xlsx` — ficha del actor con TTPs e IOCs
- `APT19-taxonomia.jpg` — taxonomía visual

La fuente canónica es [attack.mitre.org/groups/G0073](https://attack.mitre.org/groups/G0073).
Los IDs de ATT&CK cambian entre versiones: verificá contra la matriz viva antes
de citar cualquiera de estos archivos en un reporte.

---

## Engaño · `02-deception/`

Ejemplos concretos de artefactos, para ampliar lo que hacés en el E3 con cosas
que no entran en el portal.

- `deception-mindmap.png` — mapa de actividades de engaño combinables
- `kerb-honey-account.ps1` — cuenta señuelo kerberoasteable en Active Directory
- `honeyfile-ejemplo.docx` — honeyfile con beacon
- `exe-watcher-token-dns.txt` — token que emite una consulta DNS al ejecutarse

El `.ps1` es el más útil para llevarse: es la pieza de engaño con mejor relación
esfuerzo/resultado en una red con dominio, y es la línea base cero de la que
habla el E7.

---

## Escenario y plantillas

- `00-escenario/` — diagrama de red de EkoFinance en PNG y fuente `.drawio`
- `plantillas/killchain-diamante-coa-gaps.xlsx` — grilla Kill Chain / Diamante /
  Cursos de acción / Lagunas, por si querés llevar el análisis del W1 y el W2 a
  un formato de reporte formal

---

## MITRE Engage

El W2 no trae los identificadores de las actividades de Engage a propósito:
cambian entre versiones del framework y citarlos de memoria produce documentos
que no se pueden auditar. Si querés nombrarlos en tu ficha de operación,
completalos desde <https://engage.mitre.org/matrix/>.
