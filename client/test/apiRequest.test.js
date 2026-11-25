import { test, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { apiRequest } from '../src/services/apiRequest.js'
afterEach(() => mock.restoreAll())

test('envia POST de reserva con Bearer y JSON y devuelve la reserva', async () => {
  const cuerpo = { court_id: '1', reservation_date: '2027-01-20', start_time: '18:00' }
  const pedir = mock.method(globalThis, 'fetch', async () => Response.json({ ...cuerpo, id: '1', user_id: 'u2' }, { status: 201 }))
  const reserva = await apiRequest('/reservas', { method: 'POST', body: cuerpo, token: 'sesion' })
  const [url, opciones] = pedir.mock.calls[0].arguments
  assert.equal(url, '/api/reservas')
  assert.equal(opciones.method, 'POST')
  assert.equal(opciones.headers.Authorization, 'Bearer sesion')
  assert.deepEqual(JSON.parse(opciones.body), cuerpo)
  assert.equal(reserva.user_id, 'u2')
})

test('conserva el codigo de conflicto para ofrecer lista de espera solo ante un turno ocupado', async () => {
  mock.method(globalThis, 'fetch', async () => Response.json({ error: 'El turno ya esta ocupado', code: 'TURNO_OCUPADO' }, { status: 409 }))
  await assert.rejects(apiRequest('/reservas', { method: 'POST', token: 'sesion' }), e => e.status === 409 && e.code === 'TURNO_OCUPADO')
})

test('no confunde el limite de reservas con turno ocupado', async () => {
  mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Limite de reservas' }, { status: 409 }))
  await assert.rejects(apiRequest('/reservas'), e => e.status === 409 && e.code === undefined)
})

test('interpreta 204 de salir de la espera sin intentar leer JSON', async () => {
  mock.method(globalThis, 'fetch', async () => new Response(null, { status: 204 }))
  assert.equal(await apiRequest('/lista-espera/id', { method: 'DELETE', token: 'sesion' }), null)
})

test('explica una sesion vencida', async () => {
  mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Token invalido' }, { status: 401 }))
  await assert.rejects(apiRequest('/reservas'), /sesión venció/)
})

test('rechaza una pagina HTML del proxy en lugar de devolverla como lista', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('<html>error</html>'))
  await assert.rejects(apiRequest('/lista-espera'), /respuesta válida/)
})
