import express from 'express'
import Controlador from '../controlador/canchas.js'
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
        const soloAdmin = [this.#auth.autenticar, this.#auth.soloAdmin]

        // Consultas: publicas (cualquiera puede ver las canchas)
        router.get('/', this.#controlador.obtenerCanchas)
        router.get('/:id', this.#controlador.obtenerCancha)

        // Alta, baja y modificacion: solo administradores
        router.post('/', soloAdmin, this.#controlador.guardarCancha)
        router.put('/:id', soloAdmin, this.#controlador.actualizarCancha)
        router.delete('/:id', soloAdmin, this.#controlador.borrarCancha)

        return router
    }
}

export default Router
