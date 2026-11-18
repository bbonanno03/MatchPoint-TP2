import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import Server from '../server.js'
import config from '../config.js'
import MailMem from '../servicio/mail/mailMem.js'

// Circuito real de routers/controladores/servicios/DAOs MEM, sin fixtures de reservas.
describe('integracion reservas, lista de espera, mails y reporte (MEM)', () => {
    let server, url, correo, avisos, anteriores, politicasOriginales
    const fecha = () => {
        const dia = new Date()
        dia.setDate(dia.getDate() + 7)
        return `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`
    }
    const turno = () => ({ court_id: '1', reservation_date: fecha(), start_time: '18:00' })
    const pedir = async (method, path, body, token = 'token-admin', base = url) => {
        const res = await fetch(base + path, {
            method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: body === undefined ? undefined : JSON.stringify(body),
        })
        return { status: res.status, body: res.status === 204 ? null
            : res.headers.get('content-type')?.includes('json') ? await res.json() : Buffer.from(await res.arrayBuffer()) }
    }
    const reservar = async (datos = turno()) => {
        const res = await pedir('POST', '/reservas', datos, 'token-player')
        assert.equal(res.status, 201, JSON.stringify(res.body))
        return res.body
    }
    const esperar = async (datos = turno(), token = 'token-admin') => {
        const res = await pedir('POST', '/lista-espera', datos, token)
        assert.equal(res.status, 201, JSON.stringify(res.body))
        return res.body
    }
    const reporte = async (base = url) => {
        const res = await pedir('GET', `/reportes/reservas?desde=${fecha()}&hasta=${fecha()}`, undefined, 'token-admin', base)
        assert.equal(res.status, 200)
        const libro = new ExcelJS.Workbook()
        await libro.xlsx.load(res.body)
        return libro
    }

    beforeEach(async () => {
        anteriores = { modo: config.MODO_PERSISTENCIA, mail: config.MODO_MAIL, smtp: config.SMTP }
        config.MODO_PERSISTENCIA = 'MEM'
        config.MODO_MAIL = 'MEM'
        correo = new MailMem()
        avisos = []
        server = new Server(0, { correo, registrarAviso: resultado => avisos.push(resultado) })
        const listener = await server.start()
        url = `http://127.0.0.1:${listener.address().port}/api`
        politicasOriginales = (await pedir('GET', '/politicas')).body
        const res = await pedir('PUT', '/politicas', {
            max_active_reservations: 5, cancellation_hours: 24, opening_time: '08:00', closing_time: '23:00',
        })
        assert.equal(res.status, 200)
    })

    afterEach(async () => {
        try {
            if (politicasOriginales) {
                const { max_active_reservations, cancellation_hours, opening_time, closing_time } = politicasOriginales
                await pedir('PUT', '/politicas', { max_active_reservations, cancellation_hours, opening_time, closing_time })
            }
        }
        finally {
            try { await server?.stop() }
            finally {
                config.MODO_PERSISTENCIA = anteriores.modo
                config.MODO_MAIL = anteriores.mail
                config.SMTP = anteriores.smtp
            }
        }
    })

    it('reserva, anota, cancela, envia al perfil correcto y actualiza el Excel', async () => {
        const reserva = await reservar()
        const inscripcion = await esperar()
        assert.deepEqual((await pedir('GET', '/lista-espera')).body, [inscripcion])
        const antes = await reporte()
        assert.equal(antes.getWorksheet('Reservas').rowCount, 2)
        assert.deepEqual(antes.getWorksheet('Resumen').getRow(3).values.slice(3), [1, 0, 1, 1, 12000])

        const cancelada = await pedir('DELETE', `/reservas/${reserva.id}`, undefined, 'token-player')
        assert.equal(cancelada.status, 200)
        assert.equal(cancelada.body.status, 'cancelled')
        assert.equal(correo.mails.length, 1)
        assert.equal(correo.mails[0].to, 'admin@matchpoint.com')
        assert.ok(correo.mails[0].text.includes(fecha()))
        assert.match(correo.mails[0].text, /18:00/)
        assert.deepEqual(avisos, [{ enviados: 1, fallidos: [] }])
        assert.equal((await pedir('GET', '/reservas')).body[0].status, 'cancelled')
        const despues = await reporte()
        assert.equal(despues.getWorksheet('Reservas').getCell('H2').value, 'cancelled')
        assert.deepEqual(despues.getWorksheet('Resumen').getRow(3).values.slice(3), [1, 1, 0, 0, 0])

        assert.equal((await pedir('DELETE', `/reservas/${reserva.id}`, undefined, 'token-player')).status, 409)
        assert.equal(correo.mails.length, 1)
        assert.equal((await pedir('POST', '/reservas', turno())).status, 201)
    })

    it('conserva cancelled si falla un destinatario, continua y registra los fallidos', async () => {
        const intentos = []
        correo.enviar = async mail => {
            intentos.push(mail.to)
            if (intentos.length === 1) throw new Error('fallo simulado de SMTP')
        }
        const reserva = await reservar()
        await esperar()
        await esperar(turno(), 'token-player')
        const cancelada = await pedir('DELETE', `/reservas/${reserva.id}`, undefined, 'token-player')
        assert.equal(cancelada.status, 200)
        assert.equal(cancelada.body.status, 'cancelled')
        assert.deepEqual(intentos, ['admin@matchpoint.com', 'player@matchpoint.com'])
        assert.deepEqual(avisos, [{ enviados: 1, fallidos: [{ user_id: 'u1', error: 'No se pudo enviar el aviso' }] }])
        assert.equal((await pedir('GET', '/reservas')).body[0].status, 'cancelled')
    })

    it('no envia a quien se salio ni a anotados de otra hora', async () => {
        const reserva = await reservar()
        const inscripcion = await esperar()
        await reservar({ ...turno(), start_time: '19:00' })
        await esperar({ ...turno(), start_time: '19:00' })
        assert.equal((await pedir('DELETE', `/lista-espera/${inscripcion.id}`)).status, 204)
        assert.equal((await pedir('DELETE', `/reservas/${reserva.id}`, undefined, 'token-player')).status, 200)
        assert.deepEqual(correo.mails, [])
        assert.deepEqual(avisos, [{ enviados: 0, fallidos: [] }])
    })

    it('reserva canchas creadas por la API y las incluye en lista de espera y reporte', async () => {
        const alta = await pedir('POST', '/canchas', {
            name: 'Cancha nueva', sport: 'Tenis', club: 'Club prueba', location: 'Moron', price: 14000,
        })
        assert.equal(alta.status, 201)
        const datos = { ...turno(), court_id: alta.body.id }
        await reservar(datos)
        await esperar(datos)
        const libro = await reporte()
        assert.equal(libro.getWorksheet('Reservas').getCell('D2').value, 'Cancha nueva')
        assert.equal(libro.getWorksheet('Resumen').getCell('G3').value, 14000)
    })

    it('respeta la desactivacion de canchas desde la API', async () => {
        assert.equal((await pedir('PUT', '/canchas/1', { active: false })).status, 200)
        assert.equal((await pedir('POST', '/reservas', turno(), 'token-player')).status, 404)
        assert.equal((await pedir('POST', '/lista-espera', turno())).status, 404)
    })

    it('consulta la tarifa actual compartida en cada descarga', async () => {
        await reservar()
        assert.equal((await pedir('PUT', '/canchas/1', { price: 20000 })).status, 200)
        assert.equal((await reporte()).getWorksheet('Resumen').getCell('G3').value, 20000)
    })

    it('impide borrar una cancha con historial para no romper los reportes', async () => {
        const reserva = await reservar()
        assert.equal((await pedir('DELETE', `/reservas/${reserva.id}`, undefined, 'token-player')).status, 200)
        assert.equal((await pedir('DELETE', '/canchas/1')).status, 409)
        assert.equal((await reporte()).getWorksheet('Reservas').rowCount, 2)
    })

    it('aisla los datos MEM de dos servidores diferentes', async () => {
        await reservar()
        await esperar()
        const otro = new Server(0, { correo: new MailMem() })
        try {
            const listener = await otro.start()
            const base = `http://127.0.0.1:${listener.address().port}/api`
            assert.deepEqual((await pedir('GET', '/reservas', undefined, 'token-admin', base)).body, [])
            assert.deepEqual((await pedir('GET', '/lista-espera', undefined, 'token-admin', base)).body, [])
            assert.equal((await reporte(base)).getWorksheet('Reservas').rowCount, 1)
            assert.equal((await pedir('GET', '/reservas')).body.length, 1)
        }
        finally { await otro.stop() }
    })

    it('confirma la cancelacion aunque SMTP no este configurado, sin intentar conexion', async () => {
        config.MODO_MAIL = 'SMTP'
        config.SMTP = { host: '', port: 587, user: '', pass: '', from: '' }
        const otro = new Server(0)
        try {
            const listener = await otro.start()
            const base = `http://127.0.0.1:${listener.address().port}/api`
            const alta = await pedir('POST', '/reservas', turno(), 'token-player', base)
            assert.equal(alta.status, 201)
            assert.equal((await pedir('POST', '/lista-espera', turno(), 'token-admin', base)).status, 201)
            const baja = await pedir('DELETE', `/reservas/${alta.body.id}`, undefined, 'token-player', base)
            assert.equal(baja.status, 200)
            assert.equal(baja.body.status, 'cancelled')
            assert.equal((await pedir('GET', '/reservas', undefined, 'token-admin', base)).body[0].status, 'cancelled')
        }
        finally { await otro.stop() }
    })
})
