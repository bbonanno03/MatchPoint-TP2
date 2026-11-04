import assert from 'assert'
import Auth from '../middlewares/auth.js'
import config from '../config.js'

// Objeto "res" falso: guarda el status y el body que el middleware intenta devolver
const crearRes = () => {
    const res = { statusCode: 200, body: null }
    res.status = codigo => { res.statusCode = codigo; return res }
    res.json = datos => { res.body = datos; return res }
    return res
}

describe('middleware de autenticacion (modo MEM)', () => {
    let auth = null

    before(() => {
        config.MODO_PERSISTENCIA = 'MEM'
        auth = new Auth()
    })

    describe('autenticar', () => {
        it('con token valido deja el usuario en req.usuario y llama a next', async () => {
            const req = { headers: { authorization: 'Bearer token-player' } }
            const res = crearRes()
            let llamoNext = false

            await auth.autenticar(req, res, () => { llamoNext = true })

            assert.strictEqual(llamoNext, true)
            assert.strictEqual(req.usuario.role, 'player')
        })

        it('sin header Authorization responde 401', async () => {
            const req = { headers: {} }
            const res = crearRes()
            let llamoNext = false

            await auth.autenticar(req, res, () => { llamoNext = true })

            assert.strictEqual(llamoNext, false)
            assert.strictEqual(res.statusCode, 401)
        })

        it('con token inexistente responde 401', async () => {
            const req = { headers: { authorization: 'Bearer token-falso' } }
            const res = crearRes()

            await auth.autenticar(req, res, () => {})

            assert.strictEqual(res.statusCode, 401)
        })
    })

    describe('soloAdmin', () => {
        it('deja pasar a un admin', () => {
            const req = { usuario: { role: 'admin' } }
            let llamoNext = false

            auth.soloAdmin(req, crearRes(), () => { llamoNext = true })

            assert.strictEqual(llamoNext, true)
        })

        it('rechaza a un jugador con 403', () => {
            const req = { usuario: { role: 'player' } }
            const res = crearRes()

            auth.soloAdmin(req, res, () => {})

            assert.strictEqual(res.statusCode, 403)
        })
    })
})
