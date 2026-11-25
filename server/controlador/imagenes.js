// Sin try/catch: Express 5 manda los errores de los controladores async a manejarErrores
class Controlador {
    #servicio = null

    constructor(servicio) {
        this.#servicio = servicio
    }

    subirImagen = async (req, res) => {
        const cancha = await this.#servicio.subirImagen(req.params.id, req.file)
        res.status(201).json(cancha)
    }
}

export default Controlador
