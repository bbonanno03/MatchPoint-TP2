<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    <div class="mb-8">
      <h1 class="text-title font-black text-text-main font-sans tracking-tight">
        Mis Reservas
      </h1>
      <p class="text-text-body text-text-muted mt-1">
        Administrá tus turnos agendados y revisá el estado de tus partidos.
      </p>
    </div>

    <div v-if="!authStore.user" class="bg-surface-card border border-surface-border rounded-card p-12 text-center shadow-flat max-w-2xl mx-auto mt-12">
      <span class="text-5xl block mb-4">🔒</span>
      <h3 class="text-card-title font-bold text-text-main">Iniciá sesión para ver tus reservas</h3>
      <p class="text-text-body text-text-muted mt-2 max-w-sm mx-auto">
        Accedé a tu cuenta para revisar tus partidos activos, el historial de turnos jugados o gestionar tus cancelaciones.
      </p>
      <div class="flex justify-center gap-4 mt-6">
        <router-link 
          to="/login" 
          class="bg-brand hover:bg-brand-dark text-white font-bold px-6 py-2.5 rounded-btn shadow-flat transition-colors text-text-body"
        >
          Ingresar
        </router-link>
        <router-link 
          to="/register" 
          class="border border-surface-border text-text-main hover:bg-surface-bg font-bold px-6 py-2.5 rounded-btn transition-colors text-text-body"
        >
          Registrarse
        </router-link>
      </div>
    </div>

    <div v-else>
      <div class="flex gap-4 mb-6 border-b border-surface-border">
        <button
          @click="activeTab = 'active'"
          :class="[
            'px-4 py-2 text-text-body font-semibold border-b-2 transition-colors',
            activeTab === 'active'
              ? 'border-brand text-brand'
              : 'border-transparent text-text-muted hover:text-text-main'
          ]"
        >
          Activas ({{ reservationsStore.myActiveReservations.length }})
        </button>
        <button
          @click="activeTab = 'cancelled'"
          :class="[
            'px-4 py-2 text-text-body font-semibold border-b-2 transition-colors',
            activeTab === 'cancelled'
              ? 'border-brand text-brand'
              : 'border-transparent text-text-muted hover:text-text-main'
          ]"
        >
          Canceladas ({{ reservationsStore.myCancelledReservations.length }})
        </button>
        <button
          @click="activeTab = 'history'"
          :class="[
            'px-4 py-2 text-text-body font-semibold border-b-2 transition-colors',
            activeTab === 'history'
              ? 'border-brand text-brand'
              : 'border-transparent text-text-muted hover:text-text-main'
          ]"
        >
          Historial ({{ reservationsStore.myHistoryReservations.length }})
        </button>
      </div>

      <div 
        v-if="!reservationsStore.myReservations.length" 
        class="bg-surface-card border border-surface-border rounded-card p-12 text-center shadow-flat"
      >
        <span class="text-5xl block mb-4">📅</span>
        <h3 class="text-card-title font-bold text-text-main">No tenés reservas</h3>
        <p class="text-text-body text-text-muted mt-1 max-w-sm mx-auto">
          ¿Te falta fútbol? Revisá las canchas disponibles y hacé tu primera reserva.
        </p>
        <router-link 
          to="/canchas" 
          class="inline-block mt-5 bg-brand hover:bg-brand-dark text-white font-bold px-5 py-2.5 rounded-btn shadow-flat transition-colors text-text-body"
        >
          Ver Canchas Disponibles
        </router-link>
      </div>

      <div v-else-if="activeTab === 'active'" class="space-y-4">
        <div 
          v-if="!reservationsStore.myActiveReservations.length"
          class="bg-surface-card border border-surface-border rounded-card p-8 text-center"
        >
          <p class="text-text-body text-text-muted">No tenés reservas activas en este momento.</p>
        </div>
        <ReservationCard
          v-for="reservation in reservationsStore.myActiveReservations"
          :key="reservation.id"
          :reservation="reservation"
          @cancel="handleCancel"
        />
      </div>

      <div v-else-if="activeTab === 'cancelled'" class="space-y-4">
        <div 
          v-if="!reservationsStore.myCancelledReservations.length"
          class="bg-surface-card border border-surface-border rounded-card p-8 text-center"
        >
          <p class="text-text-body text-text-muted">No tenés reservas canceladas.</p>
        </div>
        <ReservationCard
          v-for="reservation in reservationsStore.myCancelledReservations"
          :key="reservation.id"
          :reservation="reservation"
          :is-cancelled="true"
        />
      </div>

      <div v-else-if="activeTab === 'history'" class="space-y-4">
        <div 
          v-if="!reservationsStore.myHistoryReservations.length"
          class="bg-surface-card border border-surface-border rounded-card p-8 text-center"
        >
          <p class="text-text-body text-text-muted">No hay reservas en el historial.</p>
        </div>
        <ReservationCard
          v-for="reservation in reservationsStore.myHistoryReservations"
          :key="reservation.id"
          :reservation="reservation"
          :is-cancelled="false"
        />
      </div>
    </div>

    <div
      v-if="pendingCancel"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4"
    >
      <div class="w-full max-w-md bg-white rounded-card border border-surface-border shadow-xl p-6">
        <h2 class="text-title font-bold text-text-main mb-4">Confirmar cancelación</h2>
        <p class="text-text-body text-text-muted mb-6">
          ¿Querés cancelar la reserva del
          <strong>{{ formatDate(pendingCancel.reservation_date || pendingCancel.date) }}</strong>
          a las
          <strong>{{ pendingCancel.start_time || pendingCancel.time }}</strong>?
        </p>
        <div class="flex justify-end gap-3">
          <button
            @click="cancelCancel"
            class="text-text-body font-semibold text-text-muted border border-surface-border hover:bg-surface-bg px-4 py-2 rounded-btn transition-colors"
          >
            Volver
          </button>
          <button
            @click="confirmCancel"
            class="bg-status-error hover:bg-red-600 text-white font-bold px-4 py-2 rounded-btn transition-colors"
          >
            Confirmar cancelación
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useReservationsStore } from '../stores/reservations'
import { useAuthStore } from '../stores/auth'
import { useAlertsStore } from '../stores/alerts'
import ReservationCard from '../components/ReservationCard.vue'

const reservationsStore = useReservationsStore()
const authStore = useAuthStore()
const alertsStore = useAlertsStore()
const activeTab = ref('active')
const pendingCancel = ref(null)

onMounted(async () => {
  if (authStore.user) {
    await reservationsStore.fetchUserReservations()
  }
})

function formatDate(dateStr) {
  if (!dateStr) return ''

  if (dateStr.includes('-') && !dateStr.includes('T')) {
    const [year, month, day] = dateStr.split('-')
    const date = new Date(year, month - 1, day)
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    return date.toLocaleDateString('es-AR', options)
  }

  const date = new Date(dateStr)
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return date.toLocaleDateString('es-AR', options)
}

function handleCancel(reservationId) {
  const reservation = reservationsStore.myReservations.find(
    (r) => r.id === reservationId
  )

  if (!reservation) {
    alertsStore.showAlert('No se encontró la reserva para cancelar.', 'error')
    return
  }

  pendingCancel.value = reservation
}

function cancelCancel() {
  pendingCancel.value = null
}

async function confirmCancel() {
  if (!pendingCancel.value) return

  const reservation = pendingCancel.value
  pendingCancel.value = null

  try {
    await reservationsStore.cancelReservation(
      reservation.id,
      reservation.reservation_date || reservation.date,
      reservation.start_time || reservation.time
    )
    alertsStore.showAlert('Reserva cancelada correctamente.', 'success')
  } catch (error) {
    alertsStore.showAlert(error.message || 'No se pudo cancelar la reserva.', 'error')
  }
}
</script>