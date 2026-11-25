<template>
  <section v-if="auth.user" class="mb-8 border border-surface-border rounded-card p-5 bg-surface-card" aria-labelledby="espera-titulo">
    <div class="flex items-center justify-between gap-3">
      <h2 id="espera-titulo" class="text-card-title font-bold text-text-main">Mi lista de espera</h2>
      <button type="button" @click="cargar" :disabled="cargando || !!saliendo" class="text-brand underline disabled:opacity-50">Actualizar</button>
    </div>
    <p class="text-text-small text-text-muted mt-2">Te avisamos por email si se libera un turno. El aviso no garantiza ni crea una reserva.</p>
    <p v-if="error" role="alert" class="text-status-error mt-3">{{ error }}</p>
    <p v-if="cargando" role="status" class="mt-3 text-text-muted">Cargando lista de espera…</p>
    <p v-else-if="!inscripciones.length && !error" class="mt-3 text-text-muted">No estás anotado en ningún turno.</p>
    <ul v-else class="mt-4 space-y-3">
      <li v-for="inscripcion in inscripciones" :key="inscripcion.id" class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-surface-border pt-3">
        <div>
          <p class="font-semibold text-text-main">{{ canchas.find(c => c.id === inscripcion.court_id)?.name || `Cancha ${inscripcion.court_id}` }}</p>
          <p class="text-text-small text-text-muted">{{ inscripcion.reservation_date }} a las {{ inscripcion.start_time.slice(0, 5) }}</p>
        </div>
        <button type="button" @click="salir(inscripcion.id)" :disabled="!!saliendo || cargando" class="border border-surface-border rounded-btn px-3 py-2 text-status-error disabled:opacity-50">
          {{ saliendo === inscripcion.id ? 'Saliendo…' : 'Salirme de la lista' }}
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { obtenerPropias, salirse } from '../services/listaEsperaService.js'
import { apiRequest } from '../services/apiRequest.js'

const auth = useAuthStore()
const inscripciones = ref([])
const canchas = ref([])
const cargando = ref(false)
const saliendo = ref('')
const error = ref('')
let version = 0
watch(() => auth.user?.id, () => { inscripciones.value = []; cargar() }, { immediate: true })

async function cargar() {
  const actual = ++version
  if (!auth.user) { cargando.value = false; return }
  cargando.value = true
  error.value = ''
  try {
    const [lista, nombres] = await Promise.all([obtenerPropias(), apiRequest('/canchas').catch(() => [])])
    if (actual === version) { inscripciones.value = lista; canchas.value = nombres }
  } catch (e) {
    if (actual === version) error.value = e.message || 'No se pudo consultar la lista de espera.'
  } finally { if (actual === version) cargando.value = false }
}

async function salir(id) {
  if (saliendo.value) return
  const usuario = auth.user?.id
  saliendo.value = id
  error.value = ''
  try {
    await salirse(id)
    if (usuario === auth.user?.id) inscripciones.value = inscripciones.value.filter(i => i.id !== id)
  } catch (e) {
    if (usuario === auth.user?.id) error.value = e.message || 'No se pudo salir de la lista.'
  } finally { saliendo.value = '' }
}
</script>
