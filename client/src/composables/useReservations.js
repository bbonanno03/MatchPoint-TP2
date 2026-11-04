import { ref, computed } from 'vue'
import { useReservationsStore } from '../stores/reservations'
import { useAuthStore } from '../stores/auth'


export function useReservations() {
  const reservationsStore = useReservationsStore()
  const authStore = useAuthStore()

  const loading = computed(() => reservationsStore.loading)
  const error = computed(() => reservationsStore.error)


  const createReservation = async (courtId, courtName, clubName, date, time) => {
    if (!authStore.user) {
      throw new Error('Debes estar autenticado para reservar')
    }

    return await reservationsStore.addReservation(
      authStore.user.id,
      courtId,
      courtName,
      clubName,
      date,
      time
    )
  }


  const fetchUserReservations = async () => {
    return await reservationsStore.fetchUserReservations()
  }


  const fetchActiveReservations = async () => {
    return reservationsStore.myActiveReservations
  }


  const cancelReservation = async (reservationId, date, time) => {
    return await reservationsStore.cancelReservation(reservationId, date, time)
  }


  const fetchPolicies = async () => {
    // TODO: Implementar si es necesario
    return null
  }

  return {

    loading,
    error,

    createReservation,
    fetchUserReservations,
    fetchActiveReservations,
    cancelReservation,
    fetchPolicies,

    userReservations: computed(() => reservationsStore.myReservations),
    activeReservations: computed(() => reservationsStore.myActiveReservations),
    cancelledReservations: computed(
      () => reservationsStore.myCancelledReservations
    ),
    activeReservationCount: computed(
      () => reservationsStore.activeReservationCount
    )
  }
}

