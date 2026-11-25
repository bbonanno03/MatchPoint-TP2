import assert from 'node:assert/strict'
import Servicio from '../servicio/clima.js'
const fechaEn = dias => {
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
    const n = tipo => Number(p.find(x => x.type === tipo).value)
    return new Date(Date.UTC(n('year'), n('month') - 1, n('day') + dias)).toISOString().slice(0, 10)
}
describe('horizonte real del pronostico', () => {
    let llamadas, servicio
    beforeEach(() => {
        llamadas = 0
        servicio = new Servicio({ canchas: { obtenerCancha: async id => ({ name: 'Cancha', covered: id === 'techada', latitude: -34, longitude: -58 }) }, clima: { obtenerPronostico: async () => { llamadas++; return { temperatura: 22, viento: 10, probabilidadLluvia: 0 } } } })
    })
    it('consulta la fecha y hora solicitadas dentro de los 16 dias incluido hoy', async () => {
        const r = await servicio.obtenerClima('aire', { fecha: fechaEn(15), hora: '19:00' })
        assert.equal(r.fecha, fechaEn(15)); assert.equal(r.hora, '19:00'); assert.equal(r.temperatura, 22)
        assert.equal(llamadas, 1)
    })
    it('fuera del horizonte informa cuando volver a consultar sin pedir datos inexistentes', async () => {
        await assert.rejects(servicio.obtenerClima('aire', { fecha: fechaEn(16), hora: '19:00' }), e => e.status === 400 && e.code === 'PRONOSTICO_NO_DISPONIBLE' && e.consultarDesde === fechaEn(1))
        assert.equal(llamadas, 0)
    })
    it('para una techada lejana el clima no aplica y no consulta al proveedor', async () => {
        const r = await servicio.obtenerClima('techada', { fecha: fechaEn(60), hora: '19:00' })
        assert.equal(r.techada, true); assert.equal(r.temperatura, undefined); assert.equal(llamadas, 0)
    })
    it('fechas pasadas al aire libre siguen siendo invalidas', async () => {
        await assert.rejects(servicio.obtenerClima('aire', { fecha: fechaEn(-1), hora: '19:00' }), e => e.status === 400 && !e.code)
        assert.equal(llamadas, 0)
    })
})
