<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
    <div class="max-w-md w-full bg-surface-card border border-surface-border rounded-card shadow-flat p-8 space-y-6">
      
      <div class="text-center">
        <span class="text-4xl">⚽</span>
        <h1 class="mt-3 text-title font-black text-text-main font-sans tracking-tight">
          Crear cuenta en <span class="font-display text-brand">MatchPoint</span>
        </h1>
        <p class="mt-2 text-text-body text-text-muted">
          Registrate para empezar a reservar tus turnos al instante
        </p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-5">
        <div class="space-y-1.5">
          <label class="block text-text-body font-semibold text-text-muted">
            Nombre completo
          </label>
          <input 
            v-model.trim="name" 
            type="text" 
            required 
            placeholder="Nombre Completo"
            class="w-full px-3 py-2.5 bg-white border border-surface-border rounded-btn text-text-body text-text-main placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-2 focus:ring-green-100 transition-all"
          />
        </div>

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
            placeholder="Mínimo 6 caracteres"
            class="w-full px-3 py-2.5 bg-white border border-surface-border rounded-btn text-text-body text-text-main placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-2 focus:ring-green-100 transition-all"
          />
        </div>

        <div class="pt-2">
          <button 
            type="submit" 
            :disabled="authStore.loading"
            class="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 px-4 rounded-btn shadow-flat hover:shadow-md transition-all duration-200 text-text-body cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            {{ authStore.loading ? 'Registrando...' : 'Registrarme e ingresar' }}
          </button>
        </div>
      </form>

      <div class="text-center pt-2">
        <p class="text-text-small text-text-muted">
          ¿Ya tenés una cuenta creada? 
          <router-link to="/login" class="text-brand font-bold hover:underline">
            Iniciá sesión acá
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

const name = ref('')
const email = ref('')
const password = ref('')

const router = useRouter()
const authStore = useAuthStore()
const alertsStore = useAlertsStore()

//traducir respuestas de registro de Supabase
function translateRegisterError(msg) {
  if (!msg) return 'Ocurrió un error al registrar el usuario.'
  
  const lowerMsg = msg.toLowerCase()
  
  if (lowerMsg.includes('user already exists') || lowerMsg.includes('already registered')) {
    return 'Este correo electrónico ya se encuentra registrado.'
  }
  if (lowerMsg.includes('password should be at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.'
  }
  if (lowerMsg.includes('unable to validate verification schemas')) {
    return 'El formato del correo electrónico es incorrecto.'
  }
  
  return msg
}

async function handleRegister() {
  if (password.value.length < 6) {
    alertsStore.showAlert('La contraseña debe tener un mínimo de 6 caracteres.', 'error')
    return 
  }

  if (name.value.trim().length < 2) {
    alertsStore.showAlert('Por favor, ingresá un nombre válido.', 'error')
    return
  }

  const success = await authStore.register(name.value, email.value, password.value)

  if (success) {
    alertsStore.showAlert('¡Cuenta creada con éxito! Bienvenido.', 'success')
    router.push('/canchas')
  } else {
    const errorTraducido = translateRegisterError(authStore.error)
    alertsStore.showAlert(errorTraducido, 'error')
  }
}
</script>