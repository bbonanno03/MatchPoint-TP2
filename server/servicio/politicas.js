import ModelFactory from '../modelo/DAO/politicas/politicasFactory.js'
import Politica from '../modelo/Politica.js'
import config from '../config.js'


class Servicio {
    #modelo = null

    constructor() {
        this.#modelo = ModelFactory.get(config.MODO_PERSISTENCIA)
    }

    obtenerPoliticas = async () => {
        const politicas = await this.#modelo.obtenerPoliticas()
        return politicas
    }

    // Permite cambiar solo algunos campos: se combinan con los actuales y se valida el resultado
    actualizarPoliticas = async cambios => {
        const actuales = await this.#modelo.obtenerPoliticas()

        const politicaModelo = new Politica({ ...actuales, ...cambios })
        politicaModelo.validar()

        const politicasActualizadas = await this.#modelo.actualizarPoliticas(politicaModelo.get())
        return politicasActualizadas
    }
}

export default Servicio