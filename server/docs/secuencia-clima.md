# Secuencia: consulta del clima de una cancha

`GET /api/canchas/:id/clima?fecha=YYYY-MM-DD&hora=HH:MM` es publica. El servicio de clima valida la consulta, busca la cancha con el servicio de canchas (el mismo que comparten los routers, creado en `crearServicios.js`) y, solo si es al aire libre, pide el pronostico. `ClimaFactory` elige segun `MODO_CLIMA`: `ClimaOpenMeteo` (API real) o `ClimaMem` (clima fijo para tests).

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant R as Router de clima
    participant C as Controlador de clima
    participant S as Servicio de clima
    participant SC as Servicio de canchas
    participant F as ClimaFactory
    participant O as ClimaOpenMeteo o ClimaMem
    participant API as API Open-Meteo
    participant P as Pronostico

    Note over S,F: Al crear el servicio, la factory elige el clima segun MODO_CLIMA
    S->>F: get(MODO_CLIMA)
    F-->>S: ClimaOpenMeteo o ClimaMem

    U->>R: GET /api/canchas/:id/clima?fecha&hora
    R->>C: obtenerClima(req, res)
    C->>S: obtenerClima(id, { fecha, hora })
    S->>S: Validar fecha y hora (Joi, fecha real, hoy a 16 dias)
    alt Consulta invalida
        S-->>C: Error 400
        C-->>U: 400 { url, method, error }
    else Consulta valida
        S->>SC: obtenerCancha(id)
        alt La cancha no existe
            SC-->>S: Error 404
            S-->>C: Error 404
            C-->>U: 404 Cancha no encontrada
        else Cancha techada
            SC-->>S: cancha (covered = true)
            S-->>C: El clima no afecta el partido
            C-->>U: 200 sin pronostico
        else Al aire libre sin latitud y longitud
            SC-->>S: cancha sin ubicacion
            S-->>C: Error 409
            C-->>U: 409 La cancha no tiene ubicacion cargada
        else Al aire libre con ubicacion
            SC-->>S: cancha (latitude, longitude)
            S->>O: obtenerPronostico(latitude, longitude, fecha, hora)
            opt MODO_CLIMA = OPENMETEO
                O->>API: GET /v1/forecast (hourly, start_date, end_date)
                API-->>O: hourly.time, temperatura, lluvia, viento
            end
            alt API caida, con error o sin dato para esa hora
                O-->>S: Error 502
                S-->>C: Error 502
                C-->>U: 502 No se pudo consultar el clima
            else Hay pronostico
                O-->>S: { temperatura, probabilidadLluvia, viento }
                S->>P: new Pronostico(datos).get()
                P-->>S: datos + recomendacion
                S-->>C: cancha, fecha, hora, pronostico y recomendacion
                C-->>U: 200 { temperatura, probabilidadLluvia, viento, recomendacion }
            end
        end
    end
```
