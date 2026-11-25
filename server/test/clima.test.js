import assert from 'assert'
import http from 'http'
import Server from '../server.js'
import config from '../config.js'
import Pronostico from '../modelo/Pronostico.js'
import ClimaOpenMeteo from '../servicio/clima/climaOpenMeteo.js'

const PORT = 8096
const URL = `http://localhost:${PORT}/api/canchas`

// Fecha dentro de "dias" dias, en formato YYYY-MM-DD
const fechaEn = dias => {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() + dias)
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

describe('clima', () => {

    describe('GET /api/canchas/:id/clima (clima falso en memoria)', () => {
        let server = null

        // SETUP: servidor en memoria y con el clima falso (sin internet)
        before(async () => {
            config.MODO_PERSISTENCIA = 'MEM'
            config.MODO_CLIMA = 'MEM'
            server = new Server(PORT)
            await server.start()
        })

        // TEAR DOWN
        after(async () => {
            await server.stop()
        })

        it('una cancha al aire libre devuelve el pronostico y la recomendacion', async () => {
            const res = await fetch(`${URL}/2/clima?fecha=${fechaEn(3)}&hora=19:00`)    // Cancha Tenis 1: al aire libre
            const body = await res.json()

            assert.strictEqual(res.status, 200)
            assert.strictEqual(body.techada, false)
            assert.strictEqual(body.temperatura, 22)
            assert.strictEqual(body.probabilidadLluvia, 10)
            assert.strictEqual(body.viento, 12)
            assert.strictEqual(body.recomendacion, 'Buen dia para jugar')
        })

        it('una cancha techada responde que el clima no aplica', async () => {
            const res = await fetch(`${URL}/1/clima?fecha=${fechaEn(3)}&hora=19:00`)    // Cancha Padel 1: techada
            const body = await res.json()

            assert.strictEqual(res.status, 200)
            assert.strictEqual(body.techada, true)
            assert.strictEqual(body.temperatura, undefined)
            assert.strictEqual(body.recomendacion, 'La cancha es techada: el clima no afecta el partido')
        })

        it('una cancha inexistente responde 404', async () => {
            const res = await fetch(`${URL}/999/clima?fecha=${fechaEn(3)}&hora=19:00`)
            assert.strictEqual(res.status, 404)
        })

        it('sin fecha responde 400', async () => {
            const res = await fetch(`${URL}/2/clima?hora=19:00`)
            assert.strictEqual(res.status, 400)
        })

        it('con una hora mal escrita responde 400', async () => {
            const res = await fetch(`${URL}/2/clima?fecha=${fechaEn(3)}&hora=7pm`)
            assert.strictEqual(res.status, 400)
        })

        it('una fecha a mas de 16 dias responde 400', async () => {
            const res = await fetch(`${URL}/2/clima?fecha=${fechaEn(20)}&hora=19:00`)
            const body = await res.json()

            assert.strictEqual(res.status, 400)
            assert.strictEqual(body.code, 'PRONOSTICO_NO_DISPONIBLE')
            assert.match(body.consultarDesde, /^\d{4}-\d{2}-\d{2}$/)
            assert.match(body.error, /Podes reservar igualmente/)
        })

        it('con una fecha que no existe (30 de febrero) responde 400', async () => {
            const res = await fetch(`${URL}/2/clima?fecha=2027-02-30&hora=19:00`)
            const body = await res.json()

            assert.strictEqual(res.status, 400)
            assert.strictEqual(body.error, 'La fecha no existe')
        })

        it('una fecha pasada responde 400', async () => {
            const res = await fetch(`${URL}/2/clima?fecha=${fechaEn(-2)}&hora=19:00`)
            assert.strictEqual(res.status, 400)
        })

        it('las rutas de canchas de Bruno siguen andando', async () => {
            const res = await fetch(`${URL}/2`)
            const body = await res.json()

            assert.strictEqual(res.status, 200)
            assert.strictEqual(body.name, 'Cancha Tenis 1')
        })
    })

    describe('recomendacion segun el pronostico', () => {
        it('con mucha probabilidad de lluvia recomienda una techada', () => {
            const pronostico = new Pronostico({ temperatura: 20, probabilidadLluvia: 80, viento: 10 })
            assert.strictEqual(pronostico.recomendacion(), 'Probable lluvia: mejor reservar una cancha techada')
        })

        it('con mucho viento avisa que puede complicar el juego', () => {
            const pronostico = new Pronostico({ temperatura: 20, probabilidadLluvia: 0, viento: 40 })
            assert.strictEqual(pronostico.recomendacion(), 'Mucho viento: puede complicar el juego')
        })

        it('con mucho calor recomienda llevar agua', () => {
            const pronostico = new Pronostico({ temperatura: 35, probabilidadLluvia: 0, viento: 5 })
            assert.strictEqual(pronostico.recomendacion(), 'Mucho calor: lleva agua y protector solar')
        })

        it('con frio recomienda abrigarse', () => {
            const pronostico = new Pronostico({ temperatura: 4, probabilidadLluvia: 0, viento: 5 })
            assert.strictEqual(pronostico.recomendacion(), 'Hace frio: veni abrigado')
        })
    })

    describe('Open-Meteo (con una API falsa local, sin internet)', () => {
        let apiFalsa = null
        let respuestaFalsa = null       // lo que contesta la API falsa en cada test

        before(done => {
            apiFalsa = http.createServer((req, res) => {
                res.writeHead(respuestaFalsa.status, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(respuestaFalsa.body))
            })
            apiFalsa.listen(8095, done)
        })

        after(done => {
            apiFalsa.close(done)
        })

        it('toma los datos de la hora del turno (19:30 usa el dato de las 19:00)', async () => {
            respuestaFalsa = {
                status: 200,
                body: {
                    hourly: {
                        time: ['2026-12-01T18:00', '2026-12-01T19:00', '2026-12-01T20:00'],
                        temperature_2m: [25, 24.5, 23],
                        precipitation_probability: [5, 60, 90],
                        wind_speed_10m: [10, 15, 20]
                    }
                }
            }
            const clima = new ClimaOpenMeteo('http://localhost:8095')
            const datos = await clima.obtenerPronostico({ latitude: -34.6, longitude: -58.5, fecha: '2026-12-01', hora: '19:30' })

            assert.deepStrictEqual(datos, { temperatura: 24.5, probabilidadLluvia: 60, viento: 15 })
        })

        it('si la API responde con error, tira un error 502', async () => {
            respuestaFalsa = { status: 500, body: { error: true } }
            const clima = new ClimaOpenMeteo('http://localhost:8095')

            await assert.rejects(
                clima.obtenerPronostico({ latitude: -34.6, longitude: -58.5, fecha: '2026-12-01', hora: '19:00' }),
                error => error.status == 502
            )
        })

        it('si la API esta caida (no responde), tira un error 502', async () => {
            const clima = new ClimaOpenMeteo('http://localhost:1')      // ahi no hay nada escuchando

            await assert.rejects(
                clima.obtenerPronostico({ latitude: -34.6, longitude: -58.5, fecha: '2026-12-01', hora: '19:00' }),
                error => error.status == 502
            )
        })
    })
})