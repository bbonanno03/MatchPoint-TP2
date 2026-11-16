# Secuencia: aviso por mail al liberarse un turno

La busqueda de anotados y el envio MEM/SMTP estan implementados en `ServicioListaEspera.avisarReservaCancelada`. El tramo de cancelacion de reservas de la tarea 2.2 todavia debe conectarse: el diagrama describe el contrato previsto, sin fijar una ruta ni un body HTTP que aun no existen. Autenticacion, propiedad de la reserva y anticipacion minima se validan antes de guardar la cancelacion.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant R as Router de reservas
    participant C as Controlador de reservas
    participant S as Servicio de reservas
    participant D as DAO de reservas
    participant L as Servicio de lista de espera
    participant E as DAO de lista de espera
    participant F as Factory de mail
    participant M as Servicio de mail MEM o SMTP

    Note over R,D: Integracion pendiente en tarea 2.2
    U->>R: Solicitar cancelacion con token
    R->>R: Autenticar usuario
    R->>C: cancelar(usuario, reserva)
    C->>S: cancelar(usuario, reserva)
    S->>S: Validar propiedad y reglas de cancelacion
    alt Cancelacion rechazada
        S-->>C: Error de negocio
        C-->>R: Respuesta de error
        R-->>U: Cancelacion no realizada
    else Cancelacion permitida
        S->>D: Guardar status = cancelled
        alt Falla la persistencia
            D-->>S: Error al guardar
            S-->>C: Error sin invocar el aviso
            C-->>R: Respuesta de error
            R-->>U: Cancelacion no confirmada
        else Cancelacion guardada
            D-->>S: Reserva persistida con status cancelled
            S->>L: avisarReservaCancelada(reserva)
            L->>L: Validar datos y status cancelled
            L->>E: obtenerReservaTurno(cancha, fecha, hora)
            E-->>L: Ocupacion actual
            alt Turno todavia ocupado o datos invalidos
                L-->>S: Error 409 o 400, sin enviar mails
                Note over S,D: Gestionar fallo del aviso sin revertir cancelled
            else Turno libre
                L->>E: obtenerEnEsperaPorTurno(cancha, fecha, hora)
                E-->>L: Anotados y emails de perfiles
                alt No hay anotados
                    L-->>S: enviados = 0, fallidos = []
                else Hay anotados
                    L->>F: Obtener adaptador segun MODO_MAIL
                    F-->>L: MEM o SMTP con nodemailer
                    loop Por cada anotado del turno
                        alt Email ausente o invalido
                            L->>L: Agregar usuario a fallidos
                        else Email valido
                            L->>M: enviar(to, subject, text)
                            alt Envio aceptado
                                M-->>L: messageId
                                L->>L: Incrementar enviados
                            else Falla el envio
                                M-->>L: Error de transporte o destinatario rechazado
                                L->>L: Agregar fallo generico y continuar
                                Note over L,D: La reserva sigue cancelled aunque falle el mail
                            end
                        end
                    end
                    L-->>S: Resultado con enviados y fallidos
                end
            end
            Note over S,L: Si falla consulta o configuracion, S captura la excepcion y conserva cancelled
            S->>S: Registrar o gestionar resultado del aviso
            S-->>C: Cancelacion confirmada
            C-->>R: Respuesta de cancelacion
            R-->>U: Confirmacion, incluso si fallaron los mails
        end
    end
```

El servicio de reservas no debe incluir el guardado y el envio dentro de una operacion que revierta la cancelacion si el correo falla. Los errores por destinatario se devuelven como `fallidos`; las excepciones de consulta o configuracion deben capturarse en el servicio de reservas. Esa captura forma parte de la integracion pendiente, no del router de lista de espera.

MEM guarda los mensajes en un array para los tests. SMTP envia un mensaje por destinatario, sin exponer una lista de direcciones. No se reserva el turno para nadie, no se eliminan las inscripciones al avisar y no hay deduplicacion automatica si se vuelve a invocar el metodo.

Configuracion, parametros y respuestas: [README de la API](../README.md#aviso-por-mail-al-cancelar-una-reserva).
