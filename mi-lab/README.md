# Tu laboratorio

Un honeypot SSH. Corre entero en tu máquina.

Esta carpeta viene **adentro del repositorio de las guías**: si lo clonaste para
leer el programa, ya la tenés.

```bash
git clone https://github.com/Base4Security/eko2026-active-defense-labs   # si todavía no lo tenés
cd eko2026-active-defense-labs/mi-lab

docker compose up -d --build
docker compose ps             # cowrie en "running"
```

| Servicio | Puerto | Qué es |
|---|---|---|
| Cowrie | `2222` | Honeypot SSH. **Falso entero**: nadie legítimo tiene motivo para llegar |

> El engaño sobre un sistema **real** se practica en el E3, sobre un Home Banking
> hosteado — no usa esta carpeta. Acá vive el honeypot falso entero.

```bash
ssh root@localhost -p 2222     # cualquier contraseña entra
```

```powershell
# Windows · PowerShell
ssh root@localhost -p 2222
```

> **Windows**: todo lo de esta página corre igual, salvo la plomería de texto
> (`tail`, `jq`, `cp`). Cada bloque trae su equivalente en PowerShell. Abrí
> PowerShell, no `cmd`, y acordate de `curl.exe` en lugar de `curl`.

---

## Bajar el entorno

```bash
docker compose stop     # pausa; arranca en segundos
docker compose down     # fin del curso
```

Antes de borrar, el log de Cowrie es la evidencia de tus ejercicios E7 y E13.
Está montado desde el disco, así que alcanza con copiarlo:

```bash
cp -r cowrie/log ~/mis-logs-cowrie
```

```powershell
# Windows · PowerShell
Copy-Item cowrie\log $HOME\mis-logs-cowrie -Recurse
```
