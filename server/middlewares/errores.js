// Error con codigo HTTP. Los servicios lo lanzan (por ejemplo 404 si no existe la cancha)
// y manejarErrores lo convierte en la respuesta.
// Express 5 manda solo al middleware de errores lo que falla en un controlador async.
export class ErrorHttp extends Error {
    constructor(status, mensaje) {
        super(mensaje)
        this.status = status
    }
}

// Se ejecuta cuando ninguna ruta coincide con la URL pedida
export const rutaNoEncontrada = (req, res) => {
    res.status(404).json({ url: req.url, method: req.method, error: 'Ruta no encontrada' })
}

// Middleware de errores de Express: se reconoce porque recibe 4 parametros.
// Atrapa errores no manejados en los controladores y el JSON mal formado.
export const manejarErrores = (error, req, res, next) => {
    const status = error.status || 500
    const mensaje = error.type == 'entity.parse.failed' ? 'JSON mal formado' : error.message

    if (status == 500) console.log(`Error no manejado: ${error.message}`)

    res.status(status).json({ url: req.url, method: req.method, error: mensaje })
}
