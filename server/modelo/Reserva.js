import Joi from 'joi'


// Datos que manda el jugador para reservar un turno de una hora
class Reserva {
    court_id = null
    reservation_date = null
    start_time = null

    constructor({ court_id, reservation_date, start_time }) {
        this.court_id = court_id
        this.reservation_date = reservation_date
        this.start_time = start_time
    }

    validar() {
        const fecha = /^\d{4}-\d{2}-\d{2}$/              // formato YYYY-MM-DD
        const hora = /^([01]\d|2[0-3]):[0-5]\d$/         // formato HH:MM de 00:00 a 23:59

        const schemaReserva = Joi.object({
            court_id: Joi.string().required(),
            reservation_date: Joi.string().pattern(fecha).required(),
            start_time: Joi.string().pattern(hora).required()
        })

               const { error } = schemaReserva.validate(this.get())
        if (error) throw this.#errorValidacion(error.message)

        // El formato puede estar bien y la fecha no existir (ej. 2027-02-30)
        if (!this.#esFechaReal(this.reservation_date)) throw this.#errorValidacion('La fecha no existe')
    }

    // Arma la fecha y se fija que no se haya "corrido": 2027-02-30 pasaria a ser 2027-03-02
    #esFechaReal = texto => {
        const [anio, mes, dia] = texto.split('-').map(Number)
        const fecha = new Date(anio, mes - 1, dia)
        return fecha.getFullYear() == anio && fecha.getMonth() == mes - 1 && fecha.getDate() == dia
    }

    // El turno dura una hora: si empieza 19:00, termina 20:00 (igual que en el front)
    calcularFin() {
        const [horas, minutos] = this.start_time.split(':').map(Number)
        return `${String(horas + 1).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
    }

    get() {
        return {
            court_id: this.court_id,
            reservation_date: this.reservation_date,
            start_time: this.start_time
        }
    }

    #errorValidacion = mensaje => {
        const error = new Error(mensaje)
        error.status = 400
        return error
    }
}

export default Reserva