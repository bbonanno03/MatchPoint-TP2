import assert from 'assert'
import CnxSupabase from '../modelo/DAO/CnxSupabase.js'
import ModeloSupabase from '../modelo/DAO/canchas/canchasSupabase.js'

// Test unitario del DAO de Supabase sin conectarse: reemplazamos el cliente por uno falso
// que avisa si alguien intenta consultar la base.
describe('DAO de canchas en Supabase (sin conexion real)', () => {
    let consultas = 0
    let clienteOriginal = null

    before(() => {
        clienteOriginal = CnxSupabase.cliente
        CnxSupabase.cliente = { from: () => { consultas++; throw new Error('no deberia consultar la base') } }
    })

    after(() => {
        CnxSupabase.cliente = clienteOriginal
    })

    beforeEach(() => {
        consultas = 0
    })

    it('con un id que no es UUID devuelve null sin consultar la base', async () => {
        const modelo = new ModeloSupabase()

        assert.strictEqual(await modelo.obtenerCancha('abc'), null)
        assert.strictEqual(await modelo.actualizarCancha('abc', { price: 1 }), null)
        assert.strictEqual(await modelo.borrarCancha('abc'), null)
        assert.strictEqual(consultas, 0)
    })

    it('con un UUID si consulta la base', async () => {
        const modelo = new ModeloSupabase()

        await assert.rejects(() => modelo.obtenerCancha('59910231-b789-40ef-9809-357a8b7836f7'))
        assert.strictEqual(consultas, 1)
    })
})
