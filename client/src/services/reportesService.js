const fechaValida = valor => {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
  const fecha = new Date(`${valor}T00:00:00Z`)
  return !valor.startsWith('0000') && !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor
}

export async function descargarReporteReservas({ desde, hasta, token }) {
  if (!fechaValida(desde) || !fechaValida(hasta) || desde > hasta) {
    throw new Error('Elegí fechas válidas y verificá que Desde sea anterior o igual a Hasta.')
  }
  if (!token) throw new Error('Tu sesión venció. Iniciá sesión nuevamente.')

  let respuesta
  try {
    respuesta = await fetch(`/api/reportes/reservas?${new URLSearchParams({ desde, hasta })}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor. Intentá nuevamente.')
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401) throw new Error('Tu sesión venció. Iniciá sesión nuevamente.')
    if (respuesta.status === 403) throw new Error('Solo los administradores pueden exportar reportes.')
    let detalle
    try { detalle = await respuesta.json() } catch { /* El proxy puede devolver un error sin JSON. */ }
    throw new Error(respuesta.status === 400 && typeof detalle?.error === 'string'
      ? detalle.error : 'No se pudo generar el reporte. Intentá nuevamente.')
  }

  if (!respuesta.headers.get('content-type')?.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
    throw new Error('El servidor no devolvió un archivo Excel válido.')
  }
  return {
    archivo: await respuesta.blob(),
    nombre: `reservas_${desde}_${hasta}.xlsx`,
  }
}
