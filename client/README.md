# MatchPoint

MatchPoint es una aplicación web desarrollada como Trabajo Práctico Final de Programación en Nuevas Tecnologías 2.

El sistema permite gestionar reservas de canchas de pádel y tenis, con usuarios jugadores y administradores.

## Tecnologías utilizadas

- Vue 3
- Vite
- Vue Router
- Pinia
- Tailwind CSS
- Supabase
- Git / GitHub

## Funcionalidades

### Usuario jugador

- Registro e inicio de sesión
- Visualización de canchas disponibles
- Reserva de canchas
- Consulta de reservas
- Visualización de políticas de reserva

### Usuario administrador

- Acceso a panel administrativo
- Gestión de canchas
- Gestión de usuarios
- Visualización de métricas
- Control de permisos por rol

## Autenticación

La autenticación se implementa con Supabase Auth.

Roles disponibles:

- `admin`
- `player`

Los datos adicionales del usuario se almacenan en la tabla `profiles`.

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto con:

```env
VITE_SUPABASE_URL=TU_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY

El archivo .env no debe subirse al repositorio.

Instalación
npm install
Ejecución en desarrollo
npm run dev
Build de producción
npm run build
Vista previa del build
npm run preview
Usuarios de prueba
Administrador

Email:

admin@matchpoint.com

Contraseña:

123456
Jugador

Email:

testplayer@mail.com

Contraseña:

123456

Estructura del proyecto

src/
├── assets/
├── components/
├── mocks/
├── router/
├── services/
├── stores/
├── utils/
├── views/
├── App.vue
└── main.js

Estado del proyecto - https://trello.com/b/1DYmE5wP/tp-final-pnt2

Sprint 1: Finalizado
Sprint 2: Finalizado
Sprint 3: Finalizado
Sprint 4: Finalizado