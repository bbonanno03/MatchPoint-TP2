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

## Consultar clima al reservar

En **Canchas**, pulsar **Reservar Cancha**, elegir dia y horario y pulsar **Consultar clima**. Para canchas al aire libre se muestran temperatura, probabilidad de lluvia, viento y recomendacion. Para techadas se muestra el mensaje de que el clima no afecta el partido. La consulta no crea ni confirma una reserva.

El frontend llama a `/api/canchas/:id/clima?fecha=YYYY-MM-DD&hora=HH:MM` usando el mismo proxy `/api` configurado arriba. El backend debe estar en ejecucion y las canchas deben existir alli con los mismos ids que en la web: para usar las canchas de Supabase del frontend, configurar el backend con el mismo proyecto. La ruta de clima es publica; no necesita token de admin.

El modo real del servidor es `MODO_CLIMA=OPENMETEO` (predeterminado); requiere acceso a Open-Meteo y ubicacion de las canchas al aire libre. `MODO_CLIMA=MEM` sirve para ensayos con el pronostico fijo. La fecha debe estar entre hoy y dentro de 16 dias. Un error de pronostico no impide reservar. Al cambiar cancha, fecha u hora, se limpia el resultado y se cancela cualquier consulta anterior para no mostrar el clima de otro turno.


## Reservas y lista de espera

1. En **Canchas**, elegir **Reservar Cancha**, dia y horario y pulsar **Confirmar**. La web envia el token al servidor; identidad, duracion, disponibilidad y politicas se validan alli.
2. Si ese turno esta ocupado, aparece **Anotarme en lista de espera**. Al anotarse se confirma la inscripcion y se ofrece **Ver mi lista de espera**. Cambiar el turno limpia el mensaje anterior. Otros errores (por ejemplo, limite de reservas) se muestran sin ofrecer espera.
3. En **Mis reservas** (`/reservas`), **Mi lista de espera** muestra cancha, fecha y hora, permite **Actualizar** y **Salirme de la lista**.
4. Al cancelar desde **Mis reservas**, la API guarda la cancelacion y avisa por correo a los anotados. El turno no se asigna automaticamente: deben volver a reservar. Un fallo de correo no deshace la cancelacion.

Esta version necesita la API levantada contra el mismo proyecto de Supabase que la web (`MODO_PERSISTENCIA=SUPABASE`) y las migraciones del servidor, especialmente `001_lista_espera.sql` y `004_reservas_sin_superposiciones.sql`. La 004 evita dobles reservas simultaneas y revoca escrituras directas de clientes antiguos: desplegar API y frontend en conjunto. Ver configuracion de proxy arriba y [documentacion del servidor](../server/README.md). El backend debe tener su propia clave privada, nunca una variable `VITE_*`.

Para recibir avisos en una casilla real se necesita `MODO_MAIL=SMTP` y las variables SMTP del servidor. `MODO_MAIL=MEM` se usa en tests y no envia correo real. Los tokens fijos MEM no sirven para autenticar una sesion real de la web. Verificacion: `npm test` y `npm run build` desde `client/`.
