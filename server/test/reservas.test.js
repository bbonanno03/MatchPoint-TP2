import assert from 'assert'
import Server from '../server.js'
import config from '../config.js'

const PORT = 8097
const URL = `http://localhost:${PORT}/api`

// Fecha dentro de "dias" dias, en formato YYYY-MM-DD
const fechaEn = dias => {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() + dias)
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

// Arma un pedido con el token del usuario (admin o player)
const pedir = (metodo, ruta, token, body) => fetch(`${URL}${ruta}`, {
    method: metodo,
    headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
    },
    body: body && JSON.stringify(body)
})

const reservar = (token, datos) => pedir('POST', '/reservas', token, datos)

describe('reservas', () => {
    let server = null

    // SETUP: levanta el servidor en memoria y deja las politicas conocidas
    before(async () => {
        config.MODO_PERSISTENCIA = 'MEM'
        server = new Server(PORT)
        await server.start()

        await pedir('PUT', '/politicas', 'token-admin', {
            max_active_reservations: 2, cancellation_hours: 24, opening_time: '08:00', closing_time: '23:00'
        })
    })

    // TEAR DOWN
    after(async () => {
        await server.stop()
    })

    describe('POST /api/reservas', () => {
        it('un jugador reserva un turno libre (201) y termina una hora despues', async () => {
            const res = await reservar('token-player', { court_id: '1', reservation_date: fechaEn(5), start_time: '19:00' })
            const body = await res.json()

            assert.strictEqual(res.status, 201)
            assert.strictEqual(body.end_time, '20:00')
            assert.strictEqual(body.status, 'active')
            assert.strictEqual(body.user_id, 'u2')
        })

        it('sin token responde 401', async () => {
            const res = await reservar(null, { court_id: '1', reservation_date: fechaEn(5), start_time: '10:00' })
            assert.strictEqual(res.status, 401)
        })

        it('con el body vacio responde 400', async () => {
            const res = await reservar('token-player', {})
            assert.strictEqual(res.status, 400)
        })

        it('con una hora mal escrita responde 400', async () => {
            const res = await reservar('token-player', { court_id: '1', reservation_date: fechaEn(5), start_time: '7pm' })
            assert.strictEqual(res.status, 400)
        })

            it('con una fecha que no existe (30 de febrero) responde 400', async () => {
            const res = await reservar('token-player', { court_id: '1', reservation_date: '2027-02-30', start_time: '19:00' })
            const body = await res.json()

            assert.strictEqual(res.status, 400)
            assert.strictEqual(body.error, 'La fecha no existe')
        })

        it('fuera del horario del club responde 400', async () => {
            const res = await reservar('token-player', { court_id: '1', reservation_date: fechaEn(5), start_time: '23:00' })
            const body = await res.json()

            assert.strictEqual(res.status, 400)
            assert.strictEqual(body.error, 'Las reservas deben estar entre 08:00 y 23:00')
        })

            it('en una fecha pasada responde 400', async () => {
            const res = await reservar('token-player', { court_id: '1', reservation_date: fechaEn(-1), start_time: '19:00' })
            assert.strictEqual(res.status, 400)
        })

        it('en una cancha inexistente responde 404', async () => {
            const res = await reservar('token-player', { court_id: '999', reservation_date: fechaEn(5), start_time: '19:00' })
            assert.strictEqual(res.status, 404)
        })

        it('un turno ya ocupado responde 409', async () => {
            const res = await reservar('token-admin', { court_id: '1', reservation_date: fechaEn(5), start_time: '19:00' })
            const body = await res.json()

            assert.strictEqual(res.status, 409)
            assert.strictEqual(body.error, 'El turno ya esta ocupado')
        })

        it('pasarse del maximo de reservas activas responde 409', async () => {
            await reservar('token-player', { court_id: '2', reservation_date: fechaEn(6), start_time: '10:00' })   // segunda (maximo 2)
            const res = await reservar('token-player', { court_id: '2', reservation_date: fechaEn(7), start_time: '10:00' })

            assert.strictEqual(res.status, 409)
        })
    })

    describe('GET /api/reservas', () => {
        it('un jugador ve solo sus reservas', async () => {
            const res = await pedir('GET', '/reservas', 'token-player')
            const body = await res.json()

            assert.strictEqual(res.status, 200)
            assert.strictEqual(body.length, 2)
            assert.ok(body.every(r => r.user_id == 'u2'))
        })

        it('un admin ve todas', async () => {
            await reservar('token-admin', { court_id: '1', reservation_date: fechaEn(8), start_time: '12:00' })
            const res = await pedir('GET', '/reservas', 'token-admin')
            const body = await res.json()

            assert.strictEqual(body.length, 3)
        })
    })

    describe('DELETE /api/reservas/:id', () => {
        it('el duenio cancela con anticipacion (200) y queda en estado cancelled', async () => {
            const res = await pedir('DELETE', '/reservas/1', 'token-player')
            const body = await res.json()

            assert.strictEqual(res.status, 200)
            assert.strictEqual(body.status, 'cancelled')
        })

        it('cancelar dos veces la misma reserva responde 409', async () => {
            const res = await pedir('DELETE', '/reservas/1', 'token-player')
            assert.strictEqual(res.status, 409)
        })

        it('una reserva de otro usuario responde 404', async () => {
            const res = await pedir('DELETE', '/reservas/3', 'token-player')
            assert.strictEqual(res.status, 404)
        })

        it('cancelar sin la anticipacion minima responde 409', async () => {
            await pedir('PUT', '/politicas', 'token-admin', { cancellation_hours: 1000 })   // mas de un mes
            const res = await pedir('DELETE', '/reservas/2', 'token-player')
            const body = await res.json()

            assert.strictEqual(res.status, 409)
            assert.strictEqual(body.error, 'Solo podes cancelar con 1000 horas de anticipacion')

            await pedir('PUT', '/politicas', 'token-admin', { cancellation_hours: 24 })      // vuelve a como estaba
        })

        it('al cancelar se libera el turno y se puede volver a reservar', async () => {
            const res = await reservar('token-admin', { court_id: '1', reservation_date: fechaEn(5), start_time: '19:00' })
            assert.strictEqual(res.status, 201)
        })
    })
})