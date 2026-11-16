import Joi from 'joi'
import { ErrorHttp } from '../middlewares/errores.js'


// Reglas de validacion de una cancha (campos de la tabla "courts")
const campos = {
    name: Joi.string().trim().min(3).max(50),
    sport: Joi.string().valid('Pádel', 'Tenis'),
    club: Joi.string().trim().min(2).max(50),
    location: Joi.string().trim().min(2).max(80),
    price: Joi.number().positive(),                 // tarifa por hora
    active: Joi.boolean(),
    covered: Joi.boolean(),                         // true = techada, false = al aire libre
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
}

// Alta: obligatorios los datos basicos. La ubicacion va completa (latitud y longitud) o no va.
const schemaAlta = Joi.object({
    ...campos,
    name: campos.name.required(),
    sport: campos.sport.required(),
    club: campos.club.required(),
    location: campos.location.required(),
    price: campos.price.required(),
    active: campos.active.default(true),
    covered: campos.covered.default(false),
}).and('latitude', 'longitude')

// Modificacion: todos opcionales, pero tiene que venir al menos uno
const schemaModificacion = Joi.object(campos).min(1).and('latitude', 'longitude')


class Cancha {
    static validarAlta(datos) {
        return Cancha.#validar(schemaAlta, datos)
    }

    static validarModificacion(datos) {
        return Cancha.#validar(schemaModificacion, datos)
    }

    // Devuelve los datos ya convertidos (por ejemplo "12000" -> 12000) o lanza un 400
    static #validar(schema, datos) {
        const { error, value } = schema.validate(datos)
        if (error) throw new ErrorHttp(400, error.details[0].message)
        return value
    }
}

export default Cancha
