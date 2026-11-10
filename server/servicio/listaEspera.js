import Joi from 'joi'
import config from '../config.js'
import ListaEsperaFactory from '../modelo/DAO/listaEspera/listaEsperaFactory.js'
import CanchasFactory from '../modelo/DAO/canchas/canchasFactory.js'
import { validarInscripcion } from '../modelo/ListaEspera.js'

class Servicio {
    #modelo
    #canchas
    #tipo

    constructor({ modelo, canchas, tipo = config.MODO_PERSISTENCIA } = {}) {
        this.#tipo = tipo
        this.#modelo = modelo || ListaEsperaFactory.get(tipo)
        this.#canchas = canchas || CanchasFactory.get(tipo)
    }

    #validarId = (id, siempreUuid = false) => {
        const esquema = siempreUuid || this.#tipo === 'SUPABASE'
            ? Joi.string().guid() : Joi.string().trim().max(100)
        if (esquema.required().validate(id, { convert: false }).error) {
            throw Object.assign(new Error('Identificador invalido'), { status: 400 })
        }
    }

    anotarse = async (userId, datos) => {
        const turno = validarInscripcion(datos)
        this.#validarId(turno.court_id)
        const cancha = await this.#canchas.obtenerCancha(turno.court_id)
        if (!cancha || !cancha.active) {
            throw Object.assign(new Error('Cancha inexistente o inactiva'), { status: 404 })
        }
        if (!await this.#modelo.obtenerReservaTurno(turno)) {
            throw Object.assign(new Error('El turno esta libre; no corresponde anotarse en lista de espera'), { status: 409 })
        }
        return this.#modelo.guardarInscripcion({ ...turno, user_id: userId })
    }

    obtenerPropias = async userId => this.#modelo.obtenerPropias(userId)

    salirse = async (userId, id) => {
        this.#validarId(id, true)
        const inscripcion = await this.#modelo.borrarInscripcion(id, userId)
        if (!inscripcion) {
            throw Object.assign(new Error('Inscripcion no encontrada'), { status: 404 })
        }
    }
}

export default Servicio
