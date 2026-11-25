import Servicio from '../servicio/reservas.js'


class Controlador {
    #servicio = null

    constructor(servicio = new Servicio()) {
        this.#servicio = servicio
    }

    obtenerReservas = async (req, res) => {
        try {
            const reservas = await this.#servicio.obtenerReservas(req.usuario)
            res.json(reservas)
        }
        catch (error) {
            res.status(error.status || 500).json({ url: req.url, method: req.method, error: error.message, ...(error.code ? { code: error.code } : {}) })
        }
    }

    crearReserva = async (req, res) => {
        try {
            const datos = req.body

            // ---------- Validacion generica -----------
            if (!datos || Object.keys(datos).length == 0) {
                return res.status(400).json({ url: req.url, method: req.method, error: 'No se enviaron datos de la reserva' })
            }

            const reserva = await this.#servicio.crearReserva(req.usuario, datos)
            res.status(201).json(reserva)
        }
        catch (error) {
            res.status(error.status || 500).json({ url: req.url, method: req.method, error: error.message, ...(error.code ? { code: error.code } : {}) })
        }
    }

    cancelarReserva = async (req, res) => {
        try {
            const { id } = req.params
            const reserva = await this.#servicio.cancelarReserva(req.usuario, id)
            res.json(reserva)
        }
        catch (error) {
            res.status(error.status || 500).json({ url: req.url, method: req.method, error: error.message })
        }
    }
}

export default Controlador
