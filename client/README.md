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
```

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

## Exportar reservas desde la web

Con una sesion de administrador, entrar a **Metricas** (`/admin/metricas`), elegir **Desde** y **Hasta** y pulsar **Exportar Excel**. Descarga el detalle de reservas y el resumen de ocupacion e ingresos estimados por cancha. El formulario solo se muestra a administradores y el backend vuelve a validar token y rol.

La descarga usa el `access_token` actual de Supabase y consulta `/api/reportes/reservas`. Para usar la cuenta de la web, el servidor debe estar iniciado con `MODO_PERSISTENCIA=SUPABASE`, `SUPABASE_URL` del mismo proyecto y `SUPABASE_KEY` de servidor. Las credenciales privadas nunca van en `VITE_*`. El token real de la web no es uno de los tokens fijos de desarrollo MEM.

Vite reenvia `/api` al backend en `http://127.0.0.1:8080` por defecto. Si se inicia en otro puerto, configurar en `client/.env.local` o en el entorno antes de arrancar Vite:

```env
VITE_API_PROXY_TARGET=http://127.0.0.1:8090
```

Reiniciar Vite despues de cambiar esa variable. En produccion, configurar el servidor web para reenviar `/api` al backend bajo el mismo origen; el proxy de desarrollo de Vite no se incluye en el build.

Verificacion del servicio de descarga: `npm test` desde `client/`. Compilacion: `npm run build`.
