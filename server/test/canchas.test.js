import assert from 'assert'
import Server from '../server.js'
import config from '../config.js'

const PORT = 8098
const URL = `http://localhost:${PORT}/api/canchas`

const ADMIN = { 'Content-Type': 'application/json', Authorization: 'Bearer token-admin' }
const JUGADOR = { 'Content-Type': 'application/json', Authorization: 'Bearer token-player' }

const canchaNueva = { name: 'Cancha Tenis 2', sport: 'Tenis', club: 'MatchPoint Club', location: 'Moron', price: 14000, latitude: -34.65, longitude: -58.62 }

// Helper: hace el pedido y devuelve status + body ya parseado
const pedir = async (url, opciones = {}) => {
    const res = await fetch(url, opciones)
    return { status: res.status, body: await res.json() }
}

describe('API de canchas (ABM completo)', () => {
    let server = null

    // Cada test arranca con un servidor nuevo, asi los datos en memoria vuelven a los iniciales
    beforeEach(async () => {
        config.MODO_PERSISTENCIA = 'MEM'
        server = new Server(PORT)
        await server.start()
    })

    afterEach(async () => {
        await server.stop()
    })

    describe('consulta', () => {
        it('GET /api/canchas lista todas las canchas sin necesidad de token', async () => {
            const { status, body } = await pedir(URL)
            assert.strictEqual(status, 200)
            assert.strictEqual(body.length, 2)
        })

        it('filtra las canchas al aire libre con ?techada=false', async () => {
            const { body } = await pedir(`${URL}?techada=false`)
            assert.strictEqual(body.length, 1)
            assert.strictEqual(body[0].covered, false)
        })

        it('filtra por deporte con ?deporte=pádel', async () => {
            const { body } = await pedir(`${URL}?deporte=${encodeURIComponent('pádel')}`)
            assert.strictEqual(body.length, 1)
            assert.strictEqual(body[0].sport, 'Pádel')
        })

        it('con un filtro techada invalido responde 400', async () => {
            const { status } = await pedir(`${URL}?techada=quizas`)
            assert.strictEqual(status, 400)
        })

        it('GET /api/canchas/:id devuelve la cancha', async () => {
            const { status, body } = await pedir(`${URL}/1`)
            assert.strictEqual(status, 200)
            assert.strictEqual(body.name, 'Cancha Pádel 1')
        })

        it('GET /api/canchas/:id inexistente responde 404', async () => {
            const { status } = await pedir(`${URL}/99`)
            assert.strictEqual(status, 404)
        })
    })

    describe('alta', () => {
        it('un admin crea una cancha y responde 201 con valores por defecto', async () => {
            const { status, body } = await pedir(URL, { method: 'POST', headers: ADMIN, body: JSON.stringify(canchaNueva) })

            assert.strictEqual(status, 201)
            assert.ok(body.id)
            assert.strictEqual(body.active, true)
            assert.strictEqual(body.covered, false)

            const { body: todas } = await pedir(URL)
            assert.strictEqual(todas.length, 3)
        })

        it('sin token responde 401', async () => {
            const { status } = await pedir(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(canchaNueva) })
            assert.strictEqual(status, 401)
        })

        it('un jugador no puede crear canchas (403)', async () => {
            const { status } = await pedir(URL, { method: 'POST', headers: JUGADOR, body: JSON.stringify(canchaNueva) })
            assert.strictEqual(status, 403)
        })

        it('con datos invalidos responde 400 y no la guarda', async () => {
            const { status, body } = await pedir(URL, { method: 'POST', headers: ADMIN, body: JSON.stringify({ ...canchaNueva, price: -5 }) })
            assert.strictEqual(status, 400)
            assert.match(body.error, /price/)

            const { body: todas } = await pedir(URL)
            assert.strictEqual(todas.length, 2)
        })

        it('con latitud sin longitud responde 400', async () => {
            const { latitude, longitude, ...sinUbicacion } = canchaNueva
            const { status } = await pedir(URL, { method: 'POST', headers: ADMIN, body: JSON.stringify({ ...sinUbicacion, latitude }) })
            assert.strictEqual(status, 400)
        })
    })

    describe('modificacion', () => {
        it('un admin cambia el precio y el resto de los datos se mantiene', async () => {
            const { status, body } = await pedir(`${URL}/2`, { method: 'PUT', headers: ADMIN, body: JSON.stringify({ price: 18000 }) })
            assert.strictEqual(status, 200)
            assert.strictEqual(body.price, 18000)
            assert.strictEqual(body.name, 'Cancha Tenis 1')
        })

        it('sin datos responde 400', async () => {
            const { status } = await pedir(`${URL}/2`, { method: 'PUT', headers: ADMIN, body: JSON.stringify({}) })
            assert.strictEqual(status, 400)
        })

        it('una cancha inexistente responde 404', async () => {
            const { status } = await pedir(`${URL}/99`, { method: 'PUT', headers: ADMIN, body: JSON.stringify({ price: 1000 }) })
            assert.strictEqual(status, 404)
        })
    })

    describe('baja', () => {
        it('un admin borra una cancha y deja de aparecer', async () => {
            const { status } = await pedir(`${URL}/1`, { method: 'DELETE', headers: ADMIN })
            assert.strictEqual(status, 200)

            const { status: statusGet } = await pedir(`${URL}/1`)
            assert.strictEqual(statusGet, 404)
        })

        it('un jugador no puede borrar (403)', async () => {
            const { status } = await pedir(`${URL}/1`, { method: 'DELETE', headers: JUGADOR })
            assert.strictEqual(status, 403)
        })

        it('una cancha inexistente responde 404', async () => {
            const { status } = await pedir(`${URL}/99`, { method: 'DELETE', headers: ADMIN })
            assert.strictEqual(status, 404)
        })
    })
})
