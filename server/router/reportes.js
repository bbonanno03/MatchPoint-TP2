import { Router } from 'express'
import Auth from '../middlewares/auth.js'
import Controlador from '../controlador/reportes.js'

class RouterReportes {
    constructor(servicio) {
        const controlador = new Controlador(servicio)
        const auth = new Auth()
        this.router = Router()
        this.router.get('/reservas', auth.autenticar, auth.soloAdmin, controlador.reservas)
    }
}

export default RouterReportes
