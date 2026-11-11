import ModelFactory from '../modelo/DAO/canchas/canchasFactory.js'
import Cancha from '../modelo/Cancha.js'
import { ErrorHttp } from '../middlewares/errores.js'
import config from '../config.js'


class Servicio {
    #modelo = null

    constructor() {
        this.#modelo = ModelFactory.get(config.MODO_PERSISTENCIA)
    }

    // Filtros opcionales: techada ('true' | 'false') y deporte
    obtenerCanchas = async ({ techada, deporte } = {}) => {
        if (techada !== undefined && techada != 'true' && techada != 'false') {
            throw new ErrorHttp(400, 'El filtro techada debe ser true o false')
        }

        let canchas = await this.#modelo.obtenerCanchas()

        if (techada !== undefined) {
            canchas = canchas.filter(c => c.covered == (techada == 'true'))
        }
        if (deporte) {
            canchas = canchas.filter(c => c.sport.toLowerCase() == deporte.toLowerCase())
        }
        return canchas
    }

    obtenerCancha = async id => {
        const cancha = await this.#modelo.obtenerCancha(id)
        if (!cancha) throw new ErrorHttp(404, 'Cancha no encontrada')
        return cancha
    }

    guardarCancha = async datos => {
        const cancha = Cancha.validarAlta(datos)
        return await this.#modelo.guardarCancha(cancha)
    }

    actualizarCancha = async (id, datos) => {
        const cambios = Cancha.validarModificacion(datos)
        const cancha = await this.#modelo.actualizarCancha(id, cambios)
        if (!cancha) throw new ErrorHttp(404, 'Cancha no encontrada')
        return cancha
    }

    borrarCancha = async id => {
        const cancha = await this.#modelo.borrarCancha(id)
        if (!cancha) throw new ErrorHttp(404, 'Cancha no encontrada')
        return cancha
    }
}

export default Servicio
