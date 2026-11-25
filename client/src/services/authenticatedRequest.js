import { apiRequest } from './apiRequest.js'

// Se inyecta Auth para probar renovacion y reintentos sin conectarse a Supabase.
export function crearApiAutenticada(auth, pedir = apiRequest) {
  let renovacion
  const renovar = () => {
    renovacion ||= Promise.resolve().then(() => auth.refreshSession()).finally(() => { renovacion = undefined })
    return renovacion
  }
  const tokenDe = resultado => {
    if (resultado.error || !resultado.data?.session?.access_token) {
      throw new Error('Tu sesión venció. Iniciá sesión nuevamente.')
    }
    return resultado.data.session.access_token
  }
  return async (path, opciones = {}) => {
    const actual = await auth.getSession()
    let token = tokenDe(actual)
    const vence = actual.data.session.expires_at
    if (vence && vence * 1000 <= Date.now() + 30000) token = tokenDe(await renovar())
    try {
      return await pedir(path, { ...opciones, token })
    } catch (e) {
      // Un 401 se produce antes de ejecutar la operacion. Nunca repetir un POST por error de red.
      if (e.status !== 401 || (e.code && e.code !== 'TOKEN_INVALIDO')) throw e
      token = tokenDe(await renovar())
      return pedir(path, { ...opciones, token })
    }
  }
}
