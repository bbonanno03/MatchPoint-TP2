import Servicio from '../servicio/clima.js'


class Controlador {
    #servicio = null

    constructor(servicio = new Servicio()) {
        this.#servicio = servicio
    }

    obtenerClima = async (req, res) => {
        try {
            const { id } = req.params
            const { fecha, hora } = req.query      // ?fecha=2026-11-20&hora=19:00

            const clima = await this.#servicio.obtenerClima(id, { fecha, hora })
            res.json(clima)
        }
        catch (error) {
            res.status(error.status || 500).json({ url: req.url, method: req.method, error: error.message, ...(error.code ? { code: error.code, consultarDesde: error.consultarDesde } : {}) })
        }
    }
}

export default Controlador