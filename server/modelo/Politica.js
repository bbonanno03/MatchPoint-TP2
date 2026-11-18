import Joi from 'joi'


// Reglas de reserva del club: una sola fila en la tabla "policies"
class Politica {
    max_active_reservations = null
    cancellation_hours = null
    opening_time = null
    closing_time = null

    constructor({ max_active_reservations, cancellation_hours, opening_time, closing_time }) {
        this.max_active_reservations = max_active_reservations
        this.cancellation_hours = cancellation_hours
        this.opening_time = opening_time
        this.closing_time = closing_time
    }

    validar() {
        const hora = /^([01]\d|2[0-3]):[0-5]\d$/      // formato HH:MM de 00:00 a 23:59

        const schemaPolitica = Joi.object({
            max_active_reservations: Joi.number().integer().min(1).required(),
            cancellation_hours: Joi.number().integer().min(0).required(),
            opening_time: Joi.string().pattern(hora).required(),
            closing_time: Joi.string().pattern(hora).required()
        })

        const { error } = schemaPolitica.validate(this.get())
        if (error) throw this.#errorValidacion(error.message)

        if (this.opening_time >= this.closing_time) {
            throw this.#errorValidacion('El horario de apertura debe ser anterior al de cierre')
        }
    }

    get() {
        return {
            max_active_reservations: this.max_active_reservations,
            cancellation_hours: this.cancellation_hours,
            opening_time: this.opening_time,
            closing_time: this.closing_time
        }
    }

    // Error con status 400 para que el controlador responda "Bad Request"
    #errorValidacion = mensaje => {
        const error = new Error(mensaje)
        error.status = 400
        return error
    }
}

export default Politica