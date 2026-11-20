import express from 'express'
import Controlador from '../controlador/imagenes.js'
import Auth from '../middlewares/auth.js'
import { recibirImagen } from '../middlewares/recibirImagen.js'


class Router {
    #controlador = null
    #auth = null

    constructor(servicio) {
        this.#controlador = new Controlador(servicio)
        this.#auth = new Auth()
    }

    config() {
        const router = express.Router()

        // Solo admin. Primero se valida el usuario y despues se recibe el archivo
        router.post('/:id/imagen', this.#auth.autenticar, this.#auth.soloAdmin, recibirImagen, this.#controlador.subirImagen)

        return router
    }
}

export default Router
