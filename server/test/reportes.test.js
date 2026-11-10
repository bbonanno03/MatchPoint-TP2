import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import config from '../config.js'
import ModeloMem from '../modelo/DAO/reportes/reportesMem.js'
import Servicio from '../servicio/reportes.js'
import Router from '../router/reportes.js'
import Server from '../server.js'
import { iniciarHttp } from './helpers/http.js'

const periodo = { desde: '2027-01-01', hasta: '2027-01-31' }
const leerExcel = async buffer => {
    const libro = new ExcelJS.Workbook()
    await libro.xlsx.load(buffer)
    return libro
}

describe('reporte Excel de reservas por HTTP (MEM)', () => {
    let http, servicio, modoAnterior

    beforeEach(async () => {
        modoAnterior = config.MODO_PERSISTENCIA
        config.MODO_PERSISTENCIA = 'MEM'
        const reserva = (id, court_id, date, start, end, status) => ({
            id, user_id: 'u2', court_id, reservation_date: date, start_time: start, end_time: end, status,
        })
        const reservas = [
            reserva('1', '1', '2027-01-01', '18:00', '19:00', 'active'),
            reserva('2', '1', '2027-01-31', '18:00:00', '19:30:00', 'completed'),
            reserva('3', '1', '2027-01-15', '20:00', '21:00', 'cancelled'),
            reserva('4', '2', '2027-01-15', '23:00:00', '24:00:00', 'confirmed'),
            reserva('5', '1', '2027-02-01', '18:00', '19:00', 'active'),
            reserva('6', '1', '2026-12-31', '18:00', '19:00', 'active'),
        ]
        const canchas = [{ id: '1', name: 'Pádel Ñ', price: 12000 }, { id: '2', name: '=1+1', price: 15000 }]
        servicio = new Servicio({ modelo: new ModeloMem({ reservas, canchas }) })
        http = await iniciarHttp('/api/reportes', new Router(servicio).router)
    })

    afterEach(async () => {
        try { await http?.cerrar() }
        finally { http = null; config.MODO_PERSISTENCIA = modoAnterior }
    })

    const descargar = (query = new URLSearchParams(periodo).toString(), token = 'token-admin') =>
        http.pedir({ path: `/reservas?${query}`, token })

    it('descarga un xlsx real con nombre, tipo y cache adecuados', async () => {
        const res = await descargar()
        assert.equal(res.status, 200)
        assert.equal(res.headers.get('content-type'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        assert.equal(res.headers.get('content-disposition'), 'attachment; filename="reservas_2027-01-01_2027-01-31.xlsx"')
        assert.equal(res.headers.get('cache-control'), 'no-store')
        const libro = await leerExcel(res.body)
        assert.deepEqual(libro.worksheets.map(h => h.name), ['Reservas', 'Resumen'])
    })

    it('incluye ambas fechas limite y excluye reservas fuera del periodo', async () => {
        const hoja = (await leerExcel((await descargar()).body)).getWorksheet('Reservas')
        assert.equal(hoja.rowCount, 5)
        assert.deepEqual(hoja.getColumn(1).values.slice(2), ['1', '3', '4', '2'])
    })

    it('calcula ocupacion e ingresos por cancha y el total sin contar cancelaciones', async () => {
        const libro = await leerExcel((await descargar()).body)
        const resumen = libro.getWorksheet('Resumen')
        const filas = resumen.getRows(2, 2)
        assert.deepEqual(filas.find(f => f.getCell(1).value === '1').values.slice(3), [3, 1, 2, 2.5, 30000])
        assert.deepEqual(filas.find(f => f.getCell(1).value === '2').values.slice(3), [1, 0, 1, 1, 15000])
        assert.equal(resumen.getCell('B4').value, 'TOTAL')
        assert.deepEqual(resumen.getRow(4).values.slice(3), [4, 1, 3, 3.5, 45000])
        assert.ok(resumen.getColumn(2).values.some(v => typeof v === 'string' && v.includes('tarifa actual')))
        const detalle = libro.getWorksheet('Reservas')
        assert.equal(detalle.getCell('I3').value, 0)
        assert.equal(detalle.getCell('K3').value, 0)
        assert.equal(detalle.getCell('I5').value, 1.5)
        assert.equal(detalle.getCell('K5').value, 18000)
        assert.equal(detalle.getCell('K5').type, ExcelJS.ValueType.Number)
    })

    it('preserva acentos y guarda los nombres como texto, no como formulas', async () => {
        const hoja = (await leerExcel((await descargar()).body)).getWorksheet('Reservas')
        assert.equal(hoja.getCell('D2').value, 'Pádel Ñ')
        assert.equal(hoja.getCell('D4').value, '=1+1')
        assert.equal(hoja.getCell('D4').type, ExcelJS.ValueType.String)
    })

    it('admite un periodo de un solo dia', async () => {
        const res = await descargar('desde=2027-01-01&hasta=2027-01-01')
        assert.equal(res.status, 200)
        assert.equal((await leerExcel(res.body)).getWorksheet('Reservas').rowCount, 2)
    })

    it('devuelve Excel valido y totales cero para un periodo vacio', async () => {
        const res = await descargar('desde=2028-02-29&hasta=2028-02-29')
        assert.equal(res.status, 200)
        const libro = await leerExcel(res.body)
        assert.equal(libro.getWorksheet('Reservas').rowCount, 1)
        assert.deepEqual(libro.getWorksheet('Resumen').getRow(2).values.slice(3), [0, 0, 0, 0, 0])
    })

    for (const [nombre, token, esperado] of [
        ['sin token', null, 401], ['token invalido', 'falso', 401], ['jugador', 'token-player', 403],
    ]) {
        it(`impide descargar como ${nombre}`, async () => {
            const res = await descargar(undefined, token)
            assert.equal(res.status, esperado)
            assert.equal(typeof res.body.error, 'string')
            assert.equal(res.headers.get('content-disposition'), null)
        })
    }

    for (const [nombre, query] of [
        ['sin parametros', ''], ['sin hasta', 'desde=2027-01-01'], ['sin desde', 'hasta=2027-01-31'],
        ['dia inexistente', 'desde=2027-02-29&hasta=2027-03-01'],
        ['orden invertido', 'desde=2027-01-31&hasta=2027-01-01'],
        ['formato incorrecto', 'desde=2027-1-01&hasta=2027-01-31'],
        ['mes inexistente', 'desde=2027-13-01&hasta=2027-13-31'],
        ['fecha con hora', 'desde=2027-01-01T00:00:00Z&hasta=2027-01-31'],
        ['parametro repetido', 'desde=2027-01-01&desde=2027-01-02&hasta=2027-01-31'],
        ['parametro extra', 'desde=2027-01-01&hasta=2027-01-31&extra=1'],
    ]) {
        it(`responde 400 ante ${nombre}`, async () => {
            const res = await descargar(query)
            assert.equal(res.status, 400)
            assert.match(res.body.error, /YYYY-MM-DD/)
            assert.equal(res.headers.get('content-disposition'), null)
        })
    }

    for (const [nombre, cambio] of [
        ['horario invalido', { start_time: '25:00' }], ['duracion negativa', { end_time: '17:00' }],
        ['estado desconocido', { status: 'desconocido' }],
    ]) {
        it(`rechaza datos corruptos: ${nombre}`, async () => {
            const modelo = new ModeloMem({
                reservas: [{ id: '1', court_id: '1', reservation_date: '2027-01-01', start_time: '18:00', end_time: '19:00', status: 'active', ...cambio }],
                canchas: [{ id: '1', name: 'Cancha', price: 12000 }],
            })
            await assert.rejects(new Servicio({ modelo }).generarReservas(periodo), /invalido|invalida/)
        })
    }
})

describe('registro de reportes en Server', () => {
    it('registra el endpoint y genera un reporte MEM vacio sin dependencias externas', async () => {
        const anterior = config.MODO_PERSISTENCIA
        config.MODO_PERSISTENCIA = 'MEM'
        const server = new Server(0)
        try {
            const listener = await server.start()
            const res = await fetch(`http://127.0.0.1:${listener.address().port}/api/reportes/reservas?desde=2027-01-01&hasta=2027-01-31`,
                { headers: { Authorization: 'Bearer token-admin' } })
            assert.equal(res.status, 200)
            const libro = await leerExcel(Buffer.from(await res.arrayBuffer()))
            assert.equal(libro.getWorksheet('Resumen').getCell('G2').value, 0)
        }
        finally {
            try { await server.stop() }
            finally { config.MODO_PERSISTENCIA = anterior }
        }
    })
})
