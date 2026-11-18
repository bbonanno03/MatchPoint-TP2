import express from 'express'
import Controlador from '../controlador/reservas.js'
import Auth from '../middlewares/auth.js'


class Router {
    #controlador = null
    #auth = null

    constructor() {
        this.#controlador = new Controlador()
        this.#auth = new Auth()
    }

    config() {
        const router = express.Router()

        // Todas las rutas piden estar logueado: el usuario sale del token (req.usuario)
        router.get('/', this.#auth.autenticar, this.#controlador.obtenerReservas)
        router.post('/', this.#auth.autenticar, this.#controlador.crearReserva)
        router.delete('/:id', this.#auth.autenticar, this.#controlador.cancelarReserva)

        return router
    }
}

export default Router