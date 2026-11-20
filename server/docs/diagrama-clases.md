# Diagrama de clases general

Todos los recursos siguen las mismas capas (clase 11): **Router -> Controlador -> Servicio -> Factory -> DAO**. Cada DAO tiene una version en memoria (`MEM`, tests y desarrollo) y una de Supabase; la Factory elige segun `MODO_PERSISTENCIA`. Lo mismo pasa con los servicios externos (clima, mail, imagenes).

En el codigo, el router, el controlador y el servicio de cada recurso se llaman `Router`, `Controlador` y `Servicio` dentro de su archivo (por ejemplo `router/canchas.js`). En el diagrama llevan el nombre del recurso para distinguirlos.

## 1. Vista general por capas

```mermaid
classDiagram
    direction LR

    class Server {
        -port
        -server
        +start()
        +stop()
    }
    class crearServicios {
        <<funcion>>
        +crearServicios(opciones)
    }
    class Auth {
        -modelo
        +autenticar(req, res, next)
        +soloAdmin(req, res, next)
    }
    class ErrorHttp {
        +status
        +message
    }
    class config {
        <<modulo>>
        +PORT
        +MODO_PERSISTENCIA
        +MODO_CLIMA
        +MODO_MAIL
        +SUPABASE_URL
        +SUPABASE_KEY
    }
    class CnxSupabase {
        +cliente$
        +conectar()$
    }

    class RouterCanchas {
        +config()
    }
    class RouterReservas {
        +config()
    }
    class RouterPoliticas {
        +config()
    }
    class RouterListaEspera {
        +router
    }
    class RouterReportes {
        +router
    }
    class RouterClima {
        +config()
    }
    class RouterImagenes {
        +config()
    }

    class ServicioCanchas
    class ServicioReservas
    class ServicioPoliticas
    class ServicioListaEspera
    class ServicioReportes
    class ServicioClima
    class ServicioImagenes

    Server --> crearServicios : arma los servicios compartidos
    Server --> RouterCanchas
    Server --> RouterReservas
    Server --> RouterPoliticas
    Server --> RouterListaEspera
    Server --> RouterReportes
    Server --> RouterClima
    Server --> RouterImagenes

    RouterCanchas --> ServicioCanchas : via ControladorCanchas
    RouterReservas --> ServicioReservas : via ControladorReservas
    RouterPoliticas --> ServicioPoliticas : via ControladorPoliticas
    RouterListaEspera --> ServicioListaEspera : via ControladorListaEspera
    RouterReportes --> ServicioReportes : via ControladorReportes
    RouterClima --> ServicioClima : via ControladorClima
    RouterImagenes --> ServicioImagenes : via ControladorImagenes

    RouterCanchas ..> Auth
    RouterReservas ..> Auth
    RouterImagenes ..> Auth

    ServicioReservas --> ServicioListaEspera : avisarReservaCancelada
    ServicioClima --> ServicioCanchas
    ServicioImagenes --> ServicioCanchas

    ServicioCanchas ..> ErrorHttp : lanza
    Auth ..> config
    CnxSupabase ..> config
```

## 2. Detalle de un recurso: canchas e imagenes (Integrante 1)

```mermaid
classDiagram
    direction TB

    class RouterCanchas {
        -controlador
        -auth
        +config()
    }
    class ControladorCanchas {
        -servicio
        +obtenerCanchas(req, res)
        +obtenerCancha(req, res)
        +guardarCancha(req, res)
        +actualizarCancha(req, res)
        +borrarCancha(req, res)
    }
    class ServicioCanchas {
        -modelo
        -reservas
        +obtenerCanchas(filtros)
        +obtenerCancha(id)
        +guardarCancha(datos)
        +actualizarCancha(id, datos)
        +guardarImagenUrl(id, url)
        +borrarCancha(id)
    }
    class Cancha {
        +validarAlta(datos)$
        +validarModificacion(datos)$
    }
    class CanchasFactory {
        +get(tipo)$
    }
    class DaoCanchas {
        <<interface>>
        +obtenerCanchas()
        +obtenerCancha(id)
        +guardarCancha(cancha)
        +actualizarCancha(id, cancha)
        +borrarCancha(id)
    }
    class CanchasMem {
        -canchas
    }
    class CanchasSupabase

    class RouterImagenes {
        -controlador
        -auth
        +config()
    }
    class ControladorImagenes {
        -servicio
        +subirImagen(req, res)
    }
    class recibirImagen {
        <<middleware multer>>
    }
    class ServicioImagenes {
        -canchas
        -imagenes
        +subirImagen(id, archivo)
    }
    class Imagen {
        +detectarFormato(buffer)$
        +validar(archivo)$
    }
    class ImagenesFactory {
        +get(tipo)$
    }
    class DaoImagenes {
        <<interface>>
        +guardarImagen(datos) url
    }
    class ImagenesMem {
        -imagenes
    }
    class ImagenesSupabase

    RouterCanchas --> ControladorCanchas
    ControladorCanchas --> ServicioCanchas
    ServicioCanchas ..> Cancha : valida con Joi
    ServicioCanchas ..> CanchasFactory : pide el DAO
    CanchasFactory ..> DaoCanchas : crea
    CanchasMem ..|> DaoCanchas
    CanchasSupabase ..|> DaoCanchas
    ServicioCanchas --> DaoCanchas

    RouterImagenes ..> recibirImagen
    RouterImagenes --> ControladorImagenes
    ControladorImagenes --> ServicioImagenes
    ServicioImagenes ..> Imagen : valida
    ServicioImagenes --> ServicioCanchas : obtenerCancha / guardarImagenUrl
    ServicioImagenes ..> ImagenesFactory : pide el DAO
    ImagenesFactory ..> DaoImagenes : crea
    ImagenesMem ..|> DaoImagenes
    ImagenesSupabase ..|> DaoImagenes
    ServicioImagenes --> DaoImagenes
```

## 3. Resto de los DAOs y servicios externos

| Recurso | Factory | Version MEM | Version real |
| --- | --- | --- | --- |
| Canchas | `CanchasFactory` | `canchasMem` | `canchasSupabase` (tabla `courts`) |
| Imagenes | `ImagenesFactory` | `imagenesMem` | `imagenesSupabase` (Storage, bucket `canchas`) |
| Politicas | `politicasFactory` | `politicasMem` | `politicasSupabase` (tabla `policies`) |
| Reservas | `reservasFactory` | `reservasMem` | `reservasSupabase` (tabla `reservations`) |
| Lista de espera | `listaEsperaFactory` | `listaEsperaMem` | `listaEsperaSupabase` (tabla `waiting_list`) |
| Reportes | `reportesFactory` | `reportesMem` | `reportesSupabase` |
| Auth | `authFactory` | `authMem` (tokens fijos) | `authSupabase` (Supabase Auth + `profiles`) |
| Clima | `ClimaFactory` (`MODO_CLIMA`) | `ClimaMem` | `ClimaOpenMeteo` (API Open-Meteo) |
| Mail | `MailFactory` (`MODO_MAIL`) | `MailMem` | `MailSmtp` (nodemailer) |
