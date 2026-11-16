import assert from 'assert'
import ModeloMem from '../modelo/DAO/canchas/canchasMem.js'

describe('DAO de canchas en memoria', () => {
    let modelo = null

    // Cada test arranca con los datos iniciales
    beforeEach(() => {
        modelo = new ModeloMem()
    })

    it('obtenerCanchas devuelve las canchas iniciales', async () => {
        const canchas = await modelo.obtenerCanchas()
        assert.strictEqual(canchas.length, 2)
    })

    it('las canchas iniciales tienen si son techadas y su ubicacion', async () => {
        const padel = await modelo.obtenerCancha('1')
        const tenis = await modelo.obtenerCancha('2')

        assert.strictEqual(padel.covered, true)
        assert.strictEqual(tenis.covered, false)
        assert.strictEqual(typeof tenis.latitude, 'number')
        assert.strictEqual(typeof tenis.longitude, 'number')
    })

    it('guardarCancha le asigna un id nuevo', async () => {
        const cancha = await modelo.guardarCancha({ name: 'Cancha Padel 2', sport: 'Padel', price: 13000 })
        assert.strictEqual(cancha.id, '3')
        assert.strictEqual((await modelo.obtenerCanchas()).length, 3)
    })

    it('actualizarCancha modifica solo los campos enviados', async () => {
        const cancha = await modelo.actualizarCancha('1', { price: 20000 })
        assert.strictEqual(cancha.price, 20000)
        assert.strictEqual(cancha.name, 'Cancha Pádel 1')
    })

    it('borrarCancha elimina la cancha', async () => {
        await modelo.borrarCancha('1')
        assert.strictEqual(await modelo.obtenerCancha('1'), null)
    })

    it('obtenerCancha con id inexistente devuelve null', async () => {
        assert.strictEqual(await modelo.obtenerCancha('99'), null)
    })
})
