# resources/ — material extra

**Ningún ejercicio depende de esta carpeta.** Las guías se completan sin abrirla:
acá hay material de apoyo para consultar durante el curso y, sobre todo, para
llevarse después.

---

## Referencia de caza · `02-hunting/`

Para tener al lado mientras escribís consultas de hunting.

| Archivo | Qué es |
|---|---|
| `windows-basic-event-logs.pdf` | Mapa mental de los logs nativos de Windows |
| `top-event-codes-vs-techniques.pdf` | Qué event code cubre qué técnica |
| `windows-logging-sysmon-vs-attack-matrix.xlsx` | Mapeo técnica ↔ evento configurable |
| `sysmon-logging-example.xml` | Configuración de Sysmon de referencia |
| `memory-hunting.pdf` | Mapa mental de caza en memoria |

---

## Engaño · `01-deception/`

Ejemplos concretos de artefactos, para ampliar lo que hacés en el E3 con cosas
que no entran en el portal.

- `deception-mindmap.png` — mapa de actividades de engaño combinables
- `kerb-honey-account.ps1` — cuenta señuelo kerberoasteable en Active Directory
- `honeyfile-ejemplo.docx` — honeyfile con beacon
- `exe-watcher-token-dns.txt` — token que emite una consulta DNS al ejecutarse

El `.ps1` es el más útil para llevarse: es la pieza de engaño con mejor relación
esfuerzo/resultado en una red con dominio.
