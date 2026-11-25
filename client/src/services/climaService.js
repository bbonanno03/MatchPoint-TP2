export async function consultarClima({ courtId, fecha, hora, signal }) {
  const dia = typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)
    ? new Date(`${fecha}T00:00:00Z`) : null
  if (typeof courtId !== 'string' || !courtId.trim() || !dia || Number.isNaN(dia.getTime()) ||
      dia.toISOString().slice(0, 10) !== fecha || typeof hora !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
    throw new Error('Elegí una fecha y un horario válidos para consultar el clima.')
  }

  let respuesta
  try {
    respuesta = await fetch(`/api/canchas/${encodeURIComponent(courtId)}/clima?${new URLSearchParams({ fecha, hora })}`, { signal })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new Error('No se pudo conectar con el servidor. Intentá nuevamente.')
  }

  let datos
  try { datos = await respuesta.json() } catch {
    throw new Error('No se pudo obtener el pronóstico. Intentá nuevamente.')
  }
  if (!respuesta.ok) {
    if (respuesta.status === 400 && datos?.code === 'PRONOSTICO_NO_DISPONIBLE' &&
        /^\d{4}-\d{2}-\d{2}$/.test(datos.consultarDesde) && typeof datos.error === 'string') {
      return { disponible: false, fecha, hora, consultarDesde: datos.consultarDesde, recomendacion: datos.error }
    }
    if (respuesta.status === 400 && typeof datos?.error === 'string') throw new Error(datos.error)
    if (respuesta.status === 404) throw new Error('No se encontró la cancha.')
    if (respuesta.status === 409) throw new Error('La cancha no tiene una ubicación cargada para consultar el clima.')
    throw new Error('No se pudo obtener el pronóstico. Intentá nuevamente.')
  }

  if (typeof datos?.techada !== 'boolean' || typeof datos.recomendacion !== 'string' ||
      datos.fecha !== fecha || datos.hora !== hora ||
      (!datos.techada && !['temperatura', 'probabilidadLluvia', 'viento'].every(k => Number.isFinite(datos[k])))) {
    throw new Error('El servidor devolvió un pronóstico incompleto. Intentá nuevamente.')
  }
  return datos
}
