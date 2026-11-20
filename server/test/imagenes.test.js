import assert from 'assert'
import Server from '../server.js'
import config from '../config.js'
import { TAMANIO_MAXIMO } from '../modelo/Imagen.js'

const PORT = 8093
const URL = `http://localhost:${PORT}/api/canchas`

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), Buffer.alloc(50)])
const TEXTO = Buffer.from('esto no es una imagen, aunque se llame foto.png')

// Arma un pedido multipart/form-data como el que manda un formulario con <input type="file">
const subir = async (id, { buffer = PNG, campo = 'imagen', token = 'token-admin' } = {}) => {
    const form = new FormData()
    form.append(campo, new Blob([buffer], { type: 'image/png' }), 'foto.png')

    const res = await fetch(`${URL}/${id}/imagen`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
    })
    return { status: res.status, body: await res.json() }
}

describe('API de imagenes de canchas (1.8)', () => {
    let server = null

    beforeEach(async () => {
        config.MODO_PERSISTENCIA = 'MEM'
        server = new Server(PORT)
        await server.start()
    })

    afterEach(async () => {
        await server.stop()
    })

    it('un admin sube una imagen: responde 201 y la cancha queda con la URL', async () => {
        const { status, body } = await subir('2')

        assert.strictEqual(status, 201)
        assert.match(body.image_url, /^memoria:\/\/canchas\/cancha-2-\d+\.png$/)

        // La URL quedo guardada en la cancha
        const cancha = await (await fetch(`${URL}/2`)).json()
        assert.strictEqual(cancha.image_url, body.image_url)
    })

    it('sin token responde 401', async () => {
        const { status } = await subir('2', { token: null })
        assert.strictEqual(status, 401)
    })

    it('un jugador no puede subir imagenes (403)', async () => {
        const { status } = await subir('2', { token: 'token-player' })
        assert.strictEqual(status, 403)
    })

    it('sin archivo (campo con otro nombre) responde 400', async () => {
        const { status } = await subir('2', { campo: 'foto' })
        assert.strictEqual(status, 400)
    })

    it('un archivo que no es imagen responde 415 aunque diga .png', async () => {
        const { status, body } = await subir('2', { buffer: TEXTO })
        assert.strictEqual(status, 415)
        assert.match(body.error, /JPG, PNG o WEBP/)
    })

    it('una imagen de mas de 2 MB responde 413', async () => {
        const grande = Buffer.concat([PNG, Buffer.alloc(TAMANIO_MAXIMO)])
        const { status } = await subir('2', { buffer: grande })
        assert.strictEqual(status, 413)
    })

    it('una cancha inexistente responde 404', async () => {
        const { status } = await subir('99')
        assert.strictEqual(status, 404)
    })

    it('si falla la validacion la cancha no cambia', async () => {
        await subir('2', { buffer: TEXTO })
        const cancha = await (await fetch(`${URL}/2`)).json()
        assert.strictEqual(cancha.image_url, null)
    })
})
