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
