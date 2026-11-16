import { Router } from 'express'
import Auth from '../middlewares/auth.js'
import Controlador from '../controlador/listaEspera.js'

class RouterListaEspera {
    constructor(servicio) {
        const controlador = new Controlador(servicio)
        const auth = new Auth()
        this.router = Router()
        this.router.use(auth.autenticar)
        this.router.get('/', controlador.obtenerPropias)
        this.router.post('/', controlador.anotarse)
        this.router.delete('/:id', controlador.salirse)
    }
}

export default RouterListaEspera
