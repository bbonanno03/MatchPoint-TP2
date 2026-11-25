<template>
  <section v-if="authStore.isAdmin" class="bg-surface-card border border-surface-border rounded-card p-5 sm:p-6 shadow-flat mb-8" aria-labelledby="reporte-titulo">
    <h2 id="reporte-titulo" class="text-card-title font-bold text-text-main">Reporte de reservas</h2>
    <p class="text-text-body text-text-muted mt-1 mb-5">
      Descargá un Excel con las reservas del período y el resumen de ocupación e ingresos estimados por cancha.
    </p>
    <form class="flex flex-col sm:flex-row sm:items-end gap-4" @submit.prevent="exportar">
      <div class="flex-1">
        <label for="reporte-desde" class="block text-text-small font-semibold text-text-main mb-1">Desde</label>
        <input id="reporte-desde" v-model="desde" type="date" required :disabled="descargando"
          class="w-full border border-surface-border rounded-btn px-3 py-2 bg-surface-bg text-text-main focus:outline-none focus:border-brand" />
      </div>
      <div class="flex-1">
        <label for="reporte-hasta" class="block text-text-small font-semibold text-text-main mb-1">Hasta</label>
        <input id="reporte-hasta" v-model="hasta" type="date" required :min="desde" :disabled="descargando"
          class="w-full border border-surface-border rounded-btn px-3 py-2 bg-surface-bg text-text-main focus:outline-none focus:border-brand" />
      </div>
      <button type="submit" :disabled="descargando" :aria-busy="descargando"
        class="bg-brand hover:bg-brand-dark text-white font-bold px-5 py-2 rounded-btn transition-colors disabled:opacity-60 disabled:cursor-wait">
        {{ descargando ? 'Generando…' : 'Exportar Excel' }}
      </button>
    </form>
    <p v-if="error" role="alert" class="mt-3 text-status-error text-text-small">{{ error }}</p>
    <p v-if="exito" role="status" class="mt-3 text-brand text-text-small">Reporte descargado.</p>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../services/supabase'
import { descargarReporteReservas } from '../services/reportesService'

const authStore = useAuthStore()
// Mes actual, usando la fecha local para no desplazar el día por UTC.
const hoy = new Date()
const mes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
const desde = ref(`${mes}-01`)
const hasta = ref(`${mes}-${String(hoy.getDate()).padStart(2, '0')}`)
const descargando = ref(false)
const error = ref('')
const exito = ref(false)

async function exportar() {
  if (!authStore.isAdmin || descargando.value) return
  error.value = ''
  exito.value = false
  descargando.value = true
  try {
    const { data, error: errorSesion } = await supabase.auth.getSession()
    if (errorSesion || !data.session) throw new Error('Tu sesión venció. Iniciá sesión nuevamente.')
    const { archivo, nombre } = await descargarReporteReservas({
      desde: desde.value, hasta: hasta.value, token: data.session.access_token,
    })
    const url = URL.createObjectURL(archivo)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = nombre
    document.body.appendChild(enlace)
    enlace.click()
    enlace.remove()
    // Dejar que el navegador inicie la descarga antes de liberar el blob.
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    exito.value = true
  } catch (e) {
    error.value = e.message || 'No se pudo descargar el reporte.'
  } finally {
    descargando.value = false
  }
}
</script>
