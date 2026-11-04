<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-title font-black text-text-main font-sans tracking-tight">
          Panel de Gestión de Canchas
        </h1>
        <p class="text-text-body text-text-muted mt-1">
          Alta, modificación y baja de canchas.
        </p>
      </div>
      <button 
        @click="openModalForCreate"
        class="bg-brand hover:bg-brand-dark text-white font-bold px-5 py-2.5 rounded-btn shadow-flat transition-colors text-text-body cursor-pointer"
      >
        ➕ Nueva Cancha
      </button>
    </div>

    <!-- Spinner de carga general -->
    <div v-if="courtsStore.loading && !courtsStore.courts.length" class="text-center py-12">
      <p class="text-text-muted font-semibold animate-pulse">Cargando canchas...</p>
    </div>

    <!-- Tabla de Canchas para el Admin -->
    <div v-else class="bg-surface-card border border-surface-border rounded-card shadow-flat overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-surface-bg border-b border-surface-border text-text-small font-bold text-text-muted uppercase tracking-wider">
            <th class="p-4">Nombre</th>
            <th class="p-4">Deporte</th>
            <th class="p-4">Club / Ubicación</th>
            <th class="p-4">Precio / Hora</th>
            <th class="p-4">Estado</th>
            <th class="p-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-border text-text-body text-text-main">
          <tr v-for="court in courtsStore.courts" :key="court.id" class="hover:bg-surface-bg/50 transition-colors">
            <td class="p-4 font-bold">{{ court.name }}</td>
            <td class="p-4"><span class="bg-surface-bg px-2.5 py-1 rounded-full text-text-small font-semibold border border-surface-border">{{ court.sport }}</span></td>
            <td class="p-4">
              <div class="font-medium">{{ court.club }}</div>
              <div class="text-text-small text-text-muted">{{ court.location }}</div>
            </td>
            <td class="p-4 font-semibold text-brand">${{ court.price }}</td>
            <td class="p-4">
              <span :class="court.active ? 'text-status-success bg-green-50 px-2 py-0.5 rounded-full text-text-small font-bold border border-green-200' : 'text-text-muted bg-surface-bg px-2 py-0.5 rounded-full text-text-small font-bold border border-surface-border'">
                {{ court.active ? 'Activa' : 'Inactiva' }}
              </span>
            </td>
            <td class="p-4 text-right space-x-2">
              <button @click="openModalForEdit(court)" class="text-text-small font-bold text-brand hover:underline cursor-pointer">Editar</button>
              <button @click="handleDelete(court.id)" class="text-text-small font-bold text-red-500 hover:underline cursor-pointer">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL FORMULARIO (ALTA / EDICIÓN) -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div class="bg-surface-card border border-surface-border rounded-card w-full max-w-md p-6 shadow-hover">
        <h2 class="text-card-title font-black text-text-main mb-4">
          {{ isEditing ? 'Editar Cancha' : 'Nueva Cancha' }}
        </h2>
        
        <form @submit.prevent="handleSave" class="space-y-4">
          <div>
            <label class="block text-text-small font-bold text-text-main mb-1">Nombre de la cancha</label>
            <input v-model="form.name" type="text" required placeholder="Nombre de la cancha" class="w-full text-text-body border border-surface-border rounded-btn px-3 py-2 bg-surface-bg" />
          </div>

          <div>
            <label class="block text-text-small font-bold text-text-main mb-1">Deporte</label>
            <select v-model="form.sport" required class="w-full text-text-body border border-surface-border rounded-btn px-3 py-2 bg-surface-bg">
              <option value="" disabled>Seleccionar deporte</option>
              <option value="Pádel">Pádel</option>
              <option value="Tenis">Tenis</option>
              <option value="Fútbol">Fútbol</option>
            </select>
          </div>

          <div>
            <label class="block text-text-small font-bold text-text-main mb-1">Club</label>
            <input v-model="form.club" type="text" required placeholder="Nombre del club" class="w-full text-text-body border border-surface-border rounded-btn px-3 py-2 bg-surface-bg" />
          </div>

          <div>
            <label class="block text-text-small font-bold text-text-main mb-1">Ubicación</label>
            <input v-model="form.location" type="text" required placeholder="Ubicación de la cancha" class="w-full text-text-body border border-surface-border rounded-btn px-3 py-2 bg-surface-bg" />
          </div>

          <div>
            <label class="block text-text-small font-bold text-text-main mb-1">Precio por Hora</label>
            <input v-model="form.price" type="number" required min="0" class="w-full text-text-body border border-surface-border rounded-btn px-3 py-2 bg-surface-bg" />
          </div>

          <div v-if="isEditing" class="flex items-center gap-2 py-2">
            <input v-model="form.active" type="checkbox" id="active" class="w-4 h-4 text-brand" />
            <label for="active" class="text-text-body text-text-main font-semibold">Cancha habilitada para reservas</label>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-surface-border">
            <button type="button" @click="showModal = false" class="px-4 py-2 text-text-body border border-surface-border text-text-muted rounded-btn hover:bg-surface-bg cursor-pointer">Cancelar</button>
            <button type="submit" :disabled="courtsStore.loading" class="px-4 py-2 text-text-body bg-brand text-white font-bold rounded-btn hover:bg-brand-dark shadow-flat disabled:opacity-50 cursor-pointer">
              {{ courtsStore.loading ? 'Guardando...' : 'Guardar Cancha' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCourtsStore } from '../stores/courts'
import { useAlertsStore } from '../stores/alerts'

const courtsStore = useCourtsStore()
const alertsStore = useAlertsStore()

const showModal = ref(false)
const isEditing = ref(false)
const currentId = ref(null)

const form = ref({
  name: '',
  sport: '',
  club: '',
  location: '',
  price: 0,
  active: true
})

function openModalForCreate() {
  isEditing.value = false
  currentId.value = null
  form.value = {
    name: '',
    sport: '',
    club: '',
    location: '',
    price: 0,
    active: true
  }
  showModal.value = true
}

function openModalForEdit(court) {
  isEditing.value = true
  currentId.value = court.id
  form.value = { ...court }
  showModal.value = true
}

async function handleSave() {
  try {
    if (isEditing.value) {
      await courtsStore.updateCourt(currentId.value, form.value)
      alertsStore.showAlert('Cancha modificada correctamente.', 'success')
    } else {
      await courtsStore.addCourt(form.value)
      alertsStore.showAlert('Cancha dada de alta correctamente.', 'success')
    }
    showModal.value = false
  } catch (err) {
    alertsStore.showAlert('Hubo un problema al intentar guardar la cancha.', 'error')
  }
}

async function handleDelete(id) {
  if (confirm('¿De verdad querés eliminar esta cancha? Se borrará definitivamente.')) {
    try {
      await courtsStore.deleteCourt(id)
      alertsStore.showAlert('Cancha eliminada con éxito.', 'success')
    } catch (err) {
      alertsStore.showAlert('Error al eliminar la cancha.', 'error')
    }
  }
}
</script>