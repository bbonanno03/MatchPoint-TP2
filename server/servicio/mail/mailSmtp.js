import nodemailer from 'nodemailer'
import Joi from 'joi'

class MailSmtp {
    #transport
    #from

    constructor(configuracion, transport) {
        const { value, error } = Joi.object({
            host: Joi.string().hostname().required(),
            port: Joi.number().integer().min(1).max(65535).required(),
            user: Joi.string().required(),
            pass: Joi.string().required(),
            from: Joi.string().email({ tlds: { allow: false } }).required(),
        }).required().validate(configuracion, { convert: false })
        // No incluir el error Joi: podria contener la contrasena ingresada.
        if (error) throw new Error('Configuracion SMTP incompleta o invalida')

        this.#from = value.from
        this.#transport = transport || nodemailer.createTransport({
            host: value.host,
            port: value.port,
            secure: value.port === 465,
            requireTLS: value.port !== 465,
            auth: { user: value.user, pass: value.pass },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
        })
    }

    enviar = async ({ to, subject, text }) => {
        const info = await this.#transport.sendMail({ from: this.#from, to, subject, text })
        if (!info.accepted?.length || info.rejected?.length) {
            throw new Error('El servidor SMTP no acepto el destinatario')
        }
        return { messageId: info.messageId }
    }
}

export default MailSmtp
