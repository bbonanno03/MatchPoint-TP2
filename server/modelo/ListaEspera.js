import Joi from 'joi'

// El turno se identifica por cancha, fecha y hora de inicio, igual que reservations.
const fecha = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).custom((valor, helpers) => {
    const fecha = new Date(`${valor}T00:00:00Z`)
    if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== valor) {
        return helpers.error('any.invalid')
    }
    return valor
})

const esquema = Joi.object({
    court_id: Joi.string().trim().max(100).required(),
    reservation_date: fecha.required(),
    start_time: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
}).required()

export const validarInscripcion = datos => {
    const { value, error } = esquema.validate(datos, { abortEarly: false, convert: false })
    if (error) throw Object.assign(new Error(error.message), { status: 400 })
    return value
}
