import Joi from 'joi'
import config from '../config.js'
import ListaEsperaFactory from '../modelo/DAO/listaEspera/listaEsperaFactory.js'
import CanchasFactory from '../modelo/DAO/canchas/canchasFactory.js'
import { validarInscripcion } from '../modelo/ListaEspera.js'
import MailFactory from './mail/mailFactory.js'

class Servicio {
    #modelo
    #canchas
    #tipo
    #correo

    constructor({ modelo, canchas, correo, tipo = config.MODO_PERSISTENCIA } = {}) {
        this.#tipo = tipo
        this.#modelo = modelo || ListaEsperaFactory.get(tipo)
        this.#canchas = canchas || CanchasFactory.get(tipo)
        this.#correo = correo
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

    // Tarea 2.2: invocar con la reserva DEVUELTA por el DAO despues de persistir
    // la cancelacion, compartiendo este servicio/DAO con el router de lista de espera.
    // No exponer como endpoint ni deshacer una cancelacion por un fallo de correo.
    avisarReservaCancelada = async reserva => {
        if (reserva?.status !== 'cancelled') {
            throw Object.assign(new Error('La reserva debe estar cancelada para enviar avisos'), { status: 409 })
        }
        // Postgres devuelve time como HH:MM:SS; la API de lista de espera usa HH:MM.
        const hora = typeof reserva.start_time === 'string'
            ? reserva.start_time.replace(/^(\d{2}:\d{2}):00$/, '$1') : reserva.start_time
        const turno = validarInscripcion({
            court_id: reserva.court_id,
            reservation_date: reserva.reservation_date,
            start_time: hora,
        })
        this.#validarId(turno.court_id)
        if (await this.#modelo.obtenerReservaTurno(turno)) {
            throw Object.assign(new Error('El turno sigue ocupado; no se enviaron avisos'), { status: 409 })
        }

        const destinatarios = await this.#modelo.obtenerEnEsperaPorTurno(turno)
        const resultado = { enviados: 0, fallidos: [] }
        if (!destinatarios.length) return resultado

        this.#correo ||= MailFactory.get()
        for (const { user_id, email } of destinatarios) {
            if (Joi.string().email({ tlds: { allow: false } }).required().validate(email).error) {
                resultado.fallidos.push({ user_id, error: 'Email de perfil ausente o invalido' })
                continue
            }
            try {
                await this.#correo.enviar({
                    to: email,
                    subject: 'MatchPoint: se libero un turno',
                    text: `Se libero el turno de la cancha ${turno.court_id} del ${turno.reservation_date} a las ${turno.start_time}. ` +
                        'Podes consultar la disponibilidad y reservarlo en MatchPoint. Este aviso no garantiza la reserva.',
                })
                resultado.enviados++
            }
            catch {
                // No filtrar errores SMTP con credenciales ni cortar el resto de envios.
                resultado.fallidos.push({ user_id, error: 'No se pudo enviar el aviso' })
            }
        }
        return resultado
    }
}

export default Servicio
