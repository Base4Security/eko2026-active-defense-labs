# E3 · Plantá el engaño en el Home Banking

**Primera parte · sobre un sistema real · 30 minutos · grupos de 2-3**

Recibís el Home Banking de EkoBank: una aplicación que funciona, con clientes,
cuentas, transferencias y una consola de administración. Nada de eso es falso.
El engaño es lo que vos le agregás encima.

---

## Objetivo

Recorrer el Home Banking como lo haría un defensor, **evaluar dónde se puede
desplegar engaño**, y plantar tres piezas que puedas defender contra la pregunta
que en un honeypot no tiene sentido:

> **¿Qué usuario legítimo del banco podría tocar esto?**

---

## El sistema

EkoBank está migrando su home banking a una plataforma nueva. Cada sucursal
tiene su propio entorno, con sus clientes, sus movimientos y sus
administradores. La migración está a mitad de camino y quedaron cosas a medio
hacer.

Todo eso es cierto y todo eso funciona: hay clientes que entran, transferencias
que se registran y administradores que gestionan usuarios.

### Acceso

1. Abrí **<https://homebanking-front.vercel.app/>**.
2. Ingresá el **ID de sucursal** que te asignó el instructor (ej. `alumno07`).
   Tu sucursal es tuya: lo que configures ahí no afecta a los demás grupos.
3. Entrá con las credenciales de cliente y de administrador que te dio el
   instructor.

No hay nada que instalar ni que levantar: el E3 no usa `mi-lab/`.

---

## 1 · Recorré y evaluá · 10 min

Antes de plantar nada, **mirá qué tenés**. Recorré el sistema con dos
sombreros y anotá cada lugar donde podría vivir una pieza de engaño.

**Como cliente**
- La pantalla de inicio, las cuentas y los saldos.
- **Transferir**: destinatarios, CBU, concepto.
- **Movimientos**: qué datos se ven de cada operación.

**Como administrador** (`/t/<sucursal>/admin`)
- Clientes, transacciones, usuarios y administradores.
- **Opciones avanzadas**: las palancas para armar tu propio escenario. Cada una
  cambia el comportamiento del servidor al instante y solo en tu sucursal.
  - Exponer un campo en el listado de clientes
  - Gestión de credenciales: admins y claves de clientes
  - Errores detallados: texto de log que se filtra en los errores 500
  - Endpoints de respuesta: `/api/t/<sucursal>/u/<nombre>`, con el status,
    los headers y el contenido que vos elijas
  - Páginas HTML: `/t/<sucursal>/p/<nombre>`
  - Reglas de alerta: cualquier request que contenga un término queda en
    **Logs del sistema**, con la severidad que elijas
  - Latencia artificial
  - Inyección de contenido: un fragmento antes de `</body>` en tus páginas y
    endpoints

**Como adversario**
- Abrí las herramientas de desarrollador: el código fuente, el bundle JS y las
  requests a la API.
- ¿Qué rutas aparecen en el código que la interfaz no muestra?
- ¿Qué devuelve la API cuando algo sale mal?

> Evaluar es la mitad del ejercicio. Un buen lugar para el engaño es uno que
> **un adversario enumerando no puede evitar** y **un usuario trabajando no
> tiene motivo para tocar**.

---

## Piezas de ejemplo

No es un menú cerrado: son ideas para arrancar. Si durante el recorrido
encontraste un lugar mejor, usalo.

| Pieza | Qué la podría disparar |
|---|---|
| Documento tokenizado | Descargarlo y abrirlo |
| Credencial señuelo | Usar la credencial |
| Endpoint de admin | Cualquier request |
| Usuario señuelo | Un intento de login con ese usuario |
| Entrada en `robots.txt` | Visitar la ruta prohibida |
| API key falsa | Usar la key |
| Administrador señuelo | Un login en la consola de admin con ese usuario |
| Cliente señuelo, una cuenta que nadie opera | Consultarla, o transferirle |
| CBU señuelo en un destinatario agendado | Una transferencia hacia ese CBU |
| Campo expuesto en el listado de clientes (ej. `clave_temporal`) | Usar el valor expuesto para entrar |
| Log filtrado en un error 500 (ej. un `secret=` de base de datos) | Usar la credencial del log |
| Endpoint de configuración falso (`/u/config`, `/u/backup`) | Pedir la URL, o usar lo que devuelve |
| Página olvidada de la migración (`/p/migracion`, `/p/soporte`) | Visitarla |
| Comentario HTML con una ruta interna | Seguir la ruta |
| Header de debug en una respuesta (ej. `X-Debug-Token`) | Reusar el token del header |
| Respuesta `401` con `WWW-Authenticate: Basic` | Un intento de autenticación básica |
| Beacon inyectado con un canarytoken del E2 | Abrir la página guardada fuera del navegador de la sesión |
| Link tokenizado en el concepto de una transferencia | Abrir el link desde **Movimientos** |
| Redirect (`302`) hacia una consola que no existe | Seguir el redirect |

### Las palancas que no son piezas

Hay opciones que no engañan por sí solas, pero deciden si una pieza sirve:

- **Reglas de alerta.** Una pieza sin regla es una pieza que dispara sin que
  te enteres. Cada pieza que plantes tiene que tener su término vigilado: la
  ruta, el usuario, el CBU o el valor exacto.
- **Logs del sistema.** Es tu telemetría: acá ves qué disparó, cuándo y desde
  dónde. En el E7 vas a volver acá.
- **Latencia artificial.** No detecta, pero frena: un login lento le cambia el
  cálculo a quien está probando contraseñas en ráfaga.

---

## 2 · Elegí tres y plantalas · 10 min

**Elegí tres.** La escasez es parte del ejercicio: con veinte opciones no
priorizás, ponés todo.

### La regla: una línea por pieza

Por cada pieza que plantes, contestá por escrito: **¿qué usuario legítimo del
banco podría tocar esto?** Un cliente, un operador de la sucursal, un
administrador, un proceso automático.

En un honeypot esta pregunta se contesta sola: nadie legítimo llega nunca, y
por eso no enseña nada. Acá el banco tiene gente de verdad haciendo su trabajo,
así que hay que pensarla pieza por pieza.

- Si **no podés nombrar a nadie**, puede que la pieza esté donde nadie va a
  mirar, adversario incluido.
- Si **podés nombrar a alguien**, vas a tener falsos positivos el martes.

Una buena pieza vive entre las dos: **invisible para el flujo de trabajo
normal, inevitable para alguien que está enumerando.**

### Qué anotar

| Pieza | Dónde exactamente | Qué token usa | Regla de alerta | ¿Qué usuario legítimo la tocaría? |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

- **Dónde exactamente**: la URL, el campo o el usuario. «En el admin» no sirve.
- **Qué token usa**: el canarytoken del E2, o ninguno si la detección es solo
  la regla de alerta.
- **Regla de alerta**: el término exacto y su severidad.

Probá cada pieza vos mismo una vez y confirmá que aparece en **Logs del
sistema**. Una pieza que no probaste es una pieza que no sabés si funciona.

---

## 3 · Rotación · 10 min

Pasá al Home Banking del grupo de al lado: `https://homebanking-front.vercel.app/t/<su-sucursal>`.
Hacé recon crudo: navegá, mirá el código fuente, probá rutas. No tenés que
encontrar todo: es una primera pasada. La cacería seria es el E14, contra el
engaño ya endurecido.

| Grupo | Qué encontraste | Cómo | ¿La disparaste? |
|---|---|---|---|
| | | | Sí / No |

Al volver, mirá tus **Logs del sistema**: ¿qué te tocó el otro grupo, y qué se
te escapó sin dejar rastro?

---

## Dos detecciones, no una

El sistema te avisa que alguien **leyó** la carnada: la regla de alerta la
registra en **Logs del sistema** al instante. El token te avisa que alguien la
**usó**: llega después, desde otra máquina y otra IP, la de quien abrió el
documento y no necesariamente la de quien lo descargó.

Son dos señales separadas, y la distancia entre ellas es lo que vas a medir en
el E13. Tener las dos es lo que te deja distinguir a alguien que husmeó de
alguien que actuó.

---

## Entregable → E6, E7, E13 y E14

- La **evaluación**: los lugares que encontraste en el recorrido.
- Las **tres piezas** desplegadas, cada una con su regla de alerta y su
  justificación.
- El **resultado de la rotación**.

En el E6 las vas a ver disparar en cadena; en el E14 otro grupo va a intentar
quemarlas.

---

## Control de avance

- [ ] Entramos al Home Banking como cliente y como administrador
- [ ] Recorrimos el sistema y anotamos los lugares posibles para el engaño
- [ ] Hay exactamente tres piezas plantadas, no más
- [ ] Cada pieza dice la URL, el campo o el usuario exacto, no «en el portal»
- [ ] Cada pieza tiene su regla de alerta y la probamos en Logs del sistema
- [ ] Cada pieza tiene contestada la pregunta del usuario legítimo
- [ ] Hicimos la rotación y anotamos qué encontró el otro grupo
