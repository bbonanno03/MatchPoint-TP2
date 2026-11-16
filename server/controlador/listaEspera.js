import Servicio from '../servicio/listaEspera.js'

class Controlador {
    #servicio

    constructor(servicio = new Servicio()) {
        this.#servicio = servicio
    }

    anotarse = async (req, res) => {
        const inscripcion = await this.#servicio.anotarse(req.usuario.id, req.body)
        res.status(201).json(inscripcion)
    }

    obtenerPropias = async (req, res) => {
        res.json(await this.#servicio.obtenerPropias(req.usuario.id))
    }

    salirse = async (req, res) => {
        await this.#servicio.salirse(req.usuario.id, req.params.id)
        res.status(204).end()
    }
}

export default Controlador
