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
| Servicios externos | Clima: Open-Meteo (sin API key). Mails: nodemailer. Imagenes: multer + Supabase Storage. Reporte: exceljs | Son los ejemplos del profe; cada uno con Factory MEM/real para que los tests no dependan de internet |

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

## 4. Reparto, dependencias y cronograma

Estan en `EQUIPO.md`, que es la fuente unica del reparto y del estado de cada tarea.

Resumen (actualizado el 2026-11-05 con lo que pidio el profe):

| Integrante | ABM | Casos de complejidad media/alta |
| --- | --- | --- |
| 1 - Bruno Bonanno | Canchas (completo) | Subida de imagenes a Supabase Storage |
| 2 - Lucas Pisati | Reservas (parcial) + politicas | Clima para canchas al aire libre (Open-Meteo) |
| 3 - Ezequiel Reynoso | Lista de espera (parcial) | Aviso por mail al liberarse un turno + reporte Excel |

Los casos del plan anterior (importador, disponibilidad, estadisticas) quedan como extras.

## 5. Forma de trabajo en Git

- Una rama por tarea (`feature/2.2-reservas`, ...), PR a `main`, revision de un companero.
- Commits chicos y descriptivos, uno por paso logico.
- `.env` nunca se sube; solo `.env.example`. La clave de Supabase va solo en `.env`.
