<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
    <div class="max-w-md w-full bg-surface-card border border-surface-border rounded-card shadow-flat p-8 space-y-6">
      
      <div class="text-center">
        <span class="text-4xl">⚽</span>
        <h1 class="mt-3 text-title font-black text-text-main font-sans tracking-tight">
          Ingresar a <span class="font-display text-brand">MatchPoint</span>
        </h1>
        <p class="mt-2 text-text-body text-text-muted">
          Iniciá sesión para reservar tus canchas
        </p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <div class="space-y-1.5">
          <label class="block text-text-body font-semibold text-text-muted">
            Correo electrónico
          </label>
          <input 
            v-model.trim="email" 
            type="email" 
            required 
            placeholder="ejemplo@correo.com"
            class="w-full px-3 py-2.5 bg-white border border-surface-border rounded-btn text-text-body text-text-main placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-2 focus:ring-green-100 transition-all"
          />
        </div>

        <div class="space-y-1.5">
          <label class="block text-text-body font-semibold text-text-muted">
            Contraseña
          </label>
          <input 
            v-model="password" 
            type="password" 
            required 
            placeholder="••••••••"
            class="w-full px-3 py-2.5 bg-white border border-surface-border rounded-btn text-text-body text-text-main placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-2 focus:ring-green-100 transition-all"
          />
        </div>

        <div class="pt-2">
          <button 
            type="submit" 
            :disabled="authStore.loading"
            class="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 px-4 rounded-btn shadow-flat hover:shadow-md transition-all duration-200 text-text-body cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            {{ authStore.loading ? 'Ingresando...' : 'Ingresar a la cuenta' }}
          </button>
        </div>
      </form>

      <div class="text-center pt-2">
        <p class="text-text-small text-text-muted">
          ¿No tenés cuenta? 
          <router-link to="/register" class="text-brand font-bold hover:underline">
            Registrate acá
          </router-link>
        </p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAlertsStore } from '../stores/alerts'

const email = ref('')
const password = ref('')

const router = useRouter()
const authStore = useAuthStore()
const alertsStore = useAlertsStore()

//traducir las respuestas de Supabase
function translateError(msg) {
  if (!msg) return 'Ocurrió un error inesperado.'
  
  const lowerMsg = msg.toLowerCase()
  
  if (lowerMsg.includes('invalid login credentials')) {
    return 'El correo electrónico o la contraseña son incorrectos. O puede que no estes registrado aún.'
  }
  if (lowerMsg.includes('user contains invalid email')) {
    return 'El formato del correo electrónico no es válido.'
  }
  if (lowerMsg.includes('email not confirmed')) {
    return 'Por favor, confirmá tu correo electrónico para ingresar.'
  }
  
  return msg // Si es un error raro, dejamos el que viene por defecto
}

async function handleLogin() {
  if (!email.value.includes('@')) {
    alertsStore.showAlert('Por favor, ingresá un correo electrónico válido.', 'error')
    return
  }

  if (password.value.length < 3) {
    alertsStore.showAlert('La contraseña ingresada es demasiado corta.', 'error')
    return
  }

  const success = await authStore.login(email.value, password.value)

  if (success) {
    alertsStore.showAlert('¡Bienvenido de nuevo a MatchPoint!', 'success')
    router.push('/canchas')
  } else {
    const errorTraducido = translateError(authStore.error)
    alertsStore.showAlert(errorTraducido, 'error')
  }
}
</script>