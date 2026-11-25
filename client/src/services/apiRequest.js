export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  let respuesta
  try {
    respuesta = await fetch(`/api${path}`, {
      method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor. Intentá nuevamente.')
  }
  if (respuesta.status === 204) return null
  let datos
  try { datos = await respuesta.json() } catch {
    throw new Error('El servidor no devolvió una respuesta válida. Intentá nuevamente.')
  }
  if (!respuesta.ok) {
    const mensaje = respuesta.status === 401 ? 'Tu sesión venció. Iniciá sesión nuevamente.'
      : datos?.error || 'No se pudo completar la operación.'
    throw Object.assign(new Error(mensaje), { status: respuesta.status, code: datos?.code })
  }
  return datos
}
