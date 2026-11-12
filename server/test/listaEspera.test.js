import assert from 'node:assert/strict'
import config from '../config.js'
import ModeloMem from '../modelo/DAO/listaEspera/listaEsperaMem.js'
import Servicio from '../servicio/listaEspera.js'
import Router from '../router/listaEspera.js'
import { iniciarHttp } from './helpers/http.js'

describe('lista de espera por HTTP (MEM)', () => {
    const turno = { court_id: '1', reservation_date: '2027-01-20', start_time: '18:00' }
    let http, modoAnterior

    beforeEach(async () => {
        modoAnterior = config.MODO_PERSISTENCIA
        config.MODO_PERSISTENCIA = 'MEM'
        const reservas = [
            { ...turno, start_time: '18:00:00', status: 'active' },
            { ...turno, start_time: '19:00', status: 'cancelled' },
            { ...turno, start_time: '20:00', status: 'confirmed' },
        ]
        http = await iniciarHttp('/api/lista-espera', new Router(new Servicio({ modelo: new ModeloMem(reservas), tipo: 'MEM' })).router)
    })

    afterEach(async () => {
        try { await http?.cerrar() }
        finally { http = null; config.MODO_PERSISTENCIA = modoAnterior }
    })

    const anotarse = body => http.pedir({ method: 'POST', body })

    it('anota en un turno ocupado y asigna el usuario autenticado', async () => {
        const res = await anotarse(turno)
        assert.equal(res.status, 201)
        assert.equal(res.body.user_id, 'u2')
        assert.equal(res.body.court_id, turno.court_id)
        assert.equal(res.body.reservation_date, turno.reservation_date)
        assert.equal(res.body.start_time, turno.start_time)
        assert.match(res.body.id, /^[\da-f-]{36}$/)
        assert.ok(Number.isFinite(Date.parse(res.body.created_at)))
    })

    it('considera ocupadas las reservas confirmed', async () => {
        assert.equal((await anotarse({ ...turno, start_time: '20:00' })).status, 201)
    })

    it('consulta solamente las propias, incluso si quien consulta es admin', async () => {
        const alta = await anotarse(turno)
        const propias = await http.pedir()
        assert.equal(propias.status, 200)
        assert.deepEqual(propias.body, [alta.body])
        assert.deepEqual((await http.pedir({ token: 'token-admin' })).body, [])
    })

    it('permite salirse y volver a anotarse', async () => {
        const alta = await anotarse(turno)
        const baja = await http.pedir({ method: 'DELETE', path: `/${alta.body.id}` })
        assert.equal(baja.status, 204)
        assert.equal(baja.body, null)
        assert.deepEqual((await http.pedir()).body, [])
        assert.equal((await anotarse(turno)).status, 201)
    })

    it('rechaza anotarse dos veces sin duplicar la inscripcion', async () => {
        await anotarse(turno)
        const duplicada = await anotarse(turno)
        assert.equal(duplicada.status, 409)
        assert.match(duplicada.body.error, /Ya estas/)
        assert.equal((await http.pedir()).body.length, 1)
    })

    it('protege tambien dos altas simultaneas del mismo usuario y turno', async () => {
        const respuestas = await Promise.all([anotarse(turno), anotarse(turno)])
        assert.deepEqual(respuestas.map(r => r.status).sort(), [201, 409])
        assert.equal((await http.pedir()).body.length, 1)
    })

    for (const [nombre, start_time] of [['libre', '17:00'], ['con reserva cancelada', '19:00']]) {
        it(`rechaza anotarse en un turno ${nombre}`, async () => {
            const res = await anotarse({ ...turno, start_time })
            assert.equal(res.status, 409)
            assert.match(res.body.error, /libre/)
            assert.deepEqual((await http.pedir()).body, [])
        })
    }

    it('rechaza una cancha inexistente', async () => {
        assert.equal((await anotarse({ ...turno, court_id: '99' })).status, 404)
    })

    it('impide borrar una inscripcion ajena sin eliminarla', async () => {
        const alta = await anotarse(turno)
        const res = await http.pedir({ method: 'DELETE', path: `/${alta.body.id}`, token: 'token-admin' })
        assert.equal(res.status, 404)
        assert.equal((await http.pedir()).body.length, 1)
    })

    it('responde 404 al borrar por segunda vez y 400 ante un id invalido', async () => {
        const alta = await anotarse(turno)
        await http.pedir({ method: 'DELETE', path: `/${alta.body.id}` })
        assert.equal((await http.pedir({ method: 'DELETE', path: `/${alta.body.id}` })).status, 404)
        assert.equal((await http.pedir({ method: 'DELETE', path: '/invalido' })).status, 400)
    })

    for (const method of ['GET', 'POST', 'DELETE']) {
        for (const token of [null, 'token-falso']) {
            it(`exige autenticacion en ${method} con token ${token}`, async () => {
                assert.equal((await http.pedir({ method, token, body: method === 'POST' ? turno : undefined,
                    path: method === 'DELETE' ? '/00000000-0000-4000-8000-000000000001' : '' })).status, 401)
            })
        }
    }

    for (const [nombre, body] of [
        ['sin body', undefined], ['body nulo', null], ['sin campos', {}],
        ['usuario inyectado', { ...turno, user_id: 'u1' }],
        ['fecha inexistente', { ...turno, reservation_date: '2027-02-29' }],
        ['mes invalido', { ...turno, reservation_date: '2027-13-01' }],
        ['hora invalida', { ...turno, start_time: '24:00' }],
        ['id numerico', { ...turno, court_id: 1 }],
    ]) {
        it(`valida el alta: ${nombre}`, async () => {
            assert.equal((await anotarse(body)).status, 400)
            assert.deepEqual((await http.pedir()).body, [])
        })
    }
})
