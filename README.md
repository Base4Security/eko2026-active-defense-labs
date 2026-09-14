# Active Cyber Defense: Hunt the Fox on His Land

**Laboratorios · Ekoparty 2026**

Diecisiete ejercicios sobre las ocho horas prácticas del curso. Catorce de teclado
y tres de escribir. Levantás honeypots, plantás tokens, cazás sobre telemetría
real y al final intentás quemar el diseño de otro grupo.

Todo lo que producís en un ejercicio es el insumo del siguiente: nadie arranca de
cero y nadie trabaja sobre un caso que no conoce.

---

## Empezá acá

Abrí **[`index.html`](index.html)** en tu navegador. Es el programa completo, con
los enlaces a las diecisiete guías.

```bash
git clone https://github.com/Base4Security/eko2026-active-defense-labs
cd eko2026-active-defense-labs
open index.html          # macOS
# xdg-open index.html    # Linux
# start index.html       # Windows
```

No hace falta servidor ni instalar nada para leer las guías: son HTML plano.

---

## Los dos carriles

Todo el curso se apoya en una distinción, y conviene tenerla clara antes del
primer ejercicio: **no es lo mismo un sistema falso que un sistema real con algo
falso adentro.**

| | Qué es | Qué detecta | Ejercicios |
|---|---|---|---|
| **Carril A** · Portal de Conciliación | Una app que funciona, con datos y usuarios. Nada de esto es falso: el engaño es lo que le agregás encima | A quien **use** lo que plantaste | E3 · E6 · E7 · E14 |
| **Carril B** · Cowrie y OpenCanary | Servicios enteros que no deberían existir. Nadie legítimo tiene motivo para llegar | A cualquiera que los **toque** | E1 · E4 · E5 · E7 |

La prueba que ordena todo el diseño de deception es una pregunta: *¿un empleado
legítimo lo tocaría?* En el carril B se contesta sola y por eso no enseña nada.
En el carril A hay gente de verdad haciendo su trabajo, así que hay que pensarla
pieza por pieza. El **E7** corre la misma consulta sobre los dos y mide la
diferencia.

---

## Preparación · una sola vez

Todo el Día 1 corre en tu máquina. Necesitás **Docker** instalado y corriendo.
Hacelo antes de empezar: la primera construcción tarda dos o tres minutos.

```bash
docker version

# El laboratorio viene adentro de este mismo repositorio, en mi-lab/
cd eko2026-active-defense-labs/mi-lab

docker compose up -d --build
docker compose ps        # portal, cowrie y opencanary en "running"

open http://localhost:8080      # portal · usuario mcastro / demo1234
ssh root@localhost -p 2222      # honeypot · cualquier contraseña entra
```

**Puertos**: `8080` portal · `2222` SSH del honeypot · `8081` portal falso ·
`1445` y `1433` SMB y MSSQL falsos.

Todos los comandos del curso salen desde `mi-lab/`, salvo que la ficha diga
otra cosa.

Sin internet en el aula, descargá `b4-lab-kit.tar` desde
[Releases](https://github.com/Base4Security/eko2026-active-defense-labs/releases) y usá `docker load -i b4-lab-kit.tar` antes de
levantar el entorno.

### Lo que sí necesita internet

- **canarytokens.org** — E2, E3, E6 y E13
- **Kibana**, en el servidor del curso — E8 a E12
- Una **casilla de correo por grupo** para recibir los callbacks de los tokens

Si se cae la red del venue, el Día 1 funciona igual y para el Día 2 hay copia del
dataset en pendrive.

### Al terminar

```bash
docker compose stop                                      # pausa
docker compose down                                      # fin del curso
docker compose down --rmi all --volumes --remove-orphans # liberar espacio
```

Antes de borrar: los logs del portal y del honeypot son la evidencia de tus
ejercicios E7 y E13. Si te los querés llevar, copialos primero.

---

## Programa

### Día 1 · 105 min — el banco de trabajo

Cuatro ejercicios cortos, cada uno después del módulo teórico que le corresponde.
Todo local, cero dependencia de la red.

| | Ejercicio | Min | Qué hacés |
|---|---|---|---|
| E1 | [Armá tu laboratorio y rompelo](labs/e01-laboratorio-y-delatores.html) | 25 | Levantás el stack y buscás qué delata al honeypot |
| E2 | [Cinco tokens, cinco disparos](labs/e02-cinco-tokens.html) | 25 | DNS, web bug, Word, AWS y QR: qué metadata trae cada uno |
| E3 | [Plantá el engaño en tu portal](labs/e03-plantar-en-el-portal.html) | 30 | Tres piezas en una app real con usuarios reales |
| E4 | [El honeypot que no es SSH](labs/e04-honeypot-no-ssh.html) | 25 | SMB, HTTP y MSSQL falsos: qué captura cada uno |

### Día 2 · 375 min — el día de los datos

EkoFinance no existe como red: existe como dataset. Se reconstruye desde la
telemetría, que es como se lo encuentra un equipo real.

| | Ejercicio | Min | Horario |
|---|---|---|---|
| E5 | [Endurecé el honeypot y medí el delta](labs/e05-endurecer-y-medir.html) | 40 | 09:15 – 10:30 |
| E6 | [La cadena completa](labs/e06-cadena-completa.html) | 35 | |
| E7 | [Cazá sobre tus propios logs](labs/e07-cazar-propios-logs.html) | 35 | 10:45 – 12:00 |
| E8 | [Reconstruí EkoFinance desde la telemetría](labs/e08-reconstruir-ekofinance.html) | 40 | |
| E9 | [Caza 1 · Side-loading](labs/e09-caza-side-loading.html) | 20 | 12:00 – 12:45 |
| E10 | [Caza 2 · LSASS](labs/e10-caza-lsass.html) | 25 | |
| E11 | [Caza 3 · Lateral y salida](labs/e11-caza-lateral-y-salida.html) | 30 | 13:45 – 15:15 |
| E12 | [Caza 4 · La que no se puede hacer](labs/e12-caza-imposible.html) | 20 | |
| W1 | [Brecha → decisión](labs/w1-brecha-decision.html) | 15 | *escritura* |
| W2 | [Ficha de operación](labs/w2-ficha-de-operacion.html) | 25 | *escritura* |
| E13 | [Prueba de disparo cronometrada](labs/e13-prueba-de-disparo.html) | 30 | 15:30 – 16:00 |
| E14 | [Cacería cruzada](labs/e14-caceria-cruzada.html) | 30 | 16:00 – 17:00 |
| W3 | [Defensa de cinco minutos](labs/w3-defensa.html) | 30 | *plenario* |

---

## Cómo están armadas las guías

**Son cuadernos, no PDFs.** Las tablas se completan en la página, se guardan
solas en tu navegador, y se exportan en texto para el reporte del grupo.

- **Exportar** → devuelve todo tu trabajo en Markdown, listo para pegar
- **Importar** → recupera un respaldo `.json` en otra máquina
- **Limpiar** → borra lo cargado en esa guía

> **Al cerrar cada ejercicio, apretá Exportar y mandate el texto al chat del
> grupo.** El trabajo se guarda en el navegador de *esa* máquina; así lo tienen
> todos para el ejercicio siguiente.

---

## Qué entregás

- **Cinco decisiones** con su despliegue concreto y un descarte argumentado — W1
- **Ficha de operación**: objetivo, narrativa, RoE, cierre, roles y exclusiones — W2
- **Tabla de latencias medidas** y calendario de prueba — E13
- **Corrección final** después de escuchar a los otros grupos — W3

---

## Requisitos

- Navegador moderno (Chrome, Firefox, Edge o Safari)
- Docker instalado y corriendo
- `jq` para el E7 y el E13
- `nmap` y `curl` para el E1, E5 y E14
- Ganas de descartar cosas: en varios ejercicios el trabajo es decir «no»

---

## Aviso

Todo el escenario es **ficticio**. EkoFinance, sus activos, el incidente y los
documentos del caso fueron construidos para este curso. Cualquier dominio, IP o
identificador que aparezca está en rangos reservados para documentación
(RFC 5737, RFC 2606) o es inventado.

Las técnicas se enseñan para **defender infraestructura propia**. El
[W2](labs/w2-ficha-de-operacion.html) incluye el límite legal y ético explícito
de lo que se puede y no se puede hacer.

---

Diego Staino · Mariano Quintana — **BASE4 Security**
