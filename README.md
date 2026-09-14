# Active Cyber Defense: Hunt the Fox on His Land

**Laboratorios · Ekoparty 2026** — Diego Staino · Mariano Quintana · BASE4 Security

Diecisiete ejercicios sobre las ocho horas prácticas del curso. Catorce de
teclado y tres de escribir. Levantás honeypots, plantás tokens, cazás sobre
telemetría real y al final intentás quemar el diseño de otro grupo.

---

## Abrí la guía

Todo el programa —los diecisiete ejercicios, el cronograma y las guías— está en
**[`index.html`](index.html)**. Empezá ahí.

```bash
git clone https://github.com/Base4Security/eko2026-active-defense-labs
cd eko2026-active-defense-labs

open index.html          # macOS
# xdg-open index.html    # Linux
# start index.html       # Windows
```

No hace falta servidor ni instalar nada para leer las guías: son HTML plano y
funcionan abriéndolas con doble clic.

---

## Antes del curso: Docker

Los ejercicios del Día 1 corren en tu máquina. Necesitás **Docker** instalado y
corriendo, y conviene levantar el laboratorio una vez antes de empezar: la
primera construcción tarda dos o tres minutos.

```bash
cd mi-lab
docker compose up -d --build
docker compose ps        # portal, cowrie y opencanary en "running"
```

Puertos, credenciales y resolución de problemas:
**[`mi-lab/README.md`](mi-lab/README.md)**.

---

## Qué hay en el repositorio

| Carpeta | Qué es |
|---|---|
| **[`index.html`](index.html)** | **El programa. Empezá acá.** |
| [`labs/`](labs/) | Las diecisiete guías, una por ejercicio |
| [`mi-lab/`](mi-lab/) | Tu laboratorio: el portal y los dos honeypots |
| [`resources/`](resources/) | Material extra: el caso, fichas y mapas de referencia |
| `assets/` | Estilos y scripts de las guías |

---

## Las guías son cuadernos, no PDFs

Las tablas se completan en la página y se guardan solas en tu navegador.

- **Exportar** → devuelve tu trabajo en Markdown, listo para pegar
- **Importar** → recupera un respaldo `.json` en otra máquina
- **Limpiar** → borra lo cargado en esa guía

> **Al cerrar cada ejercicio, apretá Exportar y mandate el texto al chat del
> grupo.** El trabajo se guarda en el navegador de *esa* máquina, y varios
> ejercicios usan lo que produjo el anterior.

---

## Aviso

Todo el escenario es **ficticio**. EkoFinance, sus activos, el incidente y los
documentos del caso fueron construidos para este curso. Cualquier dominio, IP o
identificador que aparezca está en rangos reservados para documentación
(RFC 5737, RFC 2606) o es inventado.

Las técnicas se enseñan para **defender infraestructura propia**. El ejercicio
[W2](labs/w2-ficha-de-operacion.html) incluye el límite legal y ético explícito
de lo que se puede y no se puede hacer.
