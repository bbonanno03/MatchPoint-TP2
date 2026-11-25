<template>
  <section class="border border-surface-border rounded-btn p-3 bg-surface-bg" aria-label="Clima del turno">
    <button type="button" @click="consultar" :disabled="!fecha || !hora || cargando" :aria-busy="cargando"
      class="w-full border border-brand text-brand hover:bg-green-50 font-semibold rounded-btn px-3 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
      {{ cargando ? 'Consultando…' : 'Consultar clima' }}
    </button>
    <p class="text-text-small text-text-muted mt-2">Pronóstico disponible desde hoy hasta dentro de 16 días.</p>
    <p v-if="error" role="alert" class="mt-3 text-status-error text-text-small">{{ error }}</p>
    <div v-if="pronostico" role="status" aria-live="polite" class="mt-3 space-y-3">
      <p class="text-text-small font-semibold text-text-main">Turno del {{ pronostico.fecha }} a las {{ pronostico.hora }}</p>
      <p v-if="pronostico.techada" class="text-text-small font-bold text-brand">Cancha techada</p>
      <dl v-else class="space-y-2">
        <div class="flex items-baseline justify-between gap-3">
          <dt class="text-text-small text-text-muted">Temperatura</dt>
          <dd class="shrink-0 whitespace-nowrap font-bold text-text-main">{{ pronostico.temperatura }} °C</dd>
        </div>
        <div class="flex items-baseline justify-between gap-3">
          <dt class="text-text-small text-text-muted">Probabilidad de lluvia</dt>
          <dd class="shrink-0 whitespace-nowrap font-bold text-text-main">{{ pronostico.probabilidadLluvia }} %</dd>
        </div>
        <div class="flex items-baseline justify-between gap-3">
          <dt class="text-text-small text-text-muted">Viento</dt>
          <dd class="shrink-0 whitespace-nowrap font-bold text-text-main">{{ pronostico.viento }} km/h</dd>
        </div>
      </dl>
      <p class="text-text-body text-text-main">{{ pronostico.recomendacion }}</p>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { consultarClima } from '../services/climaService'

const props = defineProps({
  courtId: { type: String, required: true },
  fecha: { type: String, default: '' },
  hora: { type: String, default: '' },
})
const cargando = ref(false)
const error = ref('')
const pronostico = ref(null)
let controlador
let version = 0

function limpiar() {
  version++
  controlador?.abort()
  controlador = null
  cargando.value = false
  error.value = ''
  pronostico.value = null
}

watch(() => [props.courtId, props.fecha, props.hora], limpiar, { flush: 'sync' })
onBeforeUnmount(limpiar)

async function consultar() {
  if (!props.fecha || !props.hora || cargando.value) return
  limpiar()
  const actual = version
  const abort = new AbortController()
  controlador = abort
  cargando.value = true
  const timeout = setTimeout(() => abort.abort(new DOMException('Tiempo agotado', 'TimeoutError')), 12000)
  try {
    const datos = await consultarClima({ courtId: props.courtId, fecha: props.fecha, hora: props.hora, signal: abort.signal })
    if (actual === version) pronostico.value = datos
  } catch (e) {
    if (actual !== version) return
    if (abort.signal.reason?.name === 'TimeoutError') error.value = 'La consulta tardó demasiado. Intentá de nuevo.'
    else if (!abort.signal.aborted) error.value = e.message || 'No se pudo obtener el pronóstico.'
  } finally {
    clearTimeout(timeout)
    if (actual === version) {
      cargando.value = false
      controlador = null
    }
  }
}
</script>
