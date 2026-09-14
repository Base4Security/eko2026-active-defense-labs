# resources/ — material de apoyo

Archivos que usan los laboratorios. Las guías en `../labs/` los referencian por
ruta relativa, así que no muevas las carpetas.

| Carpeta | Contenido | Usado en |
|---|---|---|
| `00-escenario/` | Diagrama de red de EkoFinance (PNG + fuente `.drawio`) | LAB 00, 04 |
| `01-apt19/` | Ficha del actor, TTPs, IOCs, taxonomía visual | LAB 01 |
| `02-deception/` | Mapa de actividades de engaño, honeyfile de ejemplo, scripts de honey-credential, token con beacon DNS | LAB 02, 06 |
| `03-hunting/` | Mapas de event logs y de memoria, event codes vs técnicas, mapeo Sysmon ↔ ATT&CK, config de referencia | LAB 03 |
| `04-insumos/` | Los cuatro documentos del caso: DFIR, CTI, red anotada, estado del deception | LAB 04, 05, 06 |
| `05-engage/` | Manual de MITRE Engage en español | LAB 07 |
| `docker/` | El entorno de los hands-on | LAB 02, 03, 06, 08 |
| `plantillas/` | Grilla Kill Chain / Diamante / Cursos de acción / Lagunas | LAB 04, 05, 09 |

## Los insumos del caso · `04-insumos/`

Se abren desde las tarjetas del LAB 04, o directo:

1. **`01-informe-tecnico-dfir.html`** — punto de vista forense
2. **`02-reporte-inteligencia-cti.html`** — punto de vista del adversario, con la tabla de lagunas de conocimiento
3. **`03-diagrama-red-anotado.html`** — inventario de activos y recorrido del adversario en 12 saltos
4. **`04-estado-del-deception.html`** — los artefactos de engaño que EkoFinance ya tenía

Los cuatro tienen botón **PDF** y hoja de estilo de impresión en claro: conviene
leer los dos primeros en papel, con lápiz.

> **No abras el insumo 04 hasta el LAB 06.** Se pierde el efecto del ejercicio.

## Sobre los IDs de MITRE Engage

Las guías nombran las actividades de Engage pero **no traen sus identificadores**,
a propósito: cambian entre versiones del framework y citarlos de memoria produce
documentos que no se pueden auditar. Los completás desde
<https://engage.mitre.org/matrix/> en el LAB 07.
