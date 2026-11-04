<template>
  <div class="bg-surface-card border border-surface-border rounded-card shadow-flat overflow-hidden hover:shadow-hover transition-all duration-200 flex flex-col justify-between">
    
    <div class="p-5">
      <div class="flex justify-between items-start mb-2">
        <h2 class="text-card-title font-bold text-text-main leading-tight">
          {{ court.name }}
        </h2>
        <span class="px-2.5 py-0.5 text-text-small font-bold rounded-full bg-green-50 text-status-success border border-green-100">
          {{ court.sport }}
        </span>
      </div>
      
      <p class="text-text-body text-text-muted">
        Club: <span class="font-semibold text-text-main">{{ court.club }}</span>
      </p>

      <!-- Visualización del promedio de Estrellas -->
      <div class="flex items-center gap-1.5 mt-1.5">
        <RatingStars :model-value="court.average_rating || 0" readonly />
        <span class="text-text-small font-black text-text-main mt-0.5">
          {{ court.average_rating ? court.average_rating.toFixed(1) : '0.0' }}
        </span>
        <span class="text-text-small text-text-muted mt-0.5">
          ( {{ court.total_reviews || 0 }} )
        </span>
      </div>

      <p class="text-text-body text-brand font-bold mt-2 text-lg">
        ${{ court.price }} <span class="text-text-small font-medium text-text-muted">/ hora</span>
      </p>
      
      <div v-if="court.features" class="flex flex-wrap gap-1.5 mt-3">
        <span 
          v-for="feat in court.features" 
          :key="feat" 
          class="bg-surface-bg text-text-muted border border-surface-border text-text-small px-2 py-0.5 rounded-btn"
        >
          {{ feat }}
        </span>
      </div>

      <div v-if="isBooking" class="mt-5 pt-4 border-t border-surface-border space-y-3 animation-fade-in">
        <div>
          <label class="block text-text-small font-bold text-text-main mb-1">Elegí el día:</label>
          <input 
            v-model="selectedDate" 
            type="date" 
            :min="today"
            class="w-full text-text-body border border-surface-border rounded-btn px-3 py-2 bg-surface-bg text-text-main focus:outline-none focus:border-brand"
          />
        </div>
        
        <div>
          <label class="block text-text-small font-bold text-text-main mb-1">Elegí el horario:</label>
          <select 
            v-model="selectedTime"
            class="w-full text-text-body border border-surface-border rounded-btn px-3 py-2 bg-surface-bg text-text-main focus:outline-none focus:border-brand"
          >
            <option value="" disabled>Seleccionar hora</option>
            <option v-for="hour in availableHours" :key="hour" :value="hour">{{ hour }} hs</option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="p-5 pt-0 flex flex-col gap-2">
      <div v-if="isBooking" class="grid grid-cols-2 gap-3">
        <button 
          @click="isBooking = false"
          class="text-text-body font-semibold text-text-muted border border-surface-border hover:bg-surface-bg py-2.5 rounded-btn transition-colors cursor-pointer text-center"
        >
          Volver
        </button>
        <button 
          @click="confirmBooking"
          :disabled="!selectedDate || !selectedTime || isSubmitting"
          class="bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:hover:bg-brand text-white font-bold py-2.5 rounded-btn shadow-flat transition-colors text-text-body cursor-pointer text-center"
        >
          {{ isSubmitting ? 'Confirmando...' : 'Confirmar' }}
        </button>
      </div>

      <div v-else class="flex flex-col gap-2">
        <button 
          @click="startBooking"
          class="w-full bg-brand hover:bg-brand-dark text-white font-bold py-2.5 rounded-btn shadow-flat transition-colors text-text-body cursor-pointer text-center"
        >
          Reservar Cancha
        </button>
        
        <button 
          @click="openReviewModal"
          class="w-full border border-surface-border text-text-muted hover:text-text-main hover:bg-surface-bg font-semibold py-2 rounded-btn transition-colors text-text-small cursor-pointer text-center block"
        >
          Calificar Cancha
        </button>
      </div>
    </div>

    <!-- Modal de Calificación -->
    <div v-if="showReviewModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4">
      <div class="w-full max-w-md bg-white rounded-card border border-surface-border shadow-xl p-6 text-left">
        <h2 class="text-title font-bold text-text-main mb-1">Calificar {{ court.name }}</h2>
        <p class="text-text-small text-text-muted mb-4">Compartí tu experiencia jugando en esta cancha.</p>
        
        <div class="mb-4">
          <label class="block text-text-small font-bold text-text-main mb-1">Tu puntuación</label>
          <RatingStars v-model="rating" />
        </div>

        <div class="mb-6">
          <label class="block text-text-small font-bold text-text-main mb-1">Comentario (opcional)</label>
          <textarea 
            v-model="comment" 
            rows="3" 
            placeholder="¿Qué tal estaba el piso, la iluminación o la red?..."
            class="w-full text-text-body border border-surface-border rounded-btn p-3 bg-surface-bg text-text-main focus:outline-none focus:border-brand transition-colors placeholder-text-muted resize-none"
          ></textarea>
        </div>

        <div class="flex justify-end gap-3">
          <button
            @click="closeReviewModal"
            class="text-text-body font-semibold text-text-muted border border-surface-border hover:bg-surface-bg px-4 py-2 rounded-btn transition-colors"
          >
            Cancelar
          </button>
          <button
            @click="submitReview"
            :disabled="rating === 0 || isSubmittingReview"
            class="bg-brand hover:bg-brand-dark disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-btn transition-colors"
          >
            {{ isSubmittingReview ? 'Enviando...' : 'Enviar calificación' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue' 
import { useRouter } from 'vue-router'
import { useReservationsStore } from '../stores/reservations'
import { useCourtsStore } from '../stores/courts'
import { useAuthStore } from '../stores/auth'
import { useAlertsStore } from '../stores/alerts.js'
import RatingStars from './RatingStars.vue'

const props = defineProps({
  court: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const reservationsStore = useReservationsStore()
const courtsStore = useCourtsStore()
  const authStore = useAuthStore()
const alertsStore = useAlertsStore() 

const isBooking = ref(false)
const selectedDate = ref('')
const selectedTime = ref('')
const isSubmitting = ref(false)

// Estados para el modal de Review
const showReviewModal = ref(false)
const rating = ref(0)
const comment = ref('')
const isSubmittingReview = ref(false)

const now = new Date()
const today = computed(() => {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

const masterHours = ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00']

const availableHours = computed(() => {
  if (!selectedDate.value || selectedDate.value > today.value) {
    return masterHours
  }

  if (selectedDate.value === today.value) {
    const currentHour = now.getHours() 
    return masterHours.filter(hourStr => {
      const [hourNum] = hourStr.split(':').map(Number)
      return hourNum > currentHour
    })
  }

  return []
})

function startBooking() {
  if (!authStore.user) {
    alertsStore.showAlert('Tenés que iniciar sesión para poder reservar una cancha.', 'error')
    router.push('/login')
    return
  }
  isBooking.value = true
}

async function confirmBooking() {
  if (!selectedDate.value || !selectedTime.value) return

  if (selectedDate.value < today.value) {
    alertsStore.showAlert('No podés reservar un turno en una fecha pasada.', 'error')
    return
  }

  if (selectedDate.value === today.value) {
    const currentHour = now.getHours()
    const [selectedHourNum] = selectedTime.value.split(':').map(Number)

    if (selectedHourNum <= currentHour) {
      alertsStore.showAlert('El horario seleccionado ya pasó. Elegí un turno posterior.', 'error')
      return
    }
  }

  try {
    isSubmitting.value = true
    await reservationsStore.addReservation(
      authStore.user.id,
      props.court.id,
      props.court.name,
      props.court.club,
      selectedDate.value,
      selectedTime.value
    )

    alertsStore.showAlert(`¡Reserva confirmada con éxito para el día ${selectedDate.value} a las ${selectedTime.value} hs!`, 'success')
    
    isBooking.value = false
    selectedDate.value = ''
    selectedTime.value = ''

    router.push('/reservas')
  } catch (err) {
    console.error('Error al crear reserva:', err)
    alertsStore.showAlert(err.message || 'No se pudo crear la reserva.', 'error')
  } finally {
    isSubmitting.value = false
  }
}

// Funciones para manejar la calificación
function openReviewModal() {
  if (!authStore.user) {
    alertsStore.showAlert('Debés iniciar sesión para calificar una cancha.', 'error')
    router.push('/login')
    return
  }
  showReviewModal.value = true
}

function closeReviewModal() {
  showReviewModal.value = false
  rating.value = 0
  comment.value = ''
}

async function submitReview() {
  if (rating.value === 0) return
  
  try {
    isSubmittingReview.value = true
    await courtsStore.addCourtReview(
      authStore.user.id,
      props.court.id,
      rating.value,
      comment.value
    )
    alertsStore.showAlert('¡Gracias por calificar la cancha!', 'success')
    closeReviewModal()
  } catch (error) {
    alertsStore.showAlert(error.message || 'No se pudo enviar tu calificación.', 'error')
  } finally {
    isSubmittingReview.value = false
  }
}
</script>