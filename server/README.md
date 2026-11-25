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
| `MODO_CLIMA` | `OPENMETEO` (API real, sin clave) o `MEM` (clima fijo para probar sin internet) | `OPENMETEO` |

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
| [`003_bucket_imagenes_canchas.sql`](sql/003_bucket_imagenes_canchas.sql) | Crea el bucket publico `canchas` de Storage (JPG, PNG o WEBP, hasta 2 MB) para las fotos de las canchas |
| [`004_reservas_sin_superposiciones.sql`](sql/004_reservas_sin_superposiciones.sql) | Impide reservas activas/confirmadas superpuestas por cancha con una exclusion GiST y obliga a crear/cancelar mediante la API |

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
| `GET` | `/api/canchas` | No | Lista las canchas. Filtros opcionales: `?techada=true\|false`, `?deporte=Pádel|Tenis|Fútbol`\|Tenis` | `200` lista · `400` filtro invalido |
| `GET` | `/api/canchas/:id` | No | Devuelve una cancha | `200` · `404` |
| `POST` | `/api/canchas` | Admin | Crea una cancha | `201` cancha creada · `400` · `401` · `403` |
| `PUT` | `/api/canchas/:id` | Admin | Modifica los campos enviados | `200` · `400` · `401` · `403` · `404` |
| `DELETE` | `/api/canchas/:id` | Admin | Borra la cancha | `200` cancha borrada · `401` · `403` · `404` · `409` si tiene reservas, incluso canceladas (MEM y Supabase) |

Campos de una cancha:

| Campo | Tipo | Alta | Regla |
| --- | --- | --- | --- |
| `name` | texto | obligatorio | 3 a 50 caracteres |
| `sport` | texto | obligatorio | `Pádel` o ``?deporte=Pádel|Tenis|Fútbol` |
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

### Politicas (`/api/politicas`)

Reglas de reserva del club. Hay un unico juego de politicas para todo el sistema y las usa el servicio de reservas.

| Metodo | Ruta | Auth | Descripcion | Respuestas |
| --- | --- | --- | --- | --- |
| `GET` | `/api/politicas` | No | Devuelve las politicas vigentes | `200` |
| `PUT` | `/api/politicas` | Admin | Modifica uno o mas campos; los no enviados se mantienen | `200` · `400` · `401` · `403` |

Campos de las politicas:

| Campo | Tipo | Regla |
| --- | --- | --- |
| `max_active_reservations` | entero | maximo de reservas activas por usuario, 1 o mas |
| `cancellation_hours` | entero | horas minimas de anticipacion para cancelar, 0 o mas |
| `opening_time` | texto | horario de apertura, formato `HH:MM` |
| `closing_time` | texto | horario de cierre, formato `HH:MM`, posterior a la apertura |

Ejemplo de consulta:

```http
GET /api/politicas
```

Respuesta `200`:

```json
{ "id": "1", "max_active_reservations": 5, "cancellation_hours": 24, "opening_time": "08:00", "closing_time": "23:00", "updated_at": "2026-11-16T20:00:00.000Z" }
```

Ejemplo de modificacion:

```http
PUT /api/politicas
Authorization: Bearer token-admin
Content-Type: application/json

{ "max_active_reservations": 3 }
```

Respuesta `200`: las politicas completas ya actualizadas.

Errores:

| Codigo | Cuando |
| --- | --- |
| `400` | Body vacio, un valor invalido (ej. `max_active_reservations: 0` u hora `"25:00"`) o la apertura no es anterior al cierre |
| `401` | Falta el token o es invalido |
| `403` | El usuario no es administrador |

### Reservas (`/api/reservas`)

Un usuario logueado reserva un turno de 1 hora en una cancha. El servicio valida los datos y aplica las politicas del club antes de guardar.

| Metodo | Ruta | Auth | Descripcion | Respuestas |
| --- | --- | --- | --- | --- |
| `GET` | `/api/reservas` | Si | El jugador ve sus reservas; el admin ve todas | `200` · `401` |
| `POST` | `/api/reservas` | Si | Crea una reserva a nombre del usuario del token | `201` · `400` · `401` · `404` · `409` |
| `DELETE` | `/api/reservas/:id` | Si | Cancela una reserva propia (el admin, cualquiera) y avisa a la lista de espera | `200` · `401` · `404` · `409` |

Campos para crear una reserva (`user_id`, `end_time` y `status` los pone el servidor):

| Campo | Tipo | Regla |
| --- | --- | --- |
| `court_id` | texto | id de una cancha existente y activa |
| `reservation_date` | texto | fecha real en formato `YYYY-MM-DD` (rechaza fechas como `2027-02-30`) |
| `start_time` | texto | formato `HH:MM`; el turno termina 1 hora despues |

Reglas que se validan al reservar:

1. El turno no puede estar en el pasado.
2. La cancha tiene que existir y estar activa.
3. El turno tiene que estar dentro del horario de apertura y cierre de las politicas.
4. El usuario no puede pasar el maximo de reservas activas de las politicas.
5. El turno no puede estar ocupado por otra reserva activa.

Al cancelar se pide la anticipacion minima de las politicas (`cancellation_hours`). Si la cancelacion se hace, se avisa por mail a la lista de espera; si el mail falla, la reserva igual queda cancelada.

Ejemplo de alta:

```http
POST /api/reservas
Authorization: Bearer token-player
Content-Type: application/json

{ "court_id": "1", "reservation_date": "2026-12-01", "start_time": "19:00" }
```

Respuesta `201`:

```json
{ "id": "1", "court_id": "1", "user_id": "u2", "reservation_date": "2026-12-01", "start_time": "19:00", "end_time": "20:00", "status": "active", "created_at": "2026-11-18T20:00:00.000Z" }
```

Errores:

| Codigo | Cuando |
| --- | --- |
| `400` | Falta un campo, formato invalido, fecha inexistente, turno en el pasado o fuera del horario del club |
| `401` | Falta el token o es invalido |
| `404` | Cancha inexistente o inactiva; al cancelar, reserva inexistente o de otro usuario |
| `409` | Turno ocupado, maximo de reservas activas, reserva ya cancelada o cancelacion sin la anticipacion minima |

### Clima (`/api/canchas/:id/clima`)

Antes de reservar, cualquiera puede consultar el pronostico para una cancha en un dia y hora. Si la cancha es techada el clima no importa; si es al aire libre se pide el pronostico a [Open-Meteo](https://open-meteo.com/) con la latitud y longitud de la cancha y se devuelve una recomendacion.

| Metodo | Ruta | Auth | Descripcion | Respuestas |
| --- | --- | --- | --- | --- |
| `GET` | `/api/canchas/:id/clima?fecha=YYYY-MM-DD&hora=HH:MM` | No | Pronostico y recomendacion para ese turno | `200` · `400` · `404` · `409` · `502` |

- `fecha`: fecha real entre hoy y dentro de 16 dias (es lo que pronostica Open-Meteo).
- `hora`: formato `HH:MM`; se usa el dato de esa hora en punto (19:30 usa el de las 19:00).
- `MODO_CLIMA=OPENMETEO` consulta la API real (no necesita clave). `MODO_CLIMA=MEM` devuelve siempre 22 °C, 10 % de lluvia y 12 km/h de viento, para probar sin internet. Es independiente de `MODO_PERSISTENCIA`.

Recomendaciones (se aplica la primera que corresponda):

| Condicion | Recomendacion |
| --- | --- |
| Probabilidad de lluvia de 50 % o mas | Probable lluvia: mejor reservar una cancha techada |
| Viento de 30 km/h o mas | Mucho viento: puede complicar el juego |
| 32 °C o mas | Mucho calor: lleva agua y protector solar |
| 8 °C o menos | Hace frio: veni abrigado |
| Si no | Buen dia para jugar |

Ejemplo:

```http
GET /api/canchas/2/clima?fecha=2026-11-20&hora=19:00
```

Respuesta `200` (cancha al aire libre):

```json
{ "cancha": "Cancha Tenis 1", "techada": false, "fecha": "2026-11-20", "hora": "19:00", "temperatura": 22, "probabilidadLluvia": 10, "viento": 12, "recomendacion": "Buen dia para jugar" }
```

Respuesta `200` (cancha techada, no se consulta Open-Meteo):

```json
{ "cancha": "Cancha Pádel 1", "techada": true, "fecha": "2026-11-20", "hora": "19:00", "recomendacion": "La cancha es techada: el clima no afecta el partido" }
```

Errores:

| Codigo | Cuando |
| --- | --- |
| `400` | Falta `fecha` u `hora`, formato invalido, fecha inexistente, fecha pasada o a mas de 16 dias |
| `404` | La cancha no existe |
| `409` | La cancha es al aire libre y no tiene latitud y longitud cargadas |
| `502` | Open-Meteo no responde, responde con error o no tiene dato para esa hora |

El diagrama de secuencia esta en [`docs/secuencia-clima.md`](docs/secuencia-clima.md).

### Imagen de una cancha (`/api/canchas/:id/imagen`)

Sube la foto de una cancha y guarda su URL en `image_url`. Solo administradores.

| Metodo | Ruta | Auth | Recibe | Devuelve |
| --- | --- | --- | --- | --- |
| `POST` | `/api/canchas/:id/imagen` | Admin | `multipart/form-data` con el archivo en el campo `imagen` | `201` la cancha con `image_url` actualizada |

- Formatos aceptados: JPG, PNG o WEBP. Se valida el **contenido real** del archivo (sus primeros bytes), no solo la extension.
- Tamano maximo: 2 MB.
- Modo `SUPABASE`: el archivo se sube al bucket `canchas` de Supabase Storage (`sql/003_bucket_imagenes_canchas.sql`) y `image_url` es su URL publica.
- Modo `MEM`: el archivo queda en memoria y `image_url` es de ejemplo (`memoria://canchas/...`).
- `image_url` no se puede cambiar con `PUT /api/canchas/:id`; solo con este endpoint.

Ejemplo con curl:

```bash
curl -X POST http://localhost:8080/api/canchas/2/imagen -H "Authorization: Bearer token-admin" -F "imagen=@foto.png"
```

Respuesta `201`:

```json
{ "id": "2", "name": "Cancha Tenis 1", "sport": "Tenis", "price": 15000, "image_url": "memoria://canchas/cancha-2-1795151433217.png", "...": "resto de los campos de la cancha" }
```

| Error | Cuando |
| --- | --- |
| `400` | No vino el archivo, o vino en un campo que no se llama `imagen` |
| `401` / `403` | Sin token, o el usuario no es admin |
| `404` | La cancha no existe |
| `413` | La imagen supera los 2 MB |
| `415` | El archivo no es JPG, PNG o WEBP (aunque tenga esa extension) |
| `500` | Fallo la subida a Supabase Storage |

El diagrama de secuencia esta en [`docs/secuencia-subida-imagen.md`](docs/secuencia-subida-imagen.md) y el diagrama de clases general en [`docs/diagrama-clases.md`](docs/diagrama-clases.md).

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

Ejemplo en MEM: primero crear una reserva por la API con el administrador y despues anotar al jugador en el mismo turno. Elegir una fecha futura que respete las politicas del club:

```http
POST /api/reservas
Authorization: Bearer token-admin
Content-Type: application/json

{ "court_id": "1", "reservation_date": "2027-01-20", "start_time": "18:00" }
```

Con la reserva creada (`201`), anotar al jugador:

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

**Integracion:** el servidor MEM arranca sin reservas de ejemplo y comparte los datos entre routers mediante [`servicio/crearServicios.js`](servicio/crearServicios.js). Las reservas creadas por `POST /api/reservas` son visibles para la lista de espera y el reporte. El usuario del aviso se resuelve desde los perfiles de prueba de AuthMem. En Supabase se consultan las tablas `reservations` y `profiles`. Los servidores MEM diferentes no comparten reservas, canchas ni inscripciones.

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

En Supabase se pagina la consulta para superar el limite habitual de 1000 filas. En MEM el reporte consulta los DAOs compartidos en cada descarga: refleja altas, cancelaciones y cambios en la tarifa actual de canchas. Esta vacio solamente si no hay reservas para el periodo. No se permite borrar una cancha con historial de reservas, para conservar los datos necesarios del reporte.

## Aviso por mail al cancelar una reserva

El punto de entrada es el metodo interno `avisarReservaCancelada(reserva)` de [`servicio/listaEspera.js`](servicio/listaEspera.js); **no es un endpoint**. Recibe una reserva con `status: "cancelled"`, `court_id`, `reservation_date` y `start_time` (`HH:MM` o `HH:MM:00`). Verifica que el turno ya no este ocupado, busca los emails en los perfiles de los anotados en ese turno y manda un mensaje individual a cada uno. No expone las direcciones de los demas destinatarios ni crea una reserva automaticamente. Quienes ya se salieron no reciben el aviso; las inscripciones restantes no se eliminan por notificar.

Devuelve, por ejemplo:

```json
{ "enviados": 1, "fallidos": [{ "user_id": "u2", "error": "No se pudo enviar el aviso" }] }
```

Sin anotados devuelve `{ "enviados": 0, "fallidos": [] }`. Un email ausente/invalido o un fallo de envio queda en `fallidos` y se continua con los demas. Los detalles privados del error SMTP no se incluyen en ese resultado. Si la reserva no esta cancelada o el turno sigue ocupado, lanza un error con status `409`; si los datos del turno son invalidos, `400`. Los fallos de consulta o configuracion SMTP pueden lanzar una excepcion antes de los envios.

**Integracion con reservas:** `DELETE /api/reservas/:id` requiere token del duenio o admin. El servicio guarda `cancelled` y despues invoca el aviso sobre la misma lista de espera que usa el router. Devuelve `200` con la reserva cancelada aunque falle un envio o la configuracion SMTP. Los fallos por destinatario se registran por cantidad, sin direcciones ni errores privados del proveedor; las excepciones anteriores al envio generan un mensaje generico. Un segundo intento de cancelar la misma reserva devuelve `409` sin repetir los mails. El metodo interno de aviso, si se invoca directamente, no deduplica reintentos.

El [diagrama de secuencia del aviso por mail](docs/secuencia-aviso-mail.md) muestra la integracion y el tratamiento de fallos. Para observar el correo MEM en una prueba, `Server` admite `new Server(0, { correo, registrarAviso })`: inyectar un `MailMem` y una funcion que reciba `{ enviados, fallidos }`. No hay un endpoint publico que exponga los mails.

El frontend Vue crea, consulta y cancela reservas mediante esta API con el token real de Supabase. Ante `409` con `code: "TURNO_OCUPADO"`, ofrece anotarse en espera para la cancha, fecha y hora elegidas. **Mis reservas > Mi lista de espera** permite consultar las propias y salirse. Un `409` por limite de reservas no ofrece la espera. El aviso no asigna el turno automaticamente: quien primero complete una nueva reserva se lo queda. Las inscripciones permanecen hasta que el usuario se sale.

## Pruebas

| Comando | Que corre |
| --- | --- |
| `npm test` | Todos los tests (unitarios y end-to-end) |
| `npm run test:e2e` | Solo el end-to-end |

### Test end-to-end (`test/e2e.test.js`)

Levanta el servidor completo, igual que `index.js` (todas las rutas y middlewares), en modo `MEM`, y le hace pedidos HTTP reales como lo haria el front. Prueba los dos endpoints documentados arriba:

| Endpoint | Caso feliz | Caso no feliz |
| --- | --- | --- |
| `POST /api/canchas` | Un admin crea una cancha: `201` con el JSON guardado, y despues se puede consultar con `GET /api/canchas/:id` | Sin el campo `sport`: `400` con el error en JSON |
| `GET /api/lista-espera` | Un jugador logueado consulta su lista: `200` con `[]` | Sin token: `401` |

## Pruebas de lista de espera, mails y reportes

Desde `server/`, ejecutar `npm test`. Las suites `listaEspera.test.js`, `mails.test.js`, `reportes.test.js` y `daosReportesListaEspera.test.js` cubren altas, bajas, consulta propia, turno libre, duplicados, autorizacion, fallos de correo, fechas invalidas, descarga y lectura del Excel, calculos y paginacion. `integracionReservas.test.js` prueba el circuito completo por HTTP, los emails MEM correctos, fallos sin revertir la cancelacion, canchas compartidas, aislamiento entre servidores y el Excel actualizado. Usan MEM o bordes simulados de SMTP/PostgREST; no requieren credenciales ni modifican Supabase. Queda pendiente validar la entrega SMTP y la persistencia contra Supabase reales.


## Concurrencia y activacion del circuito web

Antes de habilitar esta version contra Supabase, ejecutar `sql/004_reservas_sin_superposiciones.sql` con permisos de propietario en SQL Editor. Requiere las tablas base y la extension `btree_gist`; no modifica ni elimina reservas existentes. Si hay datos superpuestos o duraciones invalidas, falla toda la transaccion: revisar y resolver esos datos antes de reintentar. Para localizar superposiciones existentes:

```sql
select a.id, b.id, a.court_id, a.reservation_date
from public.reservations a join public.reservations b
  on a.id < b.id and a.court_id = b.court_id
  and a.reservation_date = b.reservation_date
where a.status in ('active', 'confirmed') and b.status in ('active', 'confirmed')
  and a.start_time < b.end_time and b.start_time < a.end_time;
```

La exclusion opera en la base incluso con varias instancias de la API: dos altas simultaneas para intervalos que se pisan no pueden confirmarse ambas. Los intervalos son semiabiertos: 18–19 y 19–20 son compatibles. Las canceladas no bloquean. El DAO convierte `23P01` a HTTP `409` con `code: "TURNO_OCUPADO"`; la validacion previa del servicio devuelve el mismo codigo. En MEM la comprobacion y escritura son sincronicas en un mismo DAO. `GET /api/reservas` incluye `courts` con los datos de la cancha o `null` si no existe.

El script tambien revoca escrituras directas de `anon` y `authenticated` sobre `reservations`. Coordinar el despliegue de API y frontend: los clientes anteriores que escribian directo dejan de poder reservar/cancelar. La API usa `SUPABASE_KEY` de servidor (`service_role`); jamas exponerla en `VITE_*`. Se conserva la lectura con sus permisos/RLS existentes. El backend debe apuntar al mismo proyecto de Supabase que la web y recibir `/api` mediante el proxy documentado en `client/README.md`.

Para correos reales configurar `MODO_MAIL=SMTP`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `MAIL_FROM`, y permitir salida al proveedor. Con `MEM` los avisos solo quedan en el array del adaptador y no llegan a una casilla. La cancelacion persiste antes del envio; una actualizacion condicional evita repetir el aviso ante dos cancelaciones simultaneas. No hay cola persistente ni reintentos automaticos si el proceso se interrumpe o falla SMTP; los fallos quedan registrados sin revertir la cancelacion.

`npm test` incluye `reservasConcurrencia.test.js`: altas simultaneas, solapamiento parcial, confirmed, contiguos, traduccion de error PostgreSQL y dos usuarios por HTTP con espera, doble cancelacion, un solo mail MEM y nueva reserva. Prueba optativa con PostgreSQL real y descartable (requiere Python 3, Docker local y la imagen `postgres:17-alpine`):

```bash
# Desde server/. No conecta con Supabase ni usa credenciales.
python3 scripts/test-concurrencia-postgres.py
```

Comprueba el SQL dos veces, permisos, duracion positiva y dos transacciones concurrentes. Elimina su propio contenedor al terminar.
