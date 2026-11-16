import assert from 'node:assert/strict'
import ModeloMem from '../modelo/DAO/listaEspera/listaEsperaMem.js'
import Servicio from '../servicio/listaEspera.js'
import MailFactory from '../servicio/mail/mailFactory.js'
import MailMem from '../servicio/mail/mailMem.js'
import MailSmtp from '../servicio/mail/mailSmtp.js'

describe('aviso por mail al liberarse un turno (MEM)', () => {
    const turno = { court_id: '1', reservation_date: '2027-01-20', start_time: '18:00' }
    let reserva, modelo, correo, servicio

    beforeEach(async () => {
        reserva = { ...turno, id: 'r1', status: 'active' }
        modelo = new ModeloMem([reserva], [
            { id: 'p1', email: 'uno@example.com' }, { id: 'p2', email: 'dos@example.com' },
        ])
        correo = MailFactory.get('MEM')
        servicio = new Servicio({ modelo, correo, tipo: 'MEM' })
        await servicio.anotarse('p1', turno)
        await servicio.anotarse('p2', turno)
    })

    it('avisa individualmente a todos los del turno y a nadie de otra cancha, fecha u hora', async () => {
        for (const cambio of [{ court_id: '2' }, { reservation_date: '2027-01-21' }, { start_time: '19:00' }]) {
            await modelo.guardarInscripcion({ ...turno, ...cambio, user_id: 'otro' })
        }
        // Simula la cancelacion ya persistida por el futuro DAO de reservas (2.2).
        reserva.status = 'cancelled'
        const resultado = await servicio.avisarReservaCancelada({ ...reserva, start_time: '18:00:00' })
        assert.deepEqual(resultado, { enviados: 2, fallidos: [] })
        assert.deepEqual(correo.mails.map(m => m.to), ['uno@example.com', 'dos@example.com'])
        for (const mail of correo.mails) {
            assert.match(mail.text, /cancha 1.*2027-01-20.*18:00/)
            assert.match(mail.subject, /libero un turno/)
            assert.equal(mail.cc, undefined)
            assert.equal(mail.bcc, undefined)
        }
        assert.equal((await servicio.obtenerPropias('p1')).length, 1)
    })

    it('no avisa a quien ya se salio', async () => {
        const [inscripcion] = await servicio.obtenerPropias('p2')
        await servicio.salirse('p2', inscripcion.id)
        reserva.status = 'cancelled'
        assert.deepEqual(await servicio.avisarReservaCancelada(reserva), { enviados: 1, fallidos: [] })
        assert.deepEqual(correo.mails.map(m => m.to), ['uno@example.com'])
    })

    it('devuelve cero envios cuando no hay nadie esperando', async () => {
        assert.deepEqual(await servicio.avisarReservaCancelada({ ...reserva, status: 'cancelled', start_time: '22:00' }),
            { enviados: 0, fallidos: [] })
        assert.deepEqual(correo.mails, [])
    })

    it('rechaza una reserva que no esta cancelada', async () => {
        await assert.rejects(servicio.avisarReservaCancelada(reserva), e => e.status === 409)
        assert.deepEqual(correo.mails, [])
    })

    it('no avisa si otra reserva todavia ocupa el turno', async () => {
        await assert.rejects(servicio.avisarReservaCancelada({ ...reserva, status: 'cancelled' }), e => e.status === 409)
        assert.deepEqual(correo.mails, [])
    })

    it('continua con los demas ante un fallo y no expone el error SMTP', async () => {
        reserva.status = 'cancelled'
        const intentos = []
        const conFalla = new Servicio({ modelo, tipo: 'MEM', correo: {
            enviar: async mail => {
                intentos.push(mail.to)
                if (intentos.length === 1) throw new Error('detalle privado del proveedor')
            },
        } })
        assert.deepEqual(await conFalla.avisarReservaCancelada(reserva), {
            enviados: 1, fallidos: [{ user_id: 'p1', error: 'No se pudo enviar el aviso' }],
        })
        assert.deepEqual(intentos, ['uno@example.com', 'dos@example.com'])
        assert.equal(reserva.status, 'cancelled')
    })

    it('informa el perfil sin email sin impedir otros envios', async () => {
        await modelo.guardarInscripcion({ ...turno, user_id: 'sin-email' })
        reserva.status = 'cancelled'
        assert.deepEqual(await servicio.avisarReservaCancelada(reserva), {
            enviados: 2, fallidos: [{ user_id: 'sin-email', error: 'Email de perfil ausente o invalido' }],
        })
    })

    for (const [nombre, cambio] of [
        ['fecha imposible', { reservation_date: '2027-02-29' }], ['hora con segundos', { start_time: '18:00:30' }],
    ]) {
        it(`no envia con ${nombre}`, async () => {
            reserva.status = 'cancelled'
            await assert.rejects(servicio.avisarReservaCancelada({ ...reserva, ...cambio }), e => e.status === 400)
            assert.deepEqual(correo.mails, [])
        })
    }
})

describe('Factory y adaptadores de correo (sin enviar correos reales)', () => {
    const smtp = { host: 'smtp.example.com', port: 587, user: 'prueba', pass: 'solo-dato-de-test', from: 'sender@example.com' }

    it('selecciona MEM y SMTP y rechaza un modo desconocido', () => {
        assert.ok(MailFactory.get('MEM') instanceof MailMem)
        assert.ok(MailFactory.get('SMTP', smtp) instanceof MailSmtp)
        assert.throws(() => MailFactory.get('OTRO'), /no soportado/)
    })

    it('guarda los mails MEM en un array que no puede modificarse desde afuera', async () => {
        const mail = new MailMem()
        const mensaje = { to: 'uno@example.com', subject: 'Aviso', text: 'Turno libre' }
        const resultado = await mail.enviar(mensaje)
        assert.equal(mail.mails.length, 1)
        assert.deepEqual(mail.mails[0], { ...mensaje, messageId: resultado.messageId })
        mail.mails[0].to = 'otro@example.com'
        assert.equal(mail.mails[0].to, mensaje.to)
    })

    it('adapta el mensaje a sendMail y fija el remitente configurado', async () => {
        let recibido
        const mail = new MailSmtp(smtp, { sendMail: async mensaje => {
            recibido = mensaje
            return { accepted: [mensaje.to], rejected: [], messageId: 'm1' }
        } })
        assert.deepEqual(await mail.enviar({ to: 'uno@example.com', subject: 'Aviso', text: 'Libre', from: 'otro@example.com' }),
            { messageId: 'm1' })
        assert.deepEqual(recibido, { from: smtp.from, to: 'uno@example.com', subject: 'Aviso', text: 'Libre' })
    })

    it('rechaza el destinatario no aceptado por SMTP', async () => {
        const mail = new MailSmtp(smtp, { sendMail: async () => ({ accepted: [], rejected: ['uno@example.com'] }) })
        await assert.rejects(mail.enviar({ to: 'uno@example.com' }), /no acepto/)
    })

    it('propaga la caida del transporte al servicio que gestiona los fallidos', async () => {
        const mail = new MailSmtp(smtp, { sendMail: async () => { throw new Error('SMTP caido') } })
        await assert.rejects(mail.enviar({ to: 'uno@example.com' }), /SMTP caido/)
    })

    for (const [nombre, datos] of [
        ['ausente', undefined], ['vacia', {}], ['sin contrasena', { ...smtp, pass: '' }],
        ['puerto invalido', { ...smtp, port: 70000 }], ['remitente invalido', { ...smtp, from: 'invalido' }],
    ]) {
        it(`rechaza configuracion SMTP ${nombre} sin exponer sus valores`, () => {
            assert.throws(() => new MailSmtp(datos), e => e.message === 'Configuracion SMTP incompleta o invalida')
        })
    }
})
