# E2 · Cinco tokens, cinco disparos

**Sobre señuelos que avisan · 10 minutos · grupos de 2-3**

Un **canarytoken** es una carnada que no hace nada hasta que alguien la toca: al
tocarla, te manda un aviso con quién, desde dónde y con qué. En este lab generás
cinco tipos distintos en [canarytokens.org](https://canarytokens.org/), los
disparás vos mismo y mirás qué reporta cada uno. Cada tipo descubre una cosa
diferente del que picó.

> **Necesitás internet y una casilla de correo.** Puede ser la tuya o una
> temporal (por ejemplo [yopmail.com](https://yopmail.com/)). Todos los tokens
> avisan por mail, así que tené la casilla abierta en otra pestaña.

---

## Objetivo

Entender la idea que sostiene todo el deception: **plantar una señal que solo se
enciende ante actividad ilegítima.** Al final tenés que poder decir, para cada
token, *qué* aprendés del adversario cuando salta.

---

## El reloj

| Min | Paso | Qué tiene que quedar |
|---|---|---|
| 0-2 | 1 · Preparar | Casilla lista y canarytokens.org abierto |
| 2-6 | **2 · Generar los cinco** | Los cinco tokens creados y anotados |
| 6-9 | **3 · Dispararlos** | Un disparo por token |
| 9-10 | 4 · Leer los avisos | Qué reportó cada uno |

---

## Paso 1 — Preparar · 0-2 min

1. Abrí una casilla de correo. Si no querés usar la tuya, entrá a
   [yopmail.com](https://yopmail.com/), inventá un nombre y dejá esa bandeja
   abierta.
2. Abrí [canarytokens.org](https://canarytokens.org/) en otra pestaña.

Cada token se crea igual: elegís el **tipo** en el desplegable, ponés tu
**correo** (adonde llega el aviso) y una **nota** para acordarte de qué es ese
token. Después apretás **Create my Canarytoken** y te lo llevás.

> **Para pensar:** la nota no es un detalle. En una red real vas a tener decenas
> de tokens plantados; cuando salte uno, esa nota es lo único que te dice *cuál*
> de tus señuelos tocaron y *dónde estaba*.

---

## Paso 2 — Generar los cinco · 2-6 min

Creá **un token de cada tipo**. Anotá lo que te da cada uno (URL, hostname,
claves o archivo): lo vas a necesitar para dispararlo en el paso 3.

**1 · DNS.** Elegí *DNS token*. Te devuelve un hostname del estilo
`a1b2c3d4e5.canarytokens.com`. Salta cuando **alguien resuelve ese nombre**, sin
que haga falta conexión: alcanza con que un DNS lo consulte.

**2 · Web bug (URL token).** Elegí *Web bug / URL token*. Te devuelve una URL.
Salta cuando **alguien la abre en un navegador**, y registra el `User-Agent` y la
IP de quien la cargó.

**3 · Documento Word.** Elegí *Microsoft Word document*. Te descargás un `.docx`
que parece un documento común. Salta cuando **alguien lo abre** con Word o
LibreOffice, y reporta desde la máquina de quien lo abrió.

**4 · Credenciales AWS.** Elegí *AWS keys*. Te da un par
`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` falso pero con formato real. Salta
cuando **alguien intenta usar esas claves** contra AWS.

**5 · Código QR.** Elegí *QR code*. Te da una imagen de QR que esconde una URL
token. Salta cuando **alguien lo escanea** y abre el enlace con el teléfono.

> **Para pensar:** ninguno de los cinco necesita que plantes malware. Son
> archivos, nombres y claves que *parecen* valiosos. El engaño está en que un
> usuario legítimo no tiene motivo para tocarlos — la misma pregunta del E3.

---

## Paso 3 — Dispararlos · 6-9 min

Ahora hacés vos de adversario. Tres se disparan por consola y dos a mano.

**1 · DNS** — resolvé el hostname que te dio el token:

```bash
dig +short a1b2c3d4e5.canarytokens.com
```

```powershell
# Windows · PowerShell (dig no viene; usá Resolve-DnsName)
Resolve-DnsName a1b2c3d4e5.canarytokens.com
```

**2 · Web bug** — abrí la URL **en el navegador**, no con `curl`. El punto es que
se registre un `User-Agent` real:

```powershell
# opcional, para abrirla desde la consola
Start-Process "https://canarytokens.com/....."
```

**4 · Credenciales AWS** — no inicies sesión: solo *usá* las claves. Con eso ya
queda registrada la intención:

```bash
AWS_ACCESS_KEY_ID=AKIA... AWS_SECRET_ACCESS_KEY=... \
  aws s3 ls --region us-east-1
```

```powershell
# Windows · PowerShell
$env:AWS_ACCESS_KEY_ID='AKIA...'; $env:AWS_SECRET_ACCESS_KEY='...'
aws s3 ls --region us-east-1
```

**3 · Documento Word** y **5 · Código QR** se disparan a mano:

- Abrí el `.docx` con Word o LibreOffice.
- Escaneá el QR con el celular — **mejor con datos móviles**: así el callback trae
  la red del teléfono y no la del aula. Eso no es un accidente, es otro punto de
  observación.

> **Para pensar:** el token AWS salta con `aws s3 ls`, no con un login. Lo que se
> registra es el **uso de la credencial**, no una autenticación exitosa. Un
> adversario que encuentra claves las prueba: ese reflejo es lo que lo delata.

---

## Paso 4 — Leer los avisos · 9-10 min

Volvé a la casilla de correo. Deberías tener hasta cinco avisos. Compará qué
trae cada uno y completá:

| Token | Qué reporta cuando salta |
|---|---|
| DNS | Que alguien resolvió el nombre (a veces sin la IP final del que picó) |
| Web bug | `User-Agent` e IP de quien abrió la URL |
| Documento Word | Datos de la máquina donde se abrió el documento |
| Credenciales AWS | El uso de la clave: la llamada, no un login |
| Código QR | La red del teléfono que lo escaneó |

> **La idea del lab:** cinco carnadas, cinco cosas distintas descubiertas. Un
> token no es un detector genérico — cada tipo ilumina una parte diferente de
> quien lo tocó. Elegir el token es elegir *qué* querés aprender del adversario.

---

## Entregable

- Los cinco tokens generados (tipo y para qué lo plantarías).
- Para cada uno, **qué reportó** al dispararlo.
- Una línea: de los cinco, ¿cuál plantarías en el Home Banking del E3, y dónde?

---

## Notas

- Es el único lab que **no se puede hacer sin internet ni sin correo**: los
  tokens se generan y avisan desde canarytokens.org. Si el wifi del aula anda
  mal, es el primero que sufre.
- Los nombres exactos de los tipos en el sitio pueden cambiar con el tiempo;
  buscá el que coincida con la descripción de cada paso.
- `aws` (AWS CLI) hace falta solo para el token de credenciales. En Windows:
  `winget install Amazon.AWSCLI`.
