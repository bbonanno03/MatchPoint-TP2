import express from 'express'
import Controlador from '../controlador/politicas.js'
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

        router.get('/', this.#controlador.obtenerPoliticas)                                                   // publica
        router.put('/', this.#auth.autenticar, this.#auth.soloAdmin, this.#controlador.actualizarPoliticas)  // solo admin

        return router
    }
}

export default Router