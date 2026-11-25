# Secuencia: subida de la imagen de una cancha

`POST /api/canchas/:id/imagen` es solo para administradores. El pedido es `multipart/form-data` con el archivo en el campo `imagen`. `multer` (middleware `recibirImagen`) deja el archivo en memoria en `req.file`; el servicio de imagenes valida el contenido real con el modelo `Imagen`, verifica la cancha con el servicio de canchas, sube el archivo con el DAO que elige `ImagenesFactory` segun `MODO_PERSISTENCIA` (`ImagenesSupabase` o `ImagenesMem`) y guarda la URL en `image_url`.

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin
    participant R as Router de imagenes
    participant AU as Auth
    participant M as recibirImagen (multer)
    participant C as Controlador de imagenes
    participant S as Servicio de imagenes
    participant I as Imagen (modelo)
    participant SC as Servicio de canchas
    participant D as ImagenesSupabase o ImagenesMem
    participant ST as Supabase Storage
    participant DC as DAO de canchas

    A->>R: POST /api/canchas/:id/imagen (campo "imagen")
    R->>AU: autenticar + soloAdmin
    alt Sin token o no es admin
        AU-->>A: 401 / 403
    else Admin
        R->>M: recibirImagen
        alt Mas de 2 MB o campo con otro nombre
            M-->>A: 413 / 400 { url, method, error }
        else Archivo recibido en req.file
            M->>C: subirImagen(req, res)
            C->>S: subirImagen(id, req.file)
            S->>I: validar(archivo)
            I->>I: detectarFormato(buffer): mira los primeros bytes
            alt Sin archivo o no es JPG/PNG/WEBP
                I-->>S: ErrorHttp 400 / 415
                S-->>A: 400 / 415 { url, method, error }
            else Imagen valida
                I-->>S: { tipo, extension }
                S->>SC: obtenerCancha(id)
                alt La cancha no existe
                    SC-->>S: ErrorHttp 404
                    S-->>A: 404 Cancha no encontrada
                else Existe
                    S->>D: guardarImagen({ nombre, buffer, tipo })
                    opt MODO_PERSISTENCIA = SUPABASE
                        D->>ST: upload al bucket "canchas"
                        ST-->>D: ok + URL publica
                    end
                    alt Falla la subida
                        D-->>S: Error
                        S-->>A: 500 No se pudo subir la imagen
                    else Subida ok
                        D-->>S: url
                        S->>SC: guardarImagenUrl(id, url)
                        SC->>DC: actualizarCancha(id, { image_url })
                        DC-->>SC: cancha actualizada
                        SC-->>S: cancha
                        S-->>C: cancha
                        C-->>A: 201 cancha con image_url
                    end
                end
            end
        end
    end
```

Notas:

- Los errores viajan como `ErrorHttp` hasta `manejarErrores` (`middlewares/errores.js`), que arma la respuesta `{ url, method, error }`.
- La imagen se valida **antes** de tocar la cancha o el Storage: si falla, la cancha no cambia.
- `image_url` no se puede cambiar con `PUT /api/canchas/:id`; solo subiendo una imagen.
