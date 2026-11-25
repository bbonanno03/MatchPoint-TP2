import { afterEach, mock, test } from 'node:test'
import assert from 'node:assert/strict'
import { consultarClima } from '../src/services/climaService.js'

const consulta = { courtId: '2', fecha: '2026-12-02', hora: '18:00' }
const pronostico = {
  cancha: 'Tenis', techada: false, fecha: consulta.fecha, hora: consulta.hora,
  temperatura: 22, probabilidadLluvia: 10, viento: 12, recomendacion: 'Buen dia para jugar',
}
afterEach(() => mock.restoreAll())

test('consulta el turno exacto sin exigir token y devuelve las medidas', async () => {
  const pedir = mock.method(globalThis, 'fetch', async () => Response.json(pronostico))
  assert.deepEqual(await consultarClima(consulta), pronostico)
  assert.equal(pedir.mock.calls[0].arguments[0], '/api/canchas/2/clima?fecha=2026-12-02&hora=18%3A00')
  assert.equal(pedir.mock.calls[0].arguments[1].headers, undefined)
})

test('acepta el mensaje de cancha techada sin inventar medidas', async () => {
  const datos = { techada: true, fecha: consulta.fecha, hora: consulta.hora, recomendacion: 'La cancha es techada' }
  mock.method(globalThis, 'fetch', async () => Response.json(datos))
  const resultado = await consultarClima(consulta)
  assert.deepEqual(resultado, datos)
  assert.equal(resultado.temperatura, undefined)
})

test('codifica el identificador para no alterar la ruta', async () => {
  const pedir = mock.method(globalThis, 'fetch', async () => Response.json(pronostico))
  await consultarClima({ ...consulta, courtId: 'cancha/otra' })
  assert.match(pedir.mock.calls[0].arguments[0], /cancha%2Fotra\/clima/)
})

for (const [nombre, cambio] of [
  ['cancha vacia', { courtId: '' }], ['sin fecha', { fecha: '' }], ['fecha imposible', { fecha: '2026-02-30' }],
  ['fecha con hora', { fecha: '2026-12-02T00:00:00Z' }], ['sin horario', { hora: '' }], ['hora invalida', { hora: '24:00' }],
]) {
  test(`valida ${nombre} sin hacer peticiones`, async () => {
    const pedir = mock.method(globalThis, 'fetch', async () => { throw new Error('No debe consultar') })
    await assert.rejects(consultarClima({ ...consulta, ...cambio }), /fecha y un horario válidos/)
    assert.equal(pedir.mock.calls.length, 0)
  })
}

for (const [status, error, esperado] of [
  [400, 'Solo hay pronostico desde hoy hasta dentro de 16 dias', /16 dias/],
  [404, 'Cancha inexistente', /No se encontró la cancha/],
  [409, 'Sin latitud', /ubicación cargada/],
  [502, 'Detalle privado del proveedor', /No se pudo obtener el pronóstico/],
]) {
  test(`muestra un error util para HTTP ${status}`, async () => {
    mock.method(globalThis, 'fetch', async () => Response.json({ error }, { status }))
    await assert.rejects(consultarClima(consulta), esperado)
  })
}

test('maneja respuestas del proxy sin JSON', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('<html>Error</html>', { status: 502 }))
  await assert.rejects(consultarClima(consulta), /No se pudo obtener el pronóstico/)
})

test('maneja una conexion fallida sin exponer detalles tecnicos', async () => {
  mock.method(globalThis, 'fetch', async () => { throw new Error('Error de transporte') })
  await assert.rejects(consultarClima(consulta), /No se pudo conectar con el servidor/)
})

test('pasa la señal y permite cancelar una consulta anterior', async () => {
  const controller = new AbortController()
  const aborto = new DOMException('Consulta cancelada', 'AbortError')
  const pedir = mock.method(globalThis, 'fetch', async () => { controller.abort(); throw aborto })
  await assert.rejects(consultarClima({ ...consulta, signal: controller.signal }), e => e === aborto)
  assert.equal(pedir.mock.calls[0].arguments[1].signal, controller.signal)
})

for (const [nombre, cambios] of [
  ['medidas incompletas', { temperatura: null }], ['otro dia', { fecha: '2026-12-03' }],
  ['otra hora', { hora: '19:00' }], ['sin recomendacion', { recomendacion: null }],
]) {
  test(`no muestra un pronostico con ${nombre}`, async () => {
    mock.method(globalThis, 'fetch', async () => Response.json({ ...pronostico, ...cambios }))
    await assert.rejects(consultarClima(consulta), /pronóstico incompleto/)
  })
}
