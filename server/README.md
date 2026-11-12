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

## Base de datos (Supabase)

Los cambios a las tablas estan en `sql/`, numerados. Se ejecutan en orden desde **Supabase > SQL Editor** (se pueden correr mas de una vez):

| Archivo | Que hace |
| --- | --- |
| `002_canchas_techada_ubicacion.sql` | Agrega a `courts` los campos `covered` (techada), `latitude` y `longitude` |

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

Todos los errores responden JSON:

```json
{ "url": "/api/...", "method": "GET", "error": "mensaje" }
```

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
