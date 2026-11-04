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

Los endpoints de cada recurso (canchas, reservas, etc.) se agregan a esta tabla a medida que se implementan.
