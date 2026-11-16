import assert from 'node:assert/strict'
import Cnx from '../modelo/DAO/CnxSupabase.js'
import ListaEspera from '../modelo/DAO/listaEspera/listaEsperaSupabase.js'
import Reportes from '../modelo/DAO/reportes/reportesSupabase.js'

// Simula unicamente el borde de PostgREST. No consulta ni modifica Supabase real.
const simularConsulta = resultado => {
    const llamadas = []
    const consulta = { then: (ok, error) => Promise.resolve(resultado).then(ok, error) }
    for (const metodo of ['select', 'eq', 'order', 'insert', 'delete', 'single', 'maybeSingle']) {
        consulta[metodo] = (...args) => { llamadas.push([metodo, ...args]); return consulta }
    }
    Cnx.cliente = { from: tabla => { llamadas.push(['from', tabla]); return consulta } }
    return llamadas
}

describe('adaptadores Supabase de lista de espera y reportes (simulados)', () => {
    let original
    const turno = { court_id: '1', reservation_date: '2027-01-20', start_time: '18:00' }
    beforeEach(() => { original = Cnx.cliente })
    afterEach(() => { Cnx.cliente = original })

    it('traduce la restriccion unica de Supabase a conflicto 409', async () => {
        simularConsulta({ data: null, error: { code: '23505', message: 'duplicate' } })
        await assert.rejects(new ListaEspera().guardarInscripcion({ ...turno, user_id: 'u2' }), e => e.status === 409)
    })

    it('filtra la baja por id de inscripcion y usuario', async () => {
        const llamadas = simularConsulta({ data: null, error: null })
        assert.equal(await new ListaEspera().borrarInscripcion('i1', 'u2'), null)
        assert.ok(llamadas.some(l => l[0] === 'eq' && l[1] === 'id' && l[2] === 'i1'))
        assert.ok(llamadas.some(l => l[0] === 'eq' && l[1] === 'user_id' && l[2] === 'u2'))
    })

    it('obtiene los emails de los perfiles del turno exacto', async () => {
        const llamadas = simularConsulta({ data: [{ user_id: 'u2', profiles: { email: 'uno@example.com' } }], error: null })
        assert.deepEqual(await new ListaEspera().obtenerEnEsperaPorTurno(turno), [{ user_id: 'u2', email: 'uno@example.com' }])
        assert.deepEqual(llamadas.filter(l => l[0] === 'eq'), [
            ['eq', 'court_id', '1'], ['eq', 'reservation_date', '2027-01-20'], ['eq', 'start_time', '18:00:00'],
        ])
    })

    it('propaga errores de consulta de destinatarios', async () => {
        simularConsulta({ data: null, error: { message: 'Base no disponible' } })
        await assert.rejects(new ListaEspera().obtenerEnEsperaPorTurno(turno), /Base no disponible/)
    })

    it('recupera mas de 1000 reservas sin truncar el periodo solicitado', async () => {
        const registros = Array.from({ length: 1001 }, (_, i) => ({ id: String(i) }))
        const rangos = [], filtros = []
        const consulta = {
            select: () => consulta,
            gte: (k, v) => { filtros.push(['gte', k, v]); return consulta },
            lte: (k, v) => { filtros.push(['lte', k, v]); return consulta },
            order: () => consulta,
            range: async (a, b) => { rangos.push([a, b]); return { data: registros.slice(a, b + 1), error: null } },
        }
        Cnx.cliente = { from: () => consulta }
        assert.deepEqual(await new Reportes().obtenerReservasPeriodo({ desde: '2027-01-01', hasta: '2027-01-31' }), registros)
        assert.deepEqual(rangos, [[0, 499], [500, 999], [1000, 1499]])
        assert.deepEqual(filtros.slice(0, 2), [['gte', 'reservation_date', '2027-01-01'], ['lte', 'reservation_date', '2027-01-31']])
    })

    it('no devuelve un reporte parcial si falla una pagina posterior', async () => {
        let pagina = 0
        const consulta = {
            select: () => consulta, gte: () => consulta, lte: () => consulta, order: () => consulta,
            range: async () => ++pagina === 1
                ? { data: Array.from({ length: 500 }, (_, i) => ({ id: String(i) })), error: null }
                : { data: null, error: { message: 'Fallo pagina 2' } },
        }
        Cnx.cliente = { from: () => consulta }
        await assert.rejects(new Reportes().obtenerReservasPeriodo({ desde: '2027-01-01', hasta: '2027-01-31' }), /Fallo pagina 2/)
    })
})
