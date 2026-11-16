import config from '../../config.js'
import MailMem from './mailMem.js'
import MailSmtp from './mailSmtp.js'

class MailFactory {
    static get(tipo = config.MODO_MAIL, smtp = config.SMTP) {
        switch (tipo) {
            case 'MEM': return new MailMem()
            case 'SMTP': return new MailSmtp(smtp)
            default: throw new Error(`Modo de mail no soportado: ${tipo}`)
        }
    }
}

export default MailFactory
