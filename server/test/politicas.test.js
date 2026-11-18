import assert from 'assert'
import Server from '../server.js'
import config from '../config.js'

const PORT = 8098
const URL = `http://localhost:${PORT}/api/politicas`

// Arma el pedido PUT con el token del usuario (admin o player)
const put = (body, token) => fetch(URL, {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
    },
    body: JSON.stringify(body)
})

describe('politicas', () => {
    let server = null

    // SETUP: levanta el servidor en memoria antes de los tests
    before(async () => {
        config.MODO_PERSISTENCIA = 'MEM'
        server = new Server(PORT)
        await server.start()
    })

    // TEAR DOWN: apaga el servidor al terminar
    after(async () => {
        await server.stop()
    })

    describe('GET /api/politicas', () => {
        it('responde 200 con las politicas, sin necesidad de token', async () => {
            const res = await fetch(URL)
            const body = await res.json()

            assert.strictEqual(res.status, 200)
            assert.strictEqual(body.max_active_reservations, 5)
            assert.strictEqual(body.cancellation_hours, 24)
            assert.strictEqual(body.opening_time, '08:00')
            assert.strictEqual(body.closing_time, '23:00')
        })
    })

    describe('PUT /api/politicas', () => {
        it('un admin puede cambiar un solo campo y el resto queda igual', async () => {
            const res = await put({ max_active_reservations: 3 }, 'token-admin')
            const body = await res.json()

            assert.strictEqual(res.status, 200)
            assert.strictEqual(body.max_active_reservations, 3)
            assert.strictEqual(body.opening_time, '08:00')
        })

        it('el cambio queda guardado', async () => {
            const res = await fetch(URL)
            const body = await res.json()

            assert.strictEqual(body.max_active_reservations, 3)
        })

        it('sin token responde 401', async () => {
            const res = await put({ max_active_reservations: 2 })
            assert.strictEqual(res.status, 401)
        })

        it('un jugador (no admin) recibe 403', async () => {
            const res = await put({ max_active_reservations: 2 }, 'token-player')
            assert.strictEqual(res.status, 403)
        })

        it('con el body vacio responde 400', async () => {
            const res = await put({}, 'token-admin')
            assert.strictEqual(res.status, 400)
        })

        it('con un maximo de reservas menor a 1 responde 400', async () => {
            const res = await put({ max_active_reservations: 0 }, 'token-admin')
            assert.strictEqual(res.status, 400)
        })

        it('con una hora mal escrita responde 400', async () => {
            const res = await put({ opening_time: '25:00' }, 'token-admin')
            assert.strictEqual(res.status, 400)
        })

        it('con la apertura despues del cierre responde 400', async () => {
            const res = await put({ opening_time: '22:00', closing_time: '10:00' }, 'token-admin')
            const body = await res.json()

            assert.strictEqual(res.status, 400)
            assert.strictEqual(body.error, 'El horario de apertura debe ser anterior al de cierre')
        })
    })
})