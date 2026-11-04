import assert from 'assert'
import Server from '../server.js'
import config from '../config.js'

const PORT = 8099
const URL = `http://localhost:${PORT}`

describe('servidor', () => {
    let server = null

    // SETUP: levanta el servidor en memoria antes de los tests
    before(async () => {
        config.MODO_PERSISTENCIA = 'MEM'
        server = new Server(PORT)
        await server.start()
    })

    // TEAR DOWN
    after(async () => {
        await server.stop()
    })

    describe('GET /api/health', () => {
        it('responde 200 con estado ok', async () => {
            const res = await fetch(`${URL}/api/health`)
            const body = await res.json()

            assert.strictEqual(res.status, 200)
            assert.deepStrictEqual(body, { estado: 'ok' })
        })
    })

    describe('ruta inexistente', () => {
        it('responde 404 con un mensaje de error', async () => {
            const res = await fetch(`${URL}/api/no-existe`)
            const body = await res.json()

            assert.strictEqual(res.status, 404)
            assert.strictEqual(body.error, 'Ruta no encontrada')
        })
    })

    describe('JSON mal formado', () => {
        it('responde 400', async () => {
            const res = await fetch(`${URL}/api/health`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{ esto no es json',
            })
            const body = await res.json()

            assert.strictEqual(res.status, 400)
            assert.strictEqual(body.error, 'JSON mal formado')
        })
    })
})
