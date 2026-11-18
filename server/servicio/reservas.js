import ModelFactory from '../modelo/DAO/reservas/reservasFactory.js'
import CanchasFactory from '../modelo/DAO/canchas/canchasFactory.js'
import ServicioPoliticas from './politicas.js'
import ServicioListaEspera from './listaEspera.js'
import Reserva from '../modelo/Reserva.js'
import config from '../config.js'


class Servicio {
    #modelo = null
    #canchas = null
    #politicas = null
    #listaEspera = null
    #registrarAviso

    constructor({ modelo, canchas, politicas, listaEspera, registrarAviso } = {}) {
        this.#modelo = modelo || ModelFactory.get(config.MODO_PERSISTENCIA)
        this.#canchas = canchas || CanchasFactory.get(config.MODO_PERSISTENCIA)
        this.#politicas = politicas || new ServicioPoliticas()
        this.#listaEspera = listaEspera || new ServicioListaEspera()
        this.#registrarAviso = registrarAviso || (({ enviados, fallidos }) => {
            if (fallidos.length) console.warn(`Aviso de turno: ${enviados} enviados, ${fallidos.length} fallidos`)
        })
    }

    // Error con status HTTP para que el controlador sepa que responder
    #error = (status, mensaje) => {
        const error = new Error(mensaje)
        error.status = status
        return error
    }

    // Pasa "19:30" a minutos (1170) para poder comparar horarios
    #aMinutos = hora => {
        const [h, m] = hora.split(':').map(Number)
        return h * 60 + m
    }

    // Fecha y hora de inicio de la reserva como objeto Date
    #inicio = reserva => new Date(`${reserva.reservation_date}T${reserva.start_time}:00`)

    #esActiva = reserva => reserva.status == 'active' && this.#inicio(reserva) > new Date()

    // ------------------- Consulta -------------------
    obtenerReservas = async usuario => {
        const reservas = await this.#modelo.obtenerReservas()

        if (usuario.role == 'admin') return reservas                 // el admin ve todas
        return reservas.filter(r => r.user_id == usuario.id)          // el jugador, solo las suyas
    }

    // --------------------- Alta ---------------------
    crearReserva = async (usuario, datos) => {
        // 1. Formato de los datos
        const reservaModelo = new Reserva(datos)
        reservaModelo.validar()
        const reserva = { ...reservaModelo.get(), end_time: reservaModelo.calcularFin() }

        // 2. No se puede reservar en el pasado
        if (this.#inicio(reserva) <= new Date()) {
            throw this.#error(400, 'No se puede reservar un turno que ya paso')
        }

        // 3. La cancha tiene que existir y estar activa
        const cancha = await this.#canchas.obtenerCancha(reserva.court_id)
        if (!cancha || !cancha.active) throw this.#error(404, 'Cancha inexistente o inactiva')

        // 4. Dentro del horario del club
        const politicas = await this.#politicas.obtenerPoliticas()
        const empieza = this.#aMinutos(reserva.start_time)
        const termina = empieza + 60
        if (empieza < this.#aMinutos(politicas.opening_time) || termina > this.#aMinutos(politicas.closing_time)) {
            throw this.#error(400, `Las reservas deben estar entre ${politicas.opening_time} y ${politicas.closing_time}`)
        }

        const reservas = await this.#modelo.obtenerReservas()

        // 5. Sin pasarse del maximo de reservas activas
        const activas = reservas.filter(r => r.user_id == usuario.id && this.#esActiva(r))
        if (activas.length >= politicas.max_active_reservations) {
            throw this.#error(409, `No podes tener mas de ${politicas.max_active_reservations} reservas activas`)
        }

        // 6. Que el turno no este ocupado (otra reserva activa en la misma cancha que se superponga)
        const ocupado = reservas.some(r =>
            r.status == 'active' &&
            r.court_id == reserva.court_id &&
            r.reservation_date == reserva.reservation_date &&
            this.#aMinutos(r.start_time) < termina &&
            empieza < this.#aMinutos(r.end_time)
        )
        if (ocupado) throw this.#error(409, 'El turno ya esta ocupado')

        const reservaGuardada = await this.#modelo.guardarReserva({ ...reserva, user_id: usuario.id, status: 'active' })
        return reservaGuardada
    }

    // --------------------- Baja ---------------------
    cancelarReserva = async (usuario, id) => {
        const reserva = await this.#modelo.obtenerReserva(id)

        // Solo el duenio de la reserva (o un admin) la puede cancelar
        if (!reserva || (reserva.user_id != usuario.id && usuario.role != 'admin')) {
            throw this.#error(404, 'Reserva no encontrada')
        }
        if (reserva.status == 'cancelled') throw this.#error(409, 'La reserva ya esta cancelada')

        // Con la anticipacion minima que piden las politicas
        const politicas = await this.#politicas.obtenerPoliticas()
        const horasQueFaltan = (this.#inicio(reserva) - new Date()) / (1000 * 60 * 60)
        if (horasQueFaltan < politicas.cancellation_hours) {
            throw this.#error(409, `Solo podes cancelar con ${politicas.cancellation_hours} horas de anticipacion`)
        }

        const reservaCancelada = await this.#modelo.cancelarReserva(id)

        // Avisa por mail a la lista de espera (servicio de Ezequiel).
        // Si el mail falla, la cancelacion igual queda hecha.
        try {
            const resultado = await this.#listaEspera.avisarReservaCancelada(reservaCancelada)
            await this.#registrarAviso(resultado)
        }
        catch {
            console.warn('No se pudo completar el aviso a la lista de espera; la reserva sigue cancelada')
        }

        return reservaCancelada
    }
}

export default Servicio
