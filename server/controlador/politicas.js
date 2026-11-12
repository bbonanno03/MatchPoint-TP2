import Servicio from '../servicio/politicas.js'


class Controlador {
    #servicio = null

    constructor() {
        this.#servicio = new Servicio()
    }

    obtenerPoliticas = async (req, res) => {
        try {
            const politicas = await this.#servicio.obtenerPoliticas()
            res.json(politicas)
        }
        catch (error) {
            res.status(error.status || 500).json({ url: req.url, method: req.method, error: error.message })
        }
    }

    actualizarPoliticas = async (req, res) => {
        try {
            const cambios = req.body

            // ---------- Validacion generica -----------
            if (!cambios || Object.keys(cambios).length == 0) {
                return res.status(400).json({ url: req.url, method: req.method, error: 'No se enviaron datos para actualizar' })
            }

            const politicas = await this.#servicio.actualizarPoliticas(cambios)
            res.json(politicas)
        }
        catch (error) {
            res.status(error.status || 500).json({ url: req.url, method: req.method, error: error.message })
        }
    }
}

export default Controlador