import Joi from 'joi'
import ClimaFactory from './clima/climaFactory.js'
import ServicioCanchas from './canchas.js'
import Pronostico from '../modelo/Pronostico.js'
import config from '../config.js'

const DIAS_DE_PRONOSTICO = 16      // Open-Meteo pronostica hasta 16 dias


class Servicio {
    #clima = null
    #canchas = null

    // canchas: el servicio de canchas de Bruno (el server le pasa el compartido)
    constructor({ canchas, clima } = {}) {
        this.#canchas = canchas || new ServicioCanchas()
        this.#clima = clima || ClimaFactory.get(config.MODO_CLIMA)
    }

    #error = (status, mensaje) => {
        const error = new Error(mensaje)
        error.status = status
        return error
    }

    // Arma la fecha y se fija que no se haya "corrido": 2027-02-30 pasaria a ser 2027-03-02
    #esFechaReal = texto => {
        const [anio, mes, dia] = texto.split('-').map(Number)
        const fecha = new Date(anio, mes - 1, dia)
        return fecha.getFullYear() == anio && fecha.getMonth() == mes - 1 && fecha.getDate() == dia
    }

    #validarConsulta = ({ fecha, hora }) => {
        const schemaConsulta = Joi.object({
            fecha: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),       // YYYY-MM-DD
            hora: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required()    // HH:MM
        })

        const { error } = schemaConsulta.validate({ fecha, hora })
        if (error) throw this.#error(400, error.message)

        if (!this.#esFechaReal(fecha)) throw this.#error(400, 'La fecha no existe')

    }

    #validarHorizonte = (fecha, techada) => {
        // El proveedor devuelve dias en horario argentino, incluso si el servidor usa UTC.
        const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
        const parte = tipo => partes.find(p => p.type === tipo).value
        const hoy = `${parte('year')}-${parte('month')}-${parte('day')}`
        const diasQueFaltan = Math.round((Date.parse(fecha) - Date.parse(hoy)) / 86400000)
        if (diasQueFaltan < 0) throw this.#error(400, 'La fecha del turno ya paso')
        if (!techada && diasQueFaltan >= DIAS_DE_PRONOSTICO) {
            const consultarDesde = new Date(Date.parse(fecha) - (DIAS_DE_PRONOSTICO - 1) * 86400000).toISOString().slice(0, 10)
            throw Object.assign(this.#error(400, `Todavia no hay pronostico para el ${fecha}. Podras consultarlo desde el ${consultarDesde}. Podes reservar igualmente.`), {
                code: 'PRONOSTICO_NO_DISPONIBLE', consultarDesde,
            })
        }
    }

    obtenerClima = async (id, consulta) => {
        // 1. Fecha y hora bien escritas
        this.#validarConsulta(consulta)

        // 2. La cancha tiene que existir (si no, el servicio de canchas tira 404)
        const cancha = await this.#canchas.obtenerCancha(id)

        const respuesta = { cancha: cancha.name, techada: cancha.covered, fecha: consulta.fecha, hora: consulta.hora }

        this.#validarHorizonte(consulta.fecha, cancha.covered)

        // 3. Si es techada, el clima no importa
        if (cancha.covered) {
            return { ...respuesta, recomendacion: 'La cancha es techada: el clima no afecta el partido' }
        }


        // 4. Al aire libre: hace falta la ubicacion para pedir el pronostico
        if (cancha.latitude == null || cancha.longitude == null) {
            throw this.#error(409, 'La cancha no tiene ubicacion cargada')
        }

        const datos = await this.#clima.obtenerPronostico({
            latitude: cancha.latitude,
            longitude: cancha.longitude,
            fecha: consulta.fecha,
            hora: consulta.hora
        })

        // 5. Arma la recomendacion con el pronostico
        const pronostico = new Pronostico(datos)
        return { ...respuesta, ...pronostico.get() }
    }
}

export default Servicio