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

        // Solo hay pronostico desde hoy hasta dentro de 16 dias
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)
        const dia = new Date(`${fecha}T00:00:00`)
        const diasQueFaltan = Math.round((dia - hoy) / (1000 * 60 * 60 * 24))

        if (diasQueFaltan < 0 || diasQueFaltan > DIAS_DE_PRONOSTICO) {
            throw this.#error(400, `Solo hay pronostico desde hoy hasta dentro de ${DIAS_DE_PRONOSTICO} dias`)
        }
    }

    obtenerClima = async (id, consulta) => {
        // 1. Fecha y hora bien escritas y dentro del pronostico
        this.#validarConsulta(consulta)

        // 2. La cancha tiene que existir (si no, el servicio de canchas tira 404)
        const cancha = await this.#canchas.obtenerCancha(id)

        const respuesta = { cancha: cancha.name, techada: cancha.covered, fecha: consulta.fecha, hora: consulta.hora }

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