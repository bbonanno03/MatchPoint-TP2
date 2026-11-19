import express from 'express'
import Controlador from '../controlador/clima.js'


class Router {
    #controlador = null

    constructor(servicio) {
        this.#controlador = new Controlador(servicio)
    }

    config() {
        const router = express.Router()

        // Publica: cualquiera puede consultar el clima de una cancha
        router.get('/:id/clima', this.#controlador.obtenerClima)

        return router
    }
}

export default Router