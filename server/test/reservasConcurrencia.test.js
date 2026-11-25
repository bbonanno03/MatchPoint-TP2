import assert from 'node:assert/strict'
import ModeloMem from '../modelo/DAO/reservas/reservasMem.js'
import ModeloSupabase from '../modelo/DAO/reservas/reservasSupabase.js'
import Cnx from '../modelo/DAO/CnxSupabase.js'
import Server from '../server.js'
import config from '../config.js'
import MailMem from '../servicio/mail/mailMem.js'

describe('concurrencia de reservas', () => {
    const turno = { court_id: '1', user_id: 'u2', reservation_date: '2027-01-20', start_time: '18:00', end_time: '19:00', status: 'active' }

    it('el DAO MEM acepta una sola de 20 escrituras para el mismo turno', async () => {
        const modelo = new ModeloMem()
        const resultados = await Promise.allSettled(Array.from({ length: 20 }, () => modelo.guardarReserva({ ...turno })))
        assert.equal(resultados.filter(r => r.status === 'fulfilled').length, 1)
        assert.ok(resultados.filter(r => r.status === 'rejected').every(r => r.reason.status === 409 && r.reason.code === 'TURNO_OCUPADO'))
        assert.equal((await modelo.obtenerReservas()).length, 1)
    })

    it('rechaza superposiciones parciales y confirmed; permite turnos contiguos y cancelados', async () => {
        const modelo = new ModeloMem()
        await modelo.guardarReserva({ ...turno, status: 'confirmed' })
        await assert.rejects(modelo.guardarReserva({ ...turno, start_time: '18:30', end_time: '19:30' }), e => e.code === 'TURNO_OCUPADO')
        await modelo.guardarReserva({ ...turno, start_time: '19:00', end_time: '20:00' })
        await modelo.cancelarReserva('1')
        await modelo.guardarReserva({ ...turno })
        assert.equal((await modelo.obtenerReservas()).length, 3)
    })

    it('traduce la exclusion atomica de PostgreSQL a 409 TURNO_OCUPADO', async () => {
        const original = Cnx.cliente
        try {
            Cnx.cliente = { from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ error: { code: '23P01' } }) }) }) }) }
            await assert.rejects(new ModeloSupabase().guardarReserva(turno), e => e.status === 409 && e.code === 'TURNO_OCUPADO')
        } finally { Cnx.cliente = original }
    })

    it('el circuito HTTP de dos usuarios deja un ganador y una sola notificacion al cancelar dos veces a la vez', async () => {
        const anterior = config.MODO_PERSISTENCIA
        config.MODO_PERSISTENCIA = 'MEM'
        const correo = new MailMem()
        const server = new Server(0, { correo })
        try {
            const listener = await server.start()
            const base = `http://127.0.0.1:${listener.address().port}/api`
            const pedir = async (method, path, token, body) => {
                const r = await fetch(base + path, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
                return { status: r.status, body: r.status === 204 ? null : await r.json() }
            }
            const dia = new Date(); dia.setDate(dia.getDate() + 7)
            const fecha = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`
            const datos = { court_id: '1', reservation_date: fecha, start_time: '18:00' }
            const tokens = ['token-player', 'token-admin']
            const altas = await Promise.all(tokens.map(t => pedir('POST', '/reservas', t, datos)))
            assert.deepEqual(altas.map(r => r.status).sort(), [201, 409])
            const ganador = altas.findIndex(r => r.status === 201), perdedor = 1 - ganador
            assert.equal(altas[perdedor].body.code, 'TURNO_OCUPADO')
            const reserva = altas[ganador].body
            assert.equal((await pedir('POST', '/lista-espera', tokens[perdedor], datos)).status, 201)
            assert.equal((await pedir('POST', '/lista-espera', tokens[perdedor], datos)).status, 409)
            assert.deepEqual((await pedir('GET', '/lista-espera', tokens[ganador])).body, [])
            const propia = (await pedir('GET', '/reservas', tokens[ganador])).body.find(r => r.id === reserva.id)
            assert.equal(propia.courts.name, 'Cancha Pádel 1')
            const bajas = await Promise.all(tokens.map(() => pedir('DELETE', `/reservas/${reserva.id}`, tokens[ganador])))
            assert.deepEqual(bajas.map(r => r.status).sort(), [200, 409])
            assert.equal(correo.mails.length, 1)
            assert.equal(correo.mails[0].to, perdedor === 0 ? 'player@matchpoint.com' : 'admin@matchpoint.com')
            assert.equal((await pedir('POST', '/reservas', tokens[perdedor], datos)).status, 201)
        } finally {
            await server.stop()
            config.MODO_PERSISTENCIA = anterior
        }
    })
})
