# TP Final - MatchPoint: guía para el equipo

Buenas! Ya arranqué el TP final. Lo armamos sobre MatchPoint, el TP de PNT2: le hacemos el backend en Node, que es lo único que evalúa la materia.

**Repo:** https://github.com/bbonanno03/MatchPoint-TP2
Pásenme su usuario de GitHub así los agrego como colaboradores.

---

## 1. Qué pide la consigna y cómo lo cubrimos

| Requisito | Cómo lo cubrimos |
| --- | --- |
| Arquitectura Cliente/Servidor, servidor en Node | `client/` (Vue, ya hecho en PNT2) + `server/` (Express) |
| Persistencia en base de datos, modularizada | Supabase, con router → controlador → servicio → Factory → DAO (como en la clase 11) |
| Configuración guardada en archivos | `.env` + `config.js` |
| Al menos 2 casos de uso complejos | Tenemos 3, uno por integrante: importador, disponibilidad y estadísticas + exportador |
| Tests: casos felices + al menos un no feliz | mocha + `assert` |
| Documentación de los endpoints | `server/README.md` |
| UML | Diagrama de clases general + un diagrama de secuencia por caso complejo |
| Presentación semanal | Cada semana mostramos algo funcionando y testeado |

## 2. Cómo está armado

- `client/`: el front de PNT2, tal cual estaba.
- `server/`: la API en Express.
- La base es Supabase, pero con `MODO_PERSISTENCIA=MEM` todo anda en memoria. **Para desarrollar y testear no necesitan Supabase.**

```text
server/
  index.js, server.js, config.js, .env.example
  router/  controlador/  servicio/        <- uno por recurso
  modelo/DAO/<recurso>/                   <- Factory + DAO en memoria + DAO de Supabase
  middlewares/                            <- auth, errores y 404
  test/
  README.md                               <- documentación de la API
```

## 3. Para levantarlo

```bash
git clone https://github.com/bbonanno03/MatchPoint-TP2.git
cd MatchPoint-TP2/server
npm install
cp .env.example .env
npm test
npm run dev
```

Prueba rápida: abrir http://localhost:8080/api/health → `{ "estado": "ok" }`.

---

## 4. Reparto de tareas

Cada uno tiene un recurso con su CRUD, un caso de uso complejo, sus tests, su documentación y su diagrama de secuencia.

### Integrante 1 - Bruno

| # | Tarea | Estado |
| --- | --- | --- |
| 1.1 | Esqueleto del servidor: Express, `config.js`, `.env.example`, ruta `/api/health` | ✅ Hecho |
| 1.2 | Middlewares de ruta no encontrada (404) y de manejo de errores (JSON mal formado, errores no manejados) | ✅ Hecho |
| 1.3 | Conexión a Supabase + Factory + DAO de canchas (en memoria y en Supabase) | ✅ Hecho |
| 1.4 | Middleware de auth: `autenticar` (valida el token) y `soloAdmin` (valida el rol) | ✅ Hecho |
| 1.5 | Tests con mocha: servidor, auth y DAO de canchas (13 tests pasando) + README de la API | ✅ Hecho |
| 1.6 | Recurso **canchas**: CRUD `/api/canchas` con validación Joi + tests | ⏳ Pendiente |
| 1.7 | **Caso complejo 1 - Importador de canchas**: `POST /api/canchas/importar` recibe CSV/JSON, valida fila por fila, da de alta las válidas y devuelve un reporte con las rechazadas y el motivo | ⏳ Pendiente |
| 1.8 | Docs de canchas e importador + diagrama de clases general + diagrama de secuencia del importador | ⏳ Pendiente |

### Integrante 2 - [Nombre]

| # | Tarea | Estado |
| --- | --- | --- |
| 2.1 | Recurso **políticas**: `GET /api/politicas` y `PUT /api/politicas` (solo admin) | ⏳ Pendiente |
| 2.2 | Recurso **reservas**: crear (respetando el horario de apertura, el máximo de reservas activas y sin turnos superpuestos), cancelar (con las horas mínimas de anticipación), listar las propias y todas (admin) | ⏳ Pendiente |
| 2.3 | **Caso complejo 2 - Disponibilidad**: `GET /api/canchas/:id/disponibilidad?fecha=YYYY-MM-DD`, que cruza políticas y reservas y devuelve los turnos libres | ⏳ Pendiente |
| 2.4 | Tests de reservas: felices + no felices (fuera de horario, límite superado, cancelación tardía, turno ocupado) | ⏳ Pendiente |
| 2.5 | Docs de políticas, reservas y disponibilidad + diagrama de secuencia de disponibilidad | ⏳ Pendiente |

### Integrante 3 - [Nombre]

| # | Tarea | Estado |
| --- | --- | --- |
| 3.1 | Recurso **reseñas**: calificar una cancha de 1 a 5, listar por cancha, una reseña por reserva finalizada | ⏳ Pendiente |
| 3.2 | Recurso **usuarios/perfil**: ver el propio perfil; listar usuarios y cambiar el rol (admin) | ⏳ Pendiente |
| 3.3 | **Caso complejo 3 - Estadísticas**: `GET /api/estadisticas` con ocupación por cancha, ingresos por mes y por deporte, horario pico y ranking de canchas por calificación | ⏳ Pendiente |
| 3.4 | **Exportador**: `GET /api/reservas/exportar?desde=...&hasta=...` devuelve un CSV | ⏳ Pendiente |
| 3.5 | Tests de reseñas, estadísticas y exportador + docs + diagrama de secuencia de estadísticas | ⏳ Pendiente |

### Entre todos (al final)

| Tarea | Estado |
| --- | --- |
| Conectar el front a la API (no se evalúa, pero suma para la demo) | ⏳ Pendiente |
| Ensayar la presentación oral de cada semana | ⏳ Pendiente |

## 5. Cronograma

| Semana | Qué mostramos |
| --- | --- |
| 1 | Servidor andando: config, auth y tests (✅ listo) |
| 2 | CRUDs con tests: canchas (1), políticas y reservas (2), reseñas y usuarios (3) |
| 3 | Casos complejos: importador (1), disponibilidad (2), estadísticas y exportador (3) |
| 4 | Documentación, UML, ajustes e integración con el front |

---

## 6. Cómo agregar su recurso

1. Copiar `server/modelo/DAO/canchas/` como modelo: `<recurso>Factory.js`, `<recurso>Mem.js` y `<recurso>Supabase.js`.
2. Crear `servicio/`, `controlador/` y `router/` del recurso, siguiendo los de canchas (en cuanto esté la tarea 1.6).
3. Registrar el router en `server.js`.
4. Proteger las rutas con `auth.autenticar` y, si son de admin, también con `auth.soloAdmin`.
5. Escribir los tests en `test/`. En modo MEM se prueban las rutas protegidas con los tokens `token-admin` y `token-player`.
6. Agregar los endpoints a `server/README.md`.

## 7. Cómo trabajamos en Git

- **Una rama por tarea**, por ejemplo `feature/2.2-reservas`, y PR a `main` para que otro lo revise.
- **Commits chicos y seguidos.** El profe quiere ver que avanzamos de a poco, no un commit gigante al final.
- Antes de abrir el PR: `npm test` tiene que pasar.
- **El `.env` no se sube nunca.** Si necesitan las claves de Supabase, se las paso por privado.
- Si cambian algo de la base (`config.js`, `server.js`, middlewares), avisen en el grupo.

## 8. Esta semana

Cada uno arranca con su CRUD y sus tests, en su rama. La idea es que cada semana mostremos algo funcionando.
