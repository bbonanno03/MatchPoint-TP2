import { apiAutenticada } from './apiClient.js'
import { apiRequest } from './apiRequest.js'

// Identidad, duracion, estado y politicas se resuelven en el servidor.
export const createReservation = ({ courtId, reservationDate, startTime }) => apiAutenticada('/reservas', {
  method: 'POST', body: { court_id: courtId, reservation_date: reservationDate, start_time: startTime },
})

export async function getUserReservations(userId) {
  const reservas = await apiAutenticada('/reservas')
  return userId ? reservas.filter(r => r.user_id === userId) : reservas
}

export const getAllReservations = () => apiAutenticada('/reservas')
export const cancelReservation = id => apiAutenticada(`/reservas/${encodeURIComponent(id)}`, { method: 'DELETE' })
export const getPolicies = () => apiRequest('/politicas')

export async function getActiveReservations(userId) {
  return (await getUserReservations(userId)).filter(r => ['active', 'confirmed'].includes(r.status) &&
    new Date(`${r.reservation_date}T${r.end_time.slice(0, 5)}:00`) > new Date())
}
export const getActiveReservationCount = async userId => (await getActiveReservations(userId)).length
