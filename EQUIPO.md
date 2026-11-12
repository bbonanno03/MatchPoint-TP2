# TP Final - MatchPoint: guía para el equipo

Armamos el TP sobre MatchPoint, el TP de PNT2: le hacemos el backend en Node, que es lo único que evalúa la materia.

**Repo:** https://github.com/bbonanno03/MatchPoint-TP2

> Reparto actualizado el 05/11 con lo que pidió el profe: al menos 2 ABM (uno completo y otro parcial) y casos de complejidad media/alta del estilo de los que propuso (clima, mails, reporte descargable, subida de imágenes).

---

## 1. Qué pide la consigna y el profe, y cómo lo cubrimos

| Pedido | Cómo lo cubrimos |
| --- | --- |
| Cliente/Servidor, servidor en Node | `client/` (Vue, ya hecho en PNT2) + `server/` (Express) |
| Persistencia en base de datos, modularizada | Supabase, con router → controlador → servicio → Factory → DAO (como en la clase 11) |
| Configuración guardada en archivos | `.env` + `config.js` |
| **ABM: al menos 2, uno completo y otro parcial** | **Canchas** completo (Bruno) · **Reservas** parcial (Lucas) · **Lista de espera** parcial (Ezequiel) |
| **Casos de complejidad media/alta: al menos 2** | Tenemos 4: **subida de imágenes** (Bruno), **clima** (Lucas), **mails de aviso** y **reporte Excel** (Ezequiel) |
| Tests: casos felices + al menos un no feliz | mocha + `assert` |
| Documentación de los endpoints | `server/README.md` |
| UML | Diagrama de clases general + un diagrama de secuencia por caso complejo |
| Presentación semanal | Cada semana mostramos algo funcionando y testeado |

## 2. Cómo está armado

- `client/`: el front de PNT2, tal cual estaba.
- `server/`: la API en Express.
- La base es Supabase, pero con `MODO_PERSISTENCIA=MEM` todo anda en memoria. **Para desarrollar y testear no necesitan Supabase.**
- Lo que depende de un servicio externo (clima, mails, imágenes) también va con Factory: una versión **MEM** (falsa, para tests, sin internet) y una **real**. Así los tests no dependen de que la API externa ande.

```text
server/
  index.js, server.js, config.js, .env.example
  router/  controlador/  servicio/        <- uno por recurso
  modelo/DAO/<recurso>/                   <- Factory + DAO en memoria + DAO de Supabase
  middlewares/                            <- auth, errores y 404
  sql/                                    <- cambios a las tablas de Supabase
  test/
  README.md                               <- documentación de la API
```

## 3. Para levantarlo

**Servidor:**

```bash
git clone https://github.com/bbonanno03/MatchPoint-TP2.git
cd MatchPoint-TP2/server
npm install
cp .env.example .env
npm test
npm run dev
```

Prueba rápida: abrir http://localhost:8080/api/health → `{ "estado": "ok" }`.

**Front:** en `client/` crear un `.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (se los paso por privado), después `npm install` y `npm run dev`, y abrir http://localhost:5173.

---

## 4. Reparto de tareas

Cada uno tiene un ABM, al menos un caso complejo, sus tests, su documentación y el diagrama de secuencia de su caso complejo.

### Integrante 1 - Bruno Bonanno

| # | Tarea | Estado |
| --- | --- | --- |
| 1.1 | Esqueleto del servidor: Express, `config.js`, `.env.example`, ruta `/api/health` | ✅ Hecho |
| 1.2 | Middlewares de ruta no encontrada (404) y de manejo de errores (JSON mal formado, errores no manejados) | ✅ Hecho |
| 1.3 | Conexión a Supabase + Factory + DAO de canchas (en memoria y en Supabase) | ✅ Hecho |
| 1.4 | Middleware de auth: `autenticar` (valida el token) y `soloAdmin` (valida el rol) | ✅ Hecho |
| 1.5 | Tests con mocha: servidor, auth y DAO de canchas (13 tests pasando) + README de la API | ✅ Hecho |
| 1.6 | Agregar a las canchas los campos **techada** (sí/no), **latitud** y **longitud** (SQL en Supabase + DAOs). **Va primero: lo necesita el clima de Lucas** | 🔶 Código hecho; falta correr el SQL en Supabase |
| 1.7 | **ABM completo de canchas**: alta, baja y modificación (solo admin) y consulta (`GET /api/canchas`, `GET /api/canchas/:id`), con filtro `?techada=true\|false&deporte=...` (el "checkbox" que pidió el profe) + validación Joi + tests | ✅ Hecho (31 tests) |
| 1.8 | **Caso complejo - Subida de imágenes**: `POST /api/canchas/:id/imagen` recibe la foto, valida tipo (jpg/png/webp) y tamaño, la sube a Supabase Storage y guarda la URL en la cancha. No felices: archivo que no es imagen, muy pesado, cancha inexistente | ⏳ Pendiente |
| 1.9 | Docs de canchas e imágenes + diagrama de clases general + diagrama de secuencia de la subida de imágenes | ⏳ Pendiente |

### Integrante 2 - Lucas Pisati

| # | Tarea | Estado |
| --- | --- | --- |
| 2.1 | Recurso **políticas**: `GET /api/politicas` y `PUT /api/politicas` (solo admin). Son las reglas que usan las reservas | ⏳ Pendiente |
| 2.2 | **ABM parcial de reservas**: alta (respetando horario de apertura, máximo de reservas activas y sin turnos superpuestos), baja = cancelar (con las horas mínimas de anticipación) y consulta (las propias; todas si es admin). No lleva modificación | ⏳ Pendiente |
| 2.3 | **Caso complejo - Clima para canchas al aire libre**: `GET /api/canchas/:id/clima?fecha=YYYY-MM-DD&hora=HH:MM`. Si la cancha es techada responde que no aplica; si es al aire libre consulta la API de [Open-Meteo](https://open-meteo.com/en/docs) (gratis, sin API key) con la latitud y longitud de la cancha, y devuelve temperatura, probabilidad de lluvia, viento y una recomendación ("buen día para jugar" / "probable lluvia, mejor una techada"). No felices: fecha fuera del pronóstico (más de 16 días), cancha inexistente, API caída (responde 502) | ⏳ Pendiente |
| 2.4 | Tests de reservas y clima: felices + no felices (fuera de horario, límite superado, cancelación tardía, turno ocupado, fecha sin pronóstico). El clima se testea con una versión MEM que devuelve un pronóstico fijo | ⏳ Pendiente |
| 2.5 | Docs de políticas, reservas y clima + diagrama de secuencia del clima | ⏳ Pendiente |

### Integrante 3 - Ezequiel Reynoso

| # | Tarea | Estado |
| --- | --- | --- |
| 3.1 | **ABM parcial de lista de espera**: anotarse a un turno ocupado (cancha, fecha y hora), salirse y ver las propias. Tabla nueva en Supabase (SQL en `server/sql/`) | ⏳ Pendiente |
| 3.2 | **Caso complejo - Aviso por mail**: cuando se cancela una reserva, el servicio busca quiénes estaban en la lista de espera de ese turno y les manda un mail avisando que se liberó (con nodemailer). El envío va con Factory: versión MEM (guarda los mails en un array para los tests) y versión real (SMTP, por ejemplo Gmail con contraseña de aplicación) | ⏳ Pendiente |
| 3.3 | **Caso complejo - Reporte descargable**: `GET /api/reportes/reservas?desde=...&hasta=...` (solo admin) genera un Excel (.xlsx) con las reservas del período y una hoja de resumen con la ocupación y los ingresos por cancha | ⏳ Pendiente |
| 3.4 | Tests de lista de espera, mails y reporte: felices + no felices (anotarse a un turno libre, anotarse dos veces, fechas inválidas en el reporte) | ⏳ Pendiente |
| 3.5 | Docs de lista de espera, mails y reporte + diagrama de secuencia del aviso por mail | ⏳ Pendiente |

### Entre todos (al final)

| Tarea | Estado |
| --- | --- |
| Conectar el front a la API (no se evalúa, pero suma para la demo) | ⏳ Pendiente |
| Ensayar la presentación oral de cada semana | ⏳ Pendiente |

### Extras, solo si sobra tiempo

Otras ideas del profe y nuestras: recomendar lugares para comer cerca de la cancha (geolocalización), traer reseñas de Google con Axios, chatbot de consultas, importador de canchas por CSV, turnos disponibles por cancha y fecha, estadísticas.

## 5. Dependencias entre tareas

| Quién | Necesita | De quién | Mientras tanto |
| --- | --- | --- | --- |
| Lucas (clima) | Campos techada, latitud y longitud en canchas | Bruno (1.6) | Arrancar por políticas y reservas |
| Ezequiel (mails) | Que cancelar una reserva avise al servicio de lista de espera | Lucas (2.2) | Armar la lista de espera y el envío de mails con datos en memoria |
| Ezequiel (reporte) | El DAO de reservas | Lucas (2.2) | Generar el Excel con reservas de prueba |

## 6. Cronograma

| Semana | Qué mostramos |
| --- | --- |
| 1 | Servidor andando: config, auth y tests (✅ listo). Reparto validado con el profe |
| 2 | ABMs: canchas completo (1.6-1.7), políticas y reservas (2.1-2.2), lista de espera (3.1) |
| 3 | Casos complejos: imágenes (1.8), clima (2.3), mails (3.2) y reporte (3.3) |
| 4 | Documentación, UML, ajustes e integración con el front |

---

## 7. Cómo agregar su recurso

1. Copiar `server/modelo/DAO/canchas/` como modelo: `<recurso>Factory.js`, `<recurso>Mem.js` y `<recurso>Supabase.js`.
2. Crear `servicio/`, `controlador/` y `router/` del recurso, siguiendo los de canchas (en cuanto esté la tarea 1.7).
3. Registrar el router en `server.js`.
4. Proteger las rutas con `auth.autenticar` y, si son de admin, también con `auth.soloAdmin`.
5. Escribir los tests en `test/`. En modo MEM se prueban las rutas protegidas con los tokens `token-admin` y `token-player`.
6. Agregar los endpoints a `server/README.md`.
7. Si cambian una tabla de Supabase, dejar el SQL en `server/sql/` y avisar en el grupo.

## 8. Cómo trabajamos en Git

- **Una rama por tarea**, por ejemplo `feature/2.2-reservas`, y PR a `main` para que otro lo revise.
- **Commits chicos y seguidos.** El profe quiere ver que avanzamos de a poco, no un commit gigante al final.
- Antes de abrir el PR: `npm test` tiene que pasar.
- **El `.env` no se sube nunca.** Las claves de Supabase y del mail se pasan por privado.
- Si cambian algo de la base común (`config.js`, `server.js`, middlewares), avisen en el grupo.
