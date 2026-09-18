# Tu laboratorio

Tres servicios. Corre entero en tu máquina.

Esta carpeta viene **adentro del repositorio de las guías**: si lo clonaste para
leer el programa, ya la tenés.

```bash
git clone https://github.com/Base4Security/eko2026-active-defense-labs   # si todavía no lo tenés
cd eko2026-active-defense-labs/mi-lab

docker compose up -d --build
docker compose ps             # portal, cowrie y opencanary en "running"
```

| Servicio | Puerto | Qué es |
|---|---|---|
| Portal de Pagos | `8080` | Un sistema **real**: datos, usuarios, documentos. El engaño es lo que le agregás |
| Cowrie | `2222` | Honeypot SSH. **Falso entero**: nadie legítimo tiene motivo para llegar |
| OpenCanary | `8081 · 1445 · 1433` | HTTP, SMB y MSSQL, también **falsos enteros** |

> **El SMB son tres procesos, no uno.** OpenCanary *no* levanta un servidor
> SMB: sólo tail-ea un archivo de auditoría. Quien atiende el 445 es un `smbd`
> de verdad con el VFS `full_audit`, y quien deja esas líneas donde OpenCanary
> las busca es un `rsyslog`. Los tres arrancan desde
> `opencanary/entrypoint.sh`; la cadena está explicada en `opencanary/smb.conf`.
> Si alguna de las dos primeras piezas se cae, el puerto sigue aceptando
> conexiones —las acepta el redirector de Docker— y el honeypot deja de
> registrar sin avisar. Después del primer arranque conviene mirar
> `docker compose logs opencanary`.

```bash
open http://localhost:8080     # mcastro / demo1234
ssh root@localhost -p 2222     # cualquier contraseña entra
```

```powershell
# Windows · PowerShell
Start-Process http://localhost:8080
ssh root@localhost -p 2222
```

> **Windows**: todo lo de esta página corre igual, salvo la plomería de texto
> (`tail`, `jq`, `cp`). Cada bloque de abajo trae su equivalente en PowerShell.
> Abrí PowerShell, no `cmd`, y acordate de `curl.exe` en lugar de `curl`.

---

## Las fechas de los documentos

Git no preserva las fechas de modificación: después de un `clone` todos los
archivos quedan con la fecha del checkout, y **un repositorio de documentos
donde todo se modificó el mismo minuto se cae ante el primer `ls -la`**.

El portal las reaplica solo al arrancar, desde `data/archivos.json`. No hay que
correr nada.

Lo que sí importa: **un archivo que no figure en ese mapa conserva su fecha
real** — que para algo recién copiado es hoy. Si plantás un documento entre los
otros cuatro y no le ponés fecha, va a ser el único de esta semana en un listado
donde el resto tiene meses. Es el mismo problema que vas a arreglar a mano en el
honeypot en el **E5**.

---

## El portal es real

Tiene 28 pagos con datos, 10 usuarios que entran de verdad, cuatro
documentos operativos, una API y una zona de administración con control de rol.
**Nada de eso es un señuelo.**

```
portal/
├── app.py                  el servidor (sin dependencias, legible)
├── config/
│   ├── .env                ← superficie 2 · credencial señuelo
│   └── senuelos.json       ← superficie 3 · rutas señuelo
├── data/
│   ├── usuarios.json       ← superficie 4 · usuario señuelo
│   ├── pagos.json
│   └── archivos.json        fechas de los documentos
├── archivos/               ← superficie 1 · documento tokenizado
├── static/
│   ├── app.js              ← superficie 6 · API key falsa
│   ├── robots.txt          ← superficie 5 · Disallow que invita
│   └── estilo.css
└── logs/access.log         tu telemetría del portal
```

Todo eso está **montado desde el disco**: editás un archivo acá afuera, recargás
el navegador, y el portal ya lo ve. No hay que entrar al contenedor ni
reconstruir la imagen.

### Cómo se planta cada una

**1 · Documento tokenizado** — dejá el `.docx` en `archivos/` y agregalo a
`data/archivos.json` con una fecha que cierre con las otras. Si no lo hacés, va
a ser el único documento modificado hoy y se nota a la primera mirada.

**2 · Credencial señuelo** — agregá una línea al final de `config/.env`, con el
mismo formato y tono que las de arriba.

**3 · Ruta señuelo** — en `config/senuelos.json`:

```json
[
  {
    "ruta": "/admin-pagos",
    "titulo": "Consola de pagos",
    "cuerpo": "Acceso restringido. Registre el ticket antes de operar."
  }
]
```

**4 · Usuario señuelo** — agregá una entrada a `data/usuarios.json` con
`"senuelo": true`. Si además le ponés `"habilitado": false`, el intento de login
queda registrado igual — que es lo que querés.

**5 · `robots.txt`** — un `Disallow` más. Ojo: la ruta que declares tiene que
existir en `senuelos.json`, o va a dar 404 y no vas a enterarte de que alguien
la buscó.

**6 · API key falsa** — una constante más en el objeto `CONFIG` de
`static/app.js`. Que el nombre encaje con el resto del archivo.

---

## El log

Una línea JSON por request, en `portal/logs/access.log`. Listo para `jq`:

```bash
# quién intentó entrar y falló
jq -r 'select(.path=="/login" and .status==401) | .usuario' \
  portal/logs/access.log | sort | uniq -c | sort -rn

# rutas más pedidas
jq -r .path portal/logs/access.log | sort | uniq -c | sort -rn | head

# sólo los toques a señuelos
jq -c 'select(.senuelo == true) | {time, path, usuario, remote_addr}' \
  portal/logs/access.log
```

En Windows no hace falta `jq`: PowerShell lee JSON de fábrica.

```powershell
# quién intentó entrar y falló
Get-Content portal\logs\access.log | ConvertFrom-Json |
  Where-Object { $_.path -eq '/login' -and $_.status -eq 401 } |
  Group-Object usuario | Sort-Object Count -Descending | Select-Object Count, Name

# rutas más pedidas
Get-Content portal\logs\access.log | ConvertFrom-Json |
  Group-Object path | Sort-Object Count -Descending | Select-Object Count, Name -First 10

# sólo los toques a señuelos
Get-Content portal\logs\access.log | ConvertFrom-Json |
  Where-Object { $_.senuelo -eq $true } |
  Select-Object time, path, usuario, remote_addr
```

El campo `senuelo` aparece únicamente cuando se toca algo que vos plantaste. Es
instrumentación tuya: el adversario no ve este log. Saber cuáles de tus activos
son señuelos es lo que te deja medir la latencia en el **E13**.

---

## Las dos detecciones

El portal te avisa que alguien **leyó** la carnada: sale en `access.log`, al
instante. El token te avisa que alguien la **usó**: llega después, desde otra
máquina y otra IP — la de quien abrió el documento, no la de quien lo descargó.

Son dos señales separadas y la distancia entre ellas es lo que medís en el E13.
Tener las dos es lo que te deja distinguir a alguien que husmeó de alguien que
actuó.

---

## Bajar el entorno

```bash
docker compose stop     # pausa; arranca en segundos
docker compose down     # fin del curso
```

Antes de borrar, los logs son la evidencia de tus ejercicios E7 y E13:

Los dos logs están montados desde el disco, así que alcanza con copiarlos:

```bash
cp portal/logs/access.log ~/mis-logs-portal.json
cp -r cowrie/log ~/mis-logs-cowrie
```

```powershell
# Windows · PowerShell
Copy-Item portal\logs\access.log $HOME\mis-logs-portal.json
Copy-Item cowrie\log $HOME\mis-logs-cowrie -Recurse
```
