import { apiAutenticada } from './apiClient.js'

export const obtenerPropias = () => apiAutenticada('/lista-espera')
export const anotarse = turno => apiAutenticada('/lista-espera', { method: 'POST', body: turno })
export const salirse = id => apiAutenticada(`/lista-espera/${encodeURIComponent(id)}`, { method: 'DELETE' })
