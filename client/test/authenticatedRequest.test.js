import { test } from 'node:test'
import assert from 'node:assert/strict'
import { crearApiAutenticada } from '../src/services/authenticatedRequest.js'
const sesion = (token, expires_at) => ({ data: { session: { access_token: token, expires_at } }, error: null })

test('usa el token actual sin renovar una sesion vigente', async () => {
  const auth = { getSession: async () => sesion('actual'), refreshSession: async () => { throw Error('No debe renovar') } }
  const pedir = crearApiAutenticada(auth, async (_, opciones) => opciones)
  assert.equal((await pedir('/reservas')).token, 'actual')
})
test('renueva antes de usar un token vencido', async () => {
  const auth = { getSession: async () => sesion('viejo', 1), refreshSession: async () => sesion('nuevo') }
  assert.equal(await crearApiAutenticada(auth, async (_, o) => o.token)('/reservas'), 'nuevo')
})
test('reintenta una vez un rechazo de token antes de ejecutar el POST', async () => {
  const tokens = []
  const pedir = crearApiAutenticada({ getSession: async () => sesion('viejo'), refreshSession: async () => sesion('nuevo') }, async (_, o) => {
    tokens.push(o.token)
    if (o.token === 'viejo') throw Object.assign(Error('Token invalido'), { status: 401, code: 'TOKEN_INVALIDO' })
    assert.deepEqual(o.body, { court_id: '1' })
    return 'creada'
  })
  assert.equal(await pedir('/reservas', { method: 'POST', body: { court_id: '1' } }), 'creada')
  assert.deepEqual(tokens, ['viejo', 'nuevo'])
})
for (const [nombre, error] of [
  ['configuracion MEM', Object.assign(Error('Configurar Supabase'), { status: 503, code: 'API_MODO_MEM' })],
  ['usuario inactivo', Object.assign(Error('Usuario deshabilitado'), { status: 403 })],
  ['fallo de red', Error('Conexion perdida')],
]) test(`no repite el POST ni renueva ante ${nombre}`, async () => {
  let llamadas = 0
  const pedir = crearApiAutenticada({ getSession: async () => sesion('actual'), refreshSession: async () => { throw Error('No debe renovar') } }, async () => { llamadas++; throw error })
  await assert.rejects(pedir('/reservas', { method: 'POST' }), e => e === error)
  assert.equal(llamadas, 1)
})
test('si la renovacion falla, pide iniciar sesion y no manda otro POST', async () => {
  let llamadas = 0
  const pedir = crearApiAutenticada({ getSession: async () => sesion('viejo'), refreshSession: async () => ({ error: Error('vencida') }) }, async () => { llamadas++; throw Object.assign(Error('Token'), { status: 401 }) })
  await assert.rejects(pedir('/reservas'), /sesión venció/)
  assert.equal(llamadas, 1)
})
test('no reintenta indefinidamente si el token renovado tambien es rechazado', async () => {
  let llamadas = 0, renovaciones = 0
  const pedir = crearApiAutenticada({ getSession: async () => sesion('viejo'), refreshSession: async () => { renovaciones++; return sesion('nuevo') } }, async () => { llamadas++; throw Object.assign(Error('Token'), { status: 401 }) })
  await assert.rejects(pedir('/reservas'))
  assert.equal(llamadas, 2); assert.equal(renovaciones, 1)
})
