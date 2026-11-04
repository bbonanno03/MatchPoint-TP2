<template>
  <div class="bg-surface-card border border-surface-border rounded-card shadow-flat p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:shadow-hover transition-all duration-200">
    
    <div class="flex items-start space-x-4">
      <div class="bg-green-50 text-brand p-3 rounded-btn text-2xl hidden sm:block">
        ⚽
      </div>
      <div>
        <h3 class="text-card-title font-bold text-text-main leading-tight">
          {{ reservation.courts?.name || reservation.courtName || 'Cancha' }}
        </h3>
        <p class="text-text-body text-text-muted mt-0.5">
          Club: <span class="font-semibold text-text-main">{{ reservation.courts?.club || reservation.clubName || 'Club' }}</span>
        </p>
        <p class="text-text-body text-text-muted mt-0.5">
          Deporte: <span class="font-semibold text-text-main">{{ reservation.courts?.sport || reservation.sport || 'No especificado' }}</span>
        </p>
        <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-text-small font-medium text-text-muted">
          <span>📅 {{ formatDate(reservation.reservation_date || reservation.date) }}</span>
          <span>⏰ {{ cleanTime(reservation.start_time || reservation.time) }} - {{ cleanTime(reservation.end_time || reservation.endTime) }} hs</span>
          <span v-if="reservation.created_at || reservation.createdAt" class="text-text-small">
            Reservado el {{ formatDate(reservation.created_at || reservation.createdAt) }}
          </span>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between md:justify-end md:space-x-6 pt-3 md:pt-0 border-t md:border-t-0 border-surface-border">
      <div>
        <span 
          v-if="reservation.status === 'cancelled'" 
          class="px-3 py-1 text-text-small font-bold rounded-full bg-red-50 text-status-error border border-red-200 uppercase tracking-wider"
        >
          Cancelada
        </span>
        <span 
          v-else-if="isExpired" 
          class="px-3 py-1 text-text-small font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider"
        >
          Finalizada
        </span>
        <span 
          v-else-if="reservation.status === 'active' || reservation.status === 'confirmed'" 
          class="px-3 py-1 text-text-small font-bold rounded-full bg-green-50 text-status-success border border-green-200 uppercase tracking-wider"
        >
          Activa
        </span>
        <span 
          v-else-if="reservation.status === 'pending'" 
          class="px-3 py-1 text-text-small font-bold rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider"
        >
          Pendiente
        </span>
      </div>

      <button 
        v-if="!isCancelled && reservation.status !== 'cancelled' && !isExpired"
        @click="$emit('cancel', reservation.id)"
        class="text-text-body font-semibold text-text-muted hover:text-status-error border border-surface-border hover:border-red-200 hover:bg-red-50 px-4 py-2 rounded-btn transition-colors duration-200 cursor-pointer"
      >
        Cancelar
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  reservation: {
    type: Object,
    required: true
  },
  isCancelled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['cancel'])

const isExpired = computed(() => {
  const rDate = props.reservation.reservation_date || props.reservation.date
  const rTime = props.reservation.end_time || props.reservation.endTime
  
  if (!rDate || !rTime) return false
  
  const now = new Date()
  const nowYear = now.getFullYear()
  const nowMonth = String(now.getMonth() + 1).padStart(2, "0")
  const nowDay = String(now.getDate()).padStart(2, "0")
  const nowHours = String(now.getHours()).padStart(2, "0")
  const nowMinutes = String(now.getMinutes()).padStart(2, "0")
  
  const currentNumeric = Number(`${nowYear}${nowMonth}${nowDay}${nowHours}${nowMinutes}`)
  
  const [resYear, resMonth, resDay] = rDate.split("-")
  const timeParts = rTime.split(":")
  const resHours = String(timeParts[0]).padStart(2, "0")
  const resMinutes = String(timeParts[1]).padStart(2, "0")
  
  const reservationNumeric = Number(`${resYear}${resMonth}${resDay}${resHours}${resMinutes}`)
  
  return reservationNumeric <= currentNumeric
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

function cleanTime(timeStr) {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`
  }
  return timeStr
}
</script>