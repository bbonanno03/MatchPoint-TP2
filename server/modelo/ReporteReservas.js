import Joi from 'joi'

const fecha = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).custom((valor, helpers) => {
    const fecha = new Date(`${valor}T00:00:00Z`)
    if (valor.startsWith('0000') || Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== valor) {
        return helpers.error('any.invalid')
    }
    return valor
})

const esquema = Joi.object({ desde: fecha.required(), hasta: fecha.required() }).required()

export const validarPeriodo = query => {
    const { value, error } = esquema.validate(query, { convert: false, abortEarly: false })
    if (error || value.desde > value.hasta) {
        throw Object.assign(new Error('Indicar desde y hasta validos (YYYY-MM-DD), con desde menor o igual a hasta'), { status: 400 })
    }
    return value
}
