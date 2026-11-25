import { afterEach, mock, test } from 'node:test'
import assert from 'node:assert/strict'
import { descargarReporteReservas } from '../src/services/reportesService.js'

const datos = { desde: '2026-11-01', hasta: '2026-11-25', token: 'token-de-prueba' }
const tipoExcel = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
afterEach(() => mock.restoreAll())

test('envia el token de sesion y el periodo, y devuelve el Excel con nombre de descarga', async () => {
  const pedir = mock.method(globalThis, 'fetch', async () => new Response('contenido-binario', {
    status: 200, headers: { 'Content-Type': tipoExcel },
  }))
  const res = await descargarReporteReservas(datos)
  assert.equal(pedir.mock.calls[0].arguments[0], '/api/reportes/reservas?desde=2026-11-01&hasta=2026-11-25')
  assert.equal(pedir.mock.calls[0].arguments[1].headers.Authorization, 'Bearer token-de-prueba')
  assert.equal(res.nombre, 'reservas_2026-11-01_2026-11-25.xlsx')
  assert.equal(await res.archivo.text(), 'contenido-binario')
})

for (const [nombre, cambio] of [
  ['fecha ausente', { desde: '' }], ['fecha inexistente', { desde: '2026-02-30' }],
  ['formato invalido', { desde: '01/11/2026' }], ['periodo invertido', { hasta: '2026-10-31' }],
]) {
  test(`rechaza ${nombre} antes de consultar al servidor`, async () => {
    const pedir = mock.method(globalThis, 'fetch', async () => { throw new Error('No debe llamarse') })
    await assert.rejects(descargarReporteReservas({ ...datos, ...cambio }), /Elegí fechas válidas/)
    assert.equal(pedir.mock.calls.length, 0)
  })
}

test('rechaza una sesion sin token sin hacer la descarga', async () => {
  const pedir = mock.method(globalThis, 'fetch', async () => { throw new Error('No debe llamarse') })
  await assert.rejects(descargarReporteReservas({ ...datos, token: '' }), /sesión venció/)
  assert.equal(pedir.mock.calls.length, 0)
})

for (const [status, mensaje] of [[401, /sesión venció/], [403, /Solo los administradores/]]) {
  test(`informa el rechazo ${status} del backend`, async () => {
    mock.method(globalThis, 'fetch', async () => new Response('{}', { status }))
    await assert.rejects(descargarReporteReservas(datos), mensaje)
  })
}

test('muestra el error de validacion del periodo devuelto por el servidor', async () => {
  mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Periodo invalido' }, { status: 400 }))
  await assert.rejects(descargarReporteReservas(datos), /Periodo invalido/)
})

test('maneja un fallo del proxy sin intentar guardar HTML como Excel', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('<html>Error</html>', { status: 502 }))
  await assert.rejects(descargarReporteReservas(datos), /No se pudo generar/)
})

test('rechaza una respuesta exitosa que no contiene un Excel', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('<html>Vite</html>', {
    status: 200, headers: { 'Content-Type': 'text/html' },
  }))
  await assert.rejects(descargarReporteReservas(datos), /no devolvió un archivo Excel/)
})

test('explica un fallo de conexion sin exponer detalles internos', async () => {
  mock.method(globalThis, 'fetch', async () => { throw new Error('Detalles internos del transporte') })
  await assert.rejects(descargarReporteReservas(datos), /No se pudo conectar con el servidor/)
})
