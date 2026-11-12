import { randomUUID } from 'node:crypto'

class MailMem {
    #mails = []

    get mails() {
        return this.#mails.map(mail => ({ ...mail }))
    }

    enviar = async mail => {
        const messageId = randomUUID()
        this.#mails.push({ ...mail, messageId })
        return { messageId }
    }
}

export default MailMem
