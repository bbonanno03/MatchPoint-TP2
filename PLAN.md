# TP Final - MatchPoint API: plan y reparto

Consigna: `tp_final.txt` (TP2 Trabajo Practico Final). Base: frontend de PNT2-MatchPoint, importado en `client/`.

## 1. Punto de partida

| Hallazgo | Impacto en el TP |
| --- | --- |
| El proyecto de PNT2 es solo frontend (Vue 3 + Pinia + Tailwind) | La materia evalua solo el servidor: el backend se construye desde cero en `server/` |
| El front habla directo con Supabase | La logica de negocio (politicas, cancelacion, limites) pasa al servidor |
| Tablas existentes: `courts`, `reservations`, `policies`, `reviews`, `profiles` | Son el modelo de dominio |
| Reglas ya pensadas: horario de apertura, max. reservas activas, horas minimas para cancelar | Material para servicios y tests "no felices" |
| Auth con Supabase Auth, roles `admin` / `player` | El servidor valida el token de Supabase en un middleware |

## 2. Decisiones tomadas

| Tema | Decision | Motivo |
| --- | --- | --- |
| Repositorio | Repo nuevo (`MatchPoint-TP2`) con `client/` y `server/` | El repo de PNT2 esta archivado (solo lectura) y es una entrega cerrada |
| Base de datos | Supabase (Postgres), la que ya tiene el proyecto | La consigna deja la BD a eleccion; no hay que instalar Mongo ni migrar datos |
| Persistencia | Factory + DAO por recurso: `MEM` (tests y desarrollo) y `SUPABASE` | Mismo patron de clases 07-11; cambiar de base es cambiar un DAO |
| Configuracion | `.env` + `config.js` (dotenv), `.env.example` versionado | Requisito "configuracion persistida en archivos"; las claves no se suben |
| Tests | mocha + `assert` de Node; los tests HTTP levantan el servidor en modo `MEM` y usan `fetch` | Herramientas vistas en la materia, sin dependencias extra |
| Documentacion | `server/README.md` con endpoints, ejemplos y errores | Requisito de documentacion |

## 3. Arquitectura del servidor (estilo de la clase 11)

```text
server/
  .env.example
  package.json
  index.js                      // lee config y arranca el servidor
  server.js                     // clase Server: Express, routers, middlewares
  config.js                     // variables de entorno
  router/<recurso>.js
  controlador/<recurso>.js
  servicio/<recurso>.js
  modelo/<Entidad>.js           // validacion con Joi
  modelo/DAO/CnxSupabase.js     // conexion unica a Supabase
  modelo/DAO/<recurso>/<recurso>Factory.js
  modelo/DAO/<recurso>/<recurso>Mem.js
  modelo/DAO/<recurso>/<recurso>Supabase.js
  middlewares/                  // auth (token + rol admin), errores, 404
  test/
  README.md
```

## 4. Reparto de tareas

Cada integrante tiene: un recurso con CRUD, un caso de uso complejo, sus tests (felices + al menos uno no feliz), su documentacion y su diagrama de secuencia. El Integrante 1 arranca primero con la base, que desbloquea al resto.

### Integrante 1 - Bruno Bonanno (primero)

| # | Tarea | Desbloquea a | Estado |
| --- | --- | --- | --- |
| 1.1 | Esqueleto `server/`: Express, `config.js`, `.env.example`, ruta `/api/health` | 2, 3 | Hecho |
| 1.2 | Middlewares de errores y 404 | 2, 3 | Hecho |
| 1.3 | Conexion Supabase + Factory + DAO de canchas (MEM y SUPABASE) | 2, 3 | Hecho |
| 1.4 | Middleware de auth: valida token de Supabase y rol `admin` | 2, 3 | Hecho |
| 1.5 | Setup de tests (mocha) | 2, 3 | Hecho |
| 1.6 | Recurso **canchas** CRUD (`/api/canchas`) con Joi + tests | 2 (disponibilidad) | Pendiente |
| 1.7 | **CU complejo 1 - Importador de canchas**: `POST /api/canchas/importar` recibe CSV/JSON, valida fila por fila, da de alta las validas y devuelve `{ importadas, rechazadas: [{ fila, motivo }] }` | - | Pendiente |
| 1.8 | Docs de canchas + importador, diagrama de clases general, secuencia del importador | - | Pendiente |

### Integrante 2 - Lucas Pisati

| # | Tarea |
| --- | --- |
| 2.1 | Recurso **politicas** (`GET /api/politicas`, `PUT` solo admin) |
| 2.2 | Recurso **reservas**: crear (horario de apertura, max. activas, turnos superpuestos), cancelar (horas minimas), listar propias / todas (admin) |
| 2.3 | **CU complejo 2 - Disponibilidad**: `GET /api/canchas/:id/disponibilidad?fecha=YYYY-MM-DD` cruza politicas + reservas y devuelve los turnos libres |
| 2.4 | Tests de reservas: felices + no felices (fuera de horario, limite superado, cancelacion tardia, turno ocupado) |
| 2.5 | Docs de politicas/reservas/disponibilidad + secuencia de disponibilidad |

### Integrante 3 - Ezequiel Reynoso

| # | Tarea |
| --- | --- |
| 3.1 | Recurso **resenas** (calificar cancha 1-5, listar por cancha, una por reserva finalizada) |
| 3.2 | Recurso **usuarios/perfil** (ver perfil, listar y cambiar rol - admin) |
| 3.3 | **CU complejo 3 - Estadisticas**: `GET /api/estadisticas` con ocupacion por cancha, ingresos por mes y por deporte, horario pico, ranking de canchas por calificacion |
| 3.4 | **Exportador**: `GET /api/reservas/exportar?desde&hasta` devuelve CSV |
| 3.5 | Tests de estadisticas/exportador/resenas + docs + secuencia de estadisticas |

### Compartido (al final)

- Conectar el front a la API (opcional: no se evalua en esta materia, suma para la demo).
- Ensayo de la presentacion oral semanal.

## 5. Cronograma sugerido (entregas semanales)

| Semana | Incremento visible |
| --- | --- |
| 1 | 1.1 a 1.5: el servidor levanta, config, auth, tests. 2 y 3 crean sus ramas |
| 2 | 1.6, 2.1-2.2, 3.1-3.2 (CRUDs con tests) |
| 3 | 1.7, 2.3, 3.3-3.4 (casos de uso complejos) |
| 4 | Docs, UML, ajustes, integracion con el front |

## 6. Como sumar un recurso nuevo (guia para 2 y 3)

1. Copiar la carpeta `modelo/DAO/canchas/` como modelo: `<recurso>Factory.js`, `<recurso>Mem.js`, `<recurso>Supabase.js`.
2. Crear `servicio/`, `controlador/` y `router/` del recurso siguiendo los de canchas.
3. Registrar el router en `server.js`.
4. Proteger rutas con `autenticar` y, si son de admin, con `soloAdmin`.
5. Escribir los tests en `test/` usando `MODO_PERSISTENCIA=MEM`.

## 7. Forma de trabajo en Git

- Una rama por tarea (`feature/2.2-reservas`, ...), PR a `main`, revision de un companero.
- Commits chicos y descriptivos, uno por paso logico.
- `.env` nunca se sube; solo `.env.example`. La clave de Supabase va solo en `.env`.
