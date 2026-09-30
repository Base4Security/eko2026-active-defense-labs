# E6 · Entrá a tu Home Banking

**Cierre · sobre el Home Banking · 5 minutos · individual**

Antes de terminar, confirmá que podés entrar a tu propia sucursal con las dos
credenciales que trae por defecto: la de administrador y la de un cliente. Es
el mismo Home Banking del E3 — acá solo lo abrís y entrás.

---

## Objetivo

Entrar como **cliente** y como **administrador** a tu propia sucursal, con las
credenciales de línea base, y confirmar que ves tu sucursal y no la de otro grupo.

---

## El reloj

| Min | Paso | Qué tiene que quedar |
|---|---|---|
| 0-2 | 1 · Entrá como cliente | Adentro de tu Home Banking, con un usuario por defecto |
| 2-4 | 2 · Entrá como administrador | Adentro de tu consola de admin, con `admin` / `admin` |
| 4-5 | 3 · Confirmá | El nombre de tu sucursal, no el de otro grupo |

---

## 1 · Entrá como cliente · 0-2 min

Abrí la **URL del Home Banking que te da el instructor**, con **tu ID de
sucursal**, en la ruta de login del cliente:

```
<url-del-instructor>/t/<tu-sucursal>/login
```

Usá uno de los tres usuarios que trae cada sucursal por defecto, todos con la
misma clave:

| Usuario | Clave |
|---|---|
| `lucia` | `1234` |
| `martin` | `1234` |
| `sofia` | `1234` |

---

## 2 · Entrá como administrador · 2-4 min

Abrí la consola de administración de tu misma sucursal:

```
<url-del-instructor>/t/<tu-sucursal>/admin/login
```

Usuario y clave, los dos por defecto:

| Usuario | Clave |
|---|---|
| `admin` | `admin` |

---

## 3 · Confirmá · 4-5 min

En las dos pantallas, fijate que el nombre de la sucursal que aparece sea **el
tuyo**. Si entraste con el ID de otro grupo por error, vas a estar mirando su
banco, no el tuyo.

---

## Si algo falla

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| «La sucursal no existe» | El ID de sucursal está mal escrito o no es el tuyo | Confirmá el ID exacto que te dieron |
| Usuario o clave incorrectos | Alguien cambió esa cuenta en un ejercicio anterior (E3) | Probá con otro de los tres usuarios de cliente, o pedile al instructor que resetee tu sucursal |
| Ves el banco de otro grupo | Entraste con el ID de sucursal de otro grupo | Volvé a la URL con tu propio ID |

---

## Entregable

- Una captura (o confirmación oral) de que entraste como cliente y como
  administrador a **tu propia** sucursal.
