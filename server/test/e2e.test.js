import assert from 'assert'
import Server from '../server.js'
import config from '../config.js'

// Test end-to-end: levanta el servidor COMPLETO (todas las rutas y middlewares, igual que index.js)
// y le hace pedidos HTTP reales, como lo haria el front.
// Prueba los dos endpoints documentados en README.md:
//   - POST /api/canchas      (ABM de canchas)
//   - GET  /api/lista-espera (ABM de lista de espera)

const PORT = 8095
const URL = `http://localhost:${PORT}/api`

describe('end-to-end: servidor completo', () => {
    let server = null

    before(async () => {
        config.MODO_PERSISTENCIA = 'MEM'
        server = new Server(PORT)
        await server.start()
    })

    after(async () => {
        await server.stop()
    })

    describe('POST /api/canchas', () => {
        const canchaNueva = {
            name: 'Cancha Tenis 3',
            sport: 'Tenis',
            club: 'MatchPoint Club',
            location: 'Moron',
            price: '16000',         // llega como texto y Joi lo convierte a numero
            latitude: -34.65,
            longitude: -58.62,
        }

        it('un admin crea una cancha: responde 201 con el JSON guardado y queda disponible', async () => {
            const res = await fetch(`${URL}/canchas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-admin' },
                body: JSON.stringify(canchaNueva),
            })
            const cancha = await res.json()

            assert.strictEqual(res.status, 201)
            assert.ok(cancha.id)
            assert.strictEqual(cancha.name, 'Cancha Tenis 3')
            assert.strictEqual(cancha.price, 16000)
            assert.strictEqual(cancha.active, true)
            assert.strictEqual(cancha.covered, false)

            // La cancha creada se puede consultar despues
            const resGet = await fetch(`${URL}/canchas/${cancha.id}`)
            assert.strictEqual(resGet.status, 200)
            assert.deepStrictEqual(await resGet.json(), cancha)
        })

        it('sin el campo obligatorio "sport" responde 400 con el error en JSON', async () => {
            const { sport, ...sinDeporte } = canchaNueva
            const res = await fetch(`${URL}/canchas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-admin' },
                body: JSON.stringify(sinDeporte),
            })
            const body = await res.json()

            assert.strictEqual(res.status, 400)
            assert.match(body.error, /sport/)
        })
    })

    describe('GET /api/lista-espera', () => {
        it('un jugador logueado consulta su lista: responde 200 con un array vacio', async () => {
            const res = await fetch(`${URL}/lista-espera`, {
                headers: { Authorization: 'Bearer token-player' },
            })

            assert.strictEqual(res.status, 200)
            assert.deepStrictEqual(await res.json(), [])
        })

        it('sin token responde 401', async () => {
            const res = await fetch(`${URL}/lista-espera`)
            assert.strictEqual(res.status, 401)
        })
    })
})
