# E2 · Plantá el engaño en el Home Banking

**Sobre un sistema real · 10 minutos · grupos de 2-3**

Recibís el Home Banking de EkoBank: una aplicación que funciona, con clientes,
cuentas y una consola de administración. Nada de eso es falso. El engaño es lo
que vos le agregás encima.

---

## Objetivo

Recorrer el Home Banking, **evaluar dónde se puede desplegar engaño**, y plantar
tres piezas que puedas defender contra la pregunta que en un honeypot no tiene
sentido:

> **¿Qué usuario legítimo del banco podría tocar esto?**

No usa `mi-lab/`: entrás con tu ID de sucursal a
**<https://homebanking-front.vercel.app/>** y trabajás ahí.

---

## El reloj

| Min | Paso | Qué tiene que quedar |
|---|---|---|
| 0-4 | 1 · Recorré y evaluá | Los lugares posibles para el engaño, anotados |
| 4-8 | **2 · Elegí tres y plantalas** | Tres piezas, cada una con su regla de alerta |
| 8-10 | 3 · Rotación | Qué encontró el grupo de al lado |

---

## 1 · Recorré y evaluá · 0-4 min

Entrá con tu ID de sucursal y recorré con tres sombreros. Anotá cada lugar donde
podría vivir una pieza de engaño.

- **Cliente** — inicio, cuentas, transferencias (destino, CBU, concepto), movimientos.
- **Administrador** (`/t/<sucursal>/admin`) — clientes, transacciones, usuarios y,
  sobre todo, **Opciones avanzadas**: las palancas para armar tu escenario. Cada
  una cambia el comportamiento del servidor al instante y solo en tu sucursal.
- **Adversario** — herramientas de desarrollador: el código fuente, el bundle JS
  y las requests a la API. ¿Qué rutas aparecen que la interfaz no muestra?

> Un buen lugar para el engaño es uno que **un adversario enumerando no puede
> evitar** y **un usuario trabajando no tiene motivo para tocar**.

---

## 2 · Elegí tres y plantalas · 4-8 min

**Elegí tres.** La escasez es el ejercicio: con veinte opciones no priorizás,
ponés todo. Plantás desde **Admin → Opciones avanzadas**.

### Piezas de ejemplo — no es un menú cerrado

| Pieza | Qué la podría disparar |
|---|---|
| Documento tokenizado | Descargarlo y abrirlo |
| Credencial señuelo | Usar la credencial |
| Endpoint de admin | Cualquier request |
| Usuario señuelo | Login con ese usuario |
| Entrada en `robots.txt` | Visitar la ruta prohibida |
| API key falsa | Usar la key |
| Administrador señuelo | Login en la consola de admin |
| Cliente señuelo | Consultarlo o transferirle |
| CBU señuelo agendado | Transferir a ese CBU |
| Campo expuesto en el listado de clientes | Entrar con ese valor |
| Log filtrado en un error 500 | Usar la credencial del log |
| Endpoint `/u/config` falso | Pedirlo o usar su contenido |
| Página `/p/migracion` | Visitarla |
| Comentario HTML con una ruta interna | Seguir la ruta |
| Header `X-Debug-Token` | Reusar el token |
| Respuesta `401` con Basic auth | Intentar autenticarse |
| Beacon con un canarytoken | Abrir la página guardada |
| Link tokenizado en el concepto de una transferencia | Abrirlo en Movimientos |
| Redirect a una consola que no existe | Seguir el redirect |

Si encontraste un lugar mejor en el recorrido, usalo.

### Las palancas que no son piezas

- **Reglas de alerta** — una pieza sin regla dispara sin que te enteres. Cada
  pieza tiene su término vigilado: la ruta, el usuario, el CBU o el valor exacto.
- **Logs del sistema** — tu telemetría: qué disparó, cuándo y desde dónde.
- **Latencia artificial** — no detecta, pero frena una ráfaga de contraseñas.

### La regla: una línea por pieza

Por cada pieza, contestá por escrito: **¿qué usuario legítimo del banco podría
tocar esto?**

- Si **no podés nombrar a nadie**, puede que esté donde nadie va a mirar.
- Si **podés nombrar a alguien**, vas a tener falsos positivos el martes.

Una buena pieza vive entre las dos: invisible para el trabajo normal, inevitable
para quien enumera.

| Pieza | Dónde exactamente | Qué token usa | Regla de alerta | ¿Qué usuario legítimo la tocaría? |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

Probá cada pieza vos mismo y confirmá que aparece en **Logs del sistema**.

---

## 3 · Rotación · 8-10 min

Pasá al Home Banking del grupo de al lado
(`https://homebanking-front.vercel.app/t/<su-sucursal>`) y hacé recon crudo:
navegá, mirá el código, probá rutas. Al volver, mirá tus **Logs del sistema**:
¿qué te tocó, y qué se te escapó sin dejar rastro?

| Grupo | Qué encontraste | Cómo | ¿La disparaste? |
|---|---|---|---|
| | | | Sí / No |

---

## Dos detecciones, no una

El sistema te avisa que alguien **leyó** la carnada: la regla de alerta la
registra al instante. El token te avisa que alguien la **usó**: llega después,
desde otra máquina y otra IP. Tener las dos es lo que te deja distinguir a
alguien que husmeó de alguien que actuó.

---

## Entregable

- La **evaluación**: los lugares que encontraste en el recorrido.
- Las **tres piezas** desplegadas, cada una con su regla de alerta y su
  justificación.
- El **resultado de la rotación**.

---

## Control de avance

- [ ] Entramos al Home Banking como cliente y como administrador
- [ ] Recorrimos el sistema y anotamos los lugares posibles para el engaño
- [ ] Hay exactamente tres piezas plantadas
- [ ] Cada pieza dice la URL, el campo o el usuario exacto, no «en el portal»
- [ ] Cada pieza tiene su regla de alerta y la probamos en Logs del sistema
- [ ] Cada pieza tiene contestada la pregunta del usuario legítimo
- [ ] Hicimos la rotación
