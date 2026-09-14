# docker/ — el entorno de los hands-on

Cuatro laboratorios se corren en tu máquina:

| Lab | Qué hacés |
|---|---|
| **02** | Desplegás un señuelo, lo tocás, ves la telemetría que produce |
| **03** | Generás actividad y la consultás: caza sobre datos propios |
| **06** | Auditás ese mismo artefacto y encontrás qué lo delata |
| **08** | Medís la latencia real de la prueba de disparo |

## Puesta en marcha

Necesitás **Docker** instalado y corriendo. Dos caminos:

### Con internet (recomendado)

```bash
cd resources/docker
docker compose up -d --build
docker compose ps
```

Construye los dos servicios propios y baja Cowrie. Tarda 2–3 minutos la primera vez.

### Sin internet

Descargá `b4-deception-kit.tar` desde la sección **Releases** de este repositorio
y cargalo antes de levantar el entorno:

```bash
docker load -i b4-deception-kit.tar
cd resources/docker
docker compose up -d
```

## Qué levanta

| Servicio | Puerto | Qué es | Cómo se toca |
|---|---|---|---|
| `cowrie` | 2222 (ssh), 2223 (telnet) | Honeypot SSH de interacción media | `ssh root@localhost -p 2222` — cualquier contraseña entra |
| `dns-beacon` | 5354/udp | Sumidero DNS con registro de consultas | `dig @localhost -p 5354 65288a6b46da2.tokens.ekofinance.local` |
| `spidertrap` | 8080 | Laberinto de enlaces contra crawlers | `curl -s http://localhost:8080/ \| head` |

## Ver la telemetría

```bash
docker compose logs -f cowrie
docker compose logs dns-beacon

# JSON estructurado, un evento por línea
docker compose exec cowrie tail -f var/log/cowrie/cowrie.json | jq -c \
  '{eventid, src_ip, username, password, input}'
```

## Al terminar · cerrar y eliminar

```bash
cd resources/docker

# Pausa: apagar y conservar todo para después
docker compose stop

# Fin del curso: eliminar contenedores y red, conservar las imágenes
docker compose down

# Borrón y cuenta nueva: eliminar también las imágenes (~400 MB)
docker compose down --rmi all --volumes --remove-orphans
rm -rf cowrie/            # logs y claves que generó el honeypot

# Verificar que no quedó nada
docker ps -a | grep b4-
docker images | grep -E 'b4/|cowrie'
```

Si vas a reproducir los hands-on en tu trabajo, quedate en `stop`: conservás las
imágenes y no hay que reconstruir.

**Antes de borrar**, si querés llevarte la telemetría de los laboratorios 03 y 08:

```bash
docker compose cp cowrie:/cowrie/var/log/cowrie ./mis-logs
```

## Si algo falla

- **Primer arranque de Cowrie.** Genera claves de host y tarda unos segundos. Esperá y reintentá.
- **Puerto ocupado.** Cambiá el mapeo en `docker-compose.yml`.
- **En macOS el 5353 está ocupado** por `mDNSResponder`, por eso el beacon se publica en **5354**.
- **`jq` no instalado.** `docker compose logs` alcanza para todo.
- **Sin Docker.** Los laboratorios de diseño funcionan igual. Hacé los hands-on de a dos.

## Qué es cada pieza

- **`dns-beacon`** y **`spidertrap`** son código de este repositorio (Python, sin
  dependencias). Emiten una línea JSON por evento, así que se pueden consultar
  con `jq` o mandar a un colector.
- **`cowrie`** usa la imagen publicada por el proyecto ([cowrie/cowrie](https://github.com/cowrie/cowrie)).

El honeypot viene **sin configurar a propósito**: encontrar qué lo delata es
parte del LAB 06.
