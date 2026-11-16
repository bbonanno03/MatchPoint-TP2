# MatchPoint - API REST

Servidor Node.js + Express del TP Final de Taller de Programacion 2.

## Instalacion y ejecucion

```bash
cd server
npm install
cp .env.example .env     # completar los valores
npm start                # o npm run dev para reiniciar al guardar
npm test
```

## Configuracion (`.env`)

| Variable | Descripcion | Default |
| --- | --- | --- |
| `PORT` | Puerto del servidor | `8080` |
| `MODO_PERSISTENCIA` | `MEM` (memoria) o `SUPABASE` | `MEM` |
| `SUPABASE_URL` | URL del proyecto de Supabase | - |
| `SUPABASE_KEY` | service_role key de Supabase (no subir al repo) | - |
| `MODO_MAIL` | `MEM` (guarda mensajes en un array) o `SMTP` (nodemailer). Independiente de `MODO_PERSISTENCIA` | `MEM` |
| `SMTP_HOST` | Servidor de correo; obligatorio con `MODO_MAIL=SMTP` | vacio |
| `SMTP_PORT` | Puerto SMTP entre 1 y 65535; `465` usa TLS directo, los demas exigen STARTTLS | `587` |
| `SMTP_USER` | Usuario SMTP; obligatorio con `MODO_MAIL=SMTP` | vacio |
| `SMTP_PASS` | Contrasena SMTP; para Gmail, contrasena de aplicacion. Obligatoria con `MODO_MAIL=SMTP` | vacio |
| `MAIL_FROM` | Email del remitente; obligatorio con `MODO_MAIL=SMTP` | vacio |

Ejemplo de configuracion para Gmail (reemplazar los valores de ejemplo en el `.env` local, que no se versiona):

```dotenv
MODO_MAIL=SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-cuenta@gmail.com
SMTP_PASS=TU_CONTRASENA_DE_APLICACION
MAIL_FROM=tu-cuenta@gmail.com
```

La maquina debe tener salida al host y puerto SMTP configurados. Se mantiene la verificacion TLS. En modo `MEM` no se necesitan credenciales ni red: se puede inyectar el adaptador de correo en el servicio y consultar su propiedad `mails` para probar los mensajes. No se envian correos reales en los tests.

## Base de datos (Supabase)

Los cambios a las tablas estan en `sql/`, numerados. Se ejecutan en orden desde **Supabase > SQL Editor** (se pueden correr mas de una vez):

| Archivo | Que hace |
| --- | --- |
| [`001_lista_espera.sql`](sql/001_lista_espera.sql) | Crea `waiting_list`, sus claves foraneas, restriccion de inscripcion unica por usuario/turno e indice de busqueda por turno |
| [`002_canchas_techada_ubicacion.sql`](sql/002_canchas_techada_ubicacion.sql) | Agrega a `courts` los campos `covered` (techada), `latitude` y `longitude` |

Antes de ejecutar `001_lista_espera.sql` deben existir las tablas base `courts`, `profiles` y `reservations` del proyecto. `waiting_list.user_id` y `court_id` son UUID y referencian `profiles.id` y `courts.id`; `id` es un UUID generado por la base. La fecha es `date`, la hora es `time` con precision de minutos y `created_at` es `timestamptz`.

El script habilita RLS y revoca el acceso directo a `anon` y `authenticated`: las operaciones de lista de espera pasan por esta API, que verifica el token y usa la conexion de servidor con `SUPABASE_KEY` de tipo `service_role`. Esa clave nunca debe ir en el frontend ni reemplazarse por `VITE_SUPABASE_ANON_KEY`. En modo `MEM` no se ejecutan scripts SQL.

## Autenticacion

Las rutas protegidas esperan el header:

```
Authorization: Bearer <token>
```

- Modo `SUPABASE`: el token es el `access_token` que Supabase Auth le da al usuario al loguearse en el front.
- Modo `MEM`: tokens fijos de prueba `token-admin` y `token-player`.

| Respuesta | Cuando |
| --- | --- |
| `401` | Falta el token, es invalido o el usuario esta inactivo |
| `403` | La ruta es solo para administradores y el usuario no lo es |

## Formato de errores

Los errores capturados por el middleware responden JSON:

```json
{ "url": "/api/...", "method": "GET", "error": "mensaje" }
```

Los rechazos de autenticacion y rol pueden responder solo `{ "error": "mensaje" }`.

## Endpoints

| Metodo | Ruta | Auth | Descripcion | Respuestas |
| --- | --- | --- | --- | --- |
| `GET` | `/api/health` | No | Estado del servidor | `200 { "estado": "ok" }` |
| cualquiera | ruta inexistente | - | - | `404` |
| cualquiera | body JSON invalido | - | - | `400 "JSON mal formado"` |

### Canchas (`/api/canchas`) - ABM completo

| Metodo | Ruta | Auth | Descripcion | Respuestas |
| --- | --- | --- | --- | --- |
| `GET` | `/api/canchas` | No | Lista las canchas. Filtros opcionales: `?techada=true\|false`, `?deporte=Pádel\|Tenis` | `200` lista · `400` filtro invalido |
| `GET` | `/api/canchas/:id` | No | Devuelve una cancha | `200` · `404` |
| `POST` | `/api/canchas` | Admin | Crea una cancha | `201` cancha creada · `400` · `401` · `403` |
| `PUT` | `/api/canchas/:id` | Admin | Modifica los campos enviados | `200` · `400` · `401` · `403` · `404` |
| `DELETE` | `/api/canchas/:id` | Admin | Borra la cancha | `200` cancha borrada · `401` · `403` · `404` · `409` si tiene reservas (Supabase) |

Campos de una cancha:

| Campo | Tipo | Alta | Regla |
| --- | --- | --- | --- |
| `name` | texto | obligatorio | 3 a 50 caracteres |
| `sport` | texto | obligatorio | `Pádel` o `Tenis` |
| `club` | texto | obligatorio | 2 a 50 caracteres |
| `location` | texto | obligatorio | 2 a 80 caracteres |
| `price` | numero | obligatorio | tarifa por hora, mayor a 0 |
| `active` | booleano | opcional | default `true` |
| `covered` | booleano | opcional | techada; default `false` (al aire libre) |
| `latitude` / `longitude` | numero | opcional | van las dos juntas; -90 a 90 y -180 a 180 |

Ejemplo de alta:

```http
POST /api/canchas
Authorization: Bearer token-admin
Content-Type: application/json

{ "name": "Cancha Tenis 2", "sport": "Tenis", "club": "MatchPoint Club", "location": "Moron", "price": 14000, "latitude": -34.65, "longitude": -58.62 }
```

Respuesta `201`: la cancha con su `id`, `active: true` y `covered: false`.

Error de validacion (`400`):

```json
{ "url": "/api/canchas", "method": "POST", "error": "\"price\" must be a positive number" }
```

### Lista de espera (`/api/lista-espera`) - ABM parcial

Todas las rutas requieren un token valido. Cada usuario, incluido un admin, consulta y elimina solamente sus propias inscripciones. No hay modificacion ni reserva automatica del turno.

| Metodo | Ruta | Auth | Recibe | Devuelve / errores |
| --- | --- | --- | --- | --- |
| `POST` | `/api/lista-espera` | Token | JSON con `court_id`, `reservation_date`, `start_time` | `201` inscripcion creada · `400` datos invalidos · `401` · `404` cancha inexistente/inactiva · `409` turno libre o inscripcion duplicada · `500` fallo de persistencia |
| `GET` | `/api/lista-espera` | Token | Sin body ni filtros | `200` array de inscripciones propias, o `[]` · `401` · `500` fallo de persistencia |
| `DELETE` | `/api/lista-espera/:id` | Token | UUID de la inscripcion en la ruta; sin body | `204` sin cuerpo · `400` id invalido · `401` · `404` inscripcion inexistente o ajena · `500` fallo de persistencia |

Campos del alta:

| Campo | Tipo | Regla |
| --- | --- | --- |
| `court_id` | texto | Obligatorio. En MEM, por ejemplo `"1"`; en Supabase, UUID de una cancha existente y activa |
| `reservation_date` | texto | Obligatorio, fecha real en formato `YYYY-MM-DD` |
| `start_time` | texto | Obligatorio, hora de inicio `HH:MM`, entre `00:00` y `23:59`, sin segundos |

No enviar `user_id`, `id`, `created_at` ni otros campos: se rechazan. El usuario sale del token y el servidor genera el id y la fecha de alta. Un turno se identifica por cancha, fecha y hora de inicio exactas. Debe existir una reserva `active` o `confirmed` de ese turno; una reserva `cancelled` no lo ocupa.

Ejemplo con un turno **ya ocupado** en MEM:

```http
POST /api/lista-espera
Authorization: Bearer token-player
Content-Type: application/json

{ "court_id": "1", "reservation_date": "2027-01-20", "start_time": "18:00" }
```

Respuesta `201` (id y fecha de alta ilustrativos):

```json
{
  "court_id": "1",
  "reservation_date": "2027-01-20",
  "start_time": "18:00",
  "user_id": "u2",
  "id": "b55f1951-c388-4c42-9dfe-ec727b49f010",
  "created_at": "2027-01-10T12:00:00.000Z"
}
```

Ejemplo de consulta propia; responde `200` con un array que contiene el objeto anterior (o `[]` si no hay inscripciones):

```http
GET /api/lista-espera
Authorization: Bearer token-player
```

Ejemplo de baja; usar el id real devuelto por el alta. Responde `204` sin cuerpo:

```http
DELETE /api/lista-espera/b55f1951-c388-4c42-9dfe-ec727b49f010
Authorization: Bearer token-player
```

En Supabase los campos de hora se devuelven normalmente como `HH:MM:SS` y `user_id` es un UUID.

Si se intenta anotar otra vez, responde `409` con `error: "Ya estas en la lista de espera de ese turno"`. Si no hay reserva ocupando el turno:

```json
{ "url": "/api/lista-espera", "method": "POST", "error": "El turno esta libre; no corresponde anotarse en lista de espera" }
```

**Estado de integracion:** el servidor MEM arranca sin reservas de ejemplo. Hasta conectar el DAO de reservas de la tarea 2.2, el alta del ejemplo responde `409` en ese servidor vacio; los tests de lista de espera inyectan reservas ocupadas para probar el caso `201`. En Supabase la ocupacion se consulta en la tabla `reservations`.

### Reporte de reservas (`/api/reportes/reservas`)

| Metodo | Ruta | Auth | Recibe | Devuelve / errores |
| --- | --- | --- | --- | --- |
| `GET` | `/api/reportes/reservas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` | Admin | Dos fechas obligatorias en query; sin body | `200` archivo `.xlsx` · `400` fechas/parametros invalidos · `401` falta token o es invalido · `403` usuario no admin · `500` datos inconsistentes o fallo de persistencia/generacion |

`desde` y `hasta` deben ser fechas reales, sin hora, y `desde <= hasta`. Ambos extremos se incluyen segun `reservation_date`. Un solo dia es valido. Parametros adicionales o repetidos tambien se rechazan con `400`.

El Excel generado con ExcelJS contiene:

- **Reservas:** id, usuario, cancha id/nombre, fecha, inicio, fin, estado, horas de ocupacion, tarifa actual por hora e ingreso estimado de cada reserva del periodo.
- **Resumen:** por cada cancha con reservas en el periodo, cantidad total, canceladas, no canceladas, horas ocupadas e ingresos estimados; incluye una fila de totales.

La ocupacion suma la duracion de las reservas `active`, `confirmed` y `completed`; se expresa en reservas y horas, no en porcentaje de capacidad. Las canceladas se muestran en el detalle, pero suman cero horas e ingresos. Los ingresos son **estimaciones con la tarifa actual de `courts.price`**, redondeadas por reserva a centavos; no son pagos registrados ni precios historicos. Sin reservas, la respuesta sigue siendo un Excel valido con encabezados y totales cero. Los datos con horarios, duracion, tarifa o estado invalidos provocan un error en vez de generar importes incompletos.

Ejemplo de descarga desde la raiz del repositorio:

```bash
curl --fail-with-body \
  -H 'Authorization: Bearer token-admin' \
  'http://localhost:8080/api/reportes/reservas?desde=2027-01-01&hasta=2027-01-31' \
  --output reservas_2027-01.xlsx
```

En Supabase, reemplazar `token-admin` por el `access_token` de un usuario con perfil admin. El archivo contiene datos de usuarios: solo se entrega al administrador, con `Cache-Control: no-store`.

Headers de la respuesta `200`:

```http
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="reservas_2027-01-01_2027-01-31.xlsx"
Cache-Control: no-store
```

Ejemplo de error `400` para `?desde=2027-02-29&hasta=2027-03-01`:

```json
{ "url": "/api/reportes/reservas?desde=2027-02-29&hasta=2027-03-01", "method": "GET", "error": "Indicar desde y hasta validos (YYYY-MM-DD), con desde menor o igual a hasta" }
```

En Supabase se pagina la consulta para superar el limite habitual de 1000 filas. En MEM se usan reservas y canchas inyectadas en el adaptador; por defecto el reporte esta vacio hasta integrar los datos de reservas de la tarea 2.2.

## Aviso por mail al cancelar una reserva

El punto de entrada es el metodo interno `avisarReservaCancelada(reserva)` de [`servicio/listaEspera.js`](servicio/listaEspera.js); **no es un endpoint**. Recibe una reserva con `status: "cancelled"`, `court_id`, `reservation_date` y `start_time` (`HH:MM` o `HH:MM:00`). Verifica que el turno ya no este ocupado, busca los emails en los perfiles de los anotados en ese turno y manda un mensaje individual a cada uno. No expone las direcciones de los demas destinatarios ni crea una reserva automaticamente. Quienes ya se salieron no reciben el aviso; las inscripciones restantes no se eliminan por notificar.

Devuelve, por ejemplo:

```json
{ "enviados": 1, "fallidos": [{ "user_id": "u2", "error": "No se pudo enviar el aviso" }] }
```

Sin anotados devuelve `{ "enviados": 0, "fallidos": [] }`. Un email ausente/invalido o un fallo de envio queda en `fallidos` y se continua con los demas. Los detalles privados del error SMTP no se incluyen en ese resultado. Si la reserva no esta cancelada o el turno sigue ocupado, lanza un error con status `409`; si los datos del turno son invalidos, `400`. Los fallos de consulta o configuracion SMTP pueden lanzar una excepcion antes de los envios.

**Integracion pendiente con la tarea 2.2:** el servicio de reservas debe invocarlo **despues** de guardar la cancelacion y con la reserva devuelta por el DAO. En MEM debe compartir los datos/instancia de lista de espera que usa su router. Debe capturar los fallos del aviso, registrar o gestionar el resultado y responder la cancelacion confirmada sin revertirla. No se debe volver a ejecutar la cancelacion para reintentar mails; el aviso actual no incluye deduplicacion de reintentos.

El [diagrama de secuencia del aviso por mail](docs/secuencia-aviso-mail.md) muestra ese contrato de integracion y el tratamiento de fallos. La ruta y la respuesta HTTP concretas de cancelacion quedan a cargo de la tarea 2.2.

## Pruebas de lista de espera, mails y reportes

Desde `server/`, ejecutar `npm test`. Las suites `listaEspera.test.js`, `mails.test.js`, `reportes.test.js` y `daosReportesListaEspera.test.js` cubren altas, bajas, consulta propia, turno libre, duplicados, autorizacion, fallos de correo, fechas invalidas, descarga y lectura del Excel, calculos y paginacion. Usan MEM o bordes simulados de SMTP/PostgREST; no requieren credenciales ni modifican Supabase. La cancelacion completa desde la API y la entrega SMTP real necesitan validacion de integracion posterior.
