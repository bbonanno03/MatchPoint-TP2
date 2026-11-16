import Servicio from '../servicio/canchas.js'


// Sin try/catch: en Express 5, si un controlador async lanza un error,
// Express lo manda solo a manejarErrores (middlewares/errores.js).
class Controlador {
    #servicio = null

    constructor() {
        this.#servicio = new Servicio()
    }

    obtenerCanchas = async (req, res) => {
        const canchas = await this.#servicio.obtenerCanchas(req.query)
        res.json(canchas)
    }

    obtenerCancha = async (req, res) => {
        const cancha = await this.#servicio.obtenerCancha(req.params.id)
        res.json(cancha)
    }

    guardarCancha = async (req, res) => {
        const cancha = await this.#servicio.guardarCancha(req.body)
        res.status(201).json(cancha)
    }

    actualizarCancha = async (req, res) => {
        const cancha = await this.#servicio.actualizarCancha(req.params.id, req.body)
        res.json(cancha)
    }

    borrarCancha = async (req, res) => {
        const cancha = await this.#servicio.borrarCancha(req.params.id)
        res.json(cancha)
    }
}

export default Controlador
