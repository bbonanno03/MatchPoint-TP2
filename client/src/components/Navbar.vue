<script setup>
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore();
const router = useRouter();

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<template>
  <nav class="bg-surface-card border-b border-surface-border shadow-flat sticky top-0 z-50 transition-all">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        
        <div class="flex items-center space-x-8">
          <router-link to="/canchas" class="text-xl font-black tracking-tight text-text-main flex items-center space-x-2">
            <span class="text-brand">⚽</span>
            <span>MatchPoint</span>
          </router-link>

          <div class="hidden md:flex items-center space-x-1">
            <router-link 
              to="/canchas" 
              class="px-3 py-2 rounded-btn text-text-body font-medium text-text-muted hover:text-brand hover:bg-gray-50 transition-colors"
              active-class="text-brand bg-green-50 font-semibold"
            >
              Canchas
            </router-link>
            
            <router-link 
              to="/reservas" 
              class="px-3 py-2 rounded-btn text-text-body font-medium text-text-muted hover:text-brand hover:bg-gray-50 transition-colors"
              active-class="text-brand bg-green-50 font-semibold"
            >
              Reservas
            </router-link>
            
            <router-link 
              to="/politicas" 
              class="px-3 py-2 rounded-btn text-text-body font-medium text-text-muted hover:text-brand hover:bg-gray-50 transition-colors"
              active-class="text-brand bg-green-50 font-semibold"
            >
              Políticas
            </router-link>

            <router-link 
              v-if="authStore.isAuthenticated"
              to="/perfil" 
              class="px-3 py-2 rounded-btn text-text-body font-medium text-text-muted hover:text-brand hover:bg-gray-50 transition-colors"
              active-class="text-brand bg-green-50 font-semibold"
            >
            Mi Perfil
            </router-link>
          </div>
        </div>

        <div v-if="authStore.isAdmin" class="hidden lg:flex items-center space-x-1 bg-gray-50 p-1 rounded-btn border border-surface-border">
          <router-link 
            to="/admin/canchas" 
            class="px-3 py-1.5 text-text-small font-semibold rounded-btn text-text-muted hover:text-text-main transition-colors"
            active-class="bg-white text-text-main shadow-flat"
          >
            Gestión Canchas
          </router-link>
          <router-link 
            to="/admin/metricas" 
            class="px-3 py-1.5 text-text-small font-semibold rounded-btn text-text-muted hover:text-text-main transition-colors"
            active-class="bg-white text-text-main shadow-flat"
          >
            Métricas
          </router-link>
          <router-link 
            to="/admin/usuarios" 
            class="px-3 py-1.5 text-text-small font-semibold rounded-btn text-text-muted hover:text-text-main transition-colors"
            active-class="bg-white text-text-main shadow-flat"
          >
            Usuarios
          </router-link>
        </div>

        <div class="flex items-center space-x-4">

          <div v-if="!authStore.isAuthenticated" class="flex items-center space-x-2">
            <router-link 
              to="/login" 
              class="px-4 py-2 text-text-body font-medium text-text-muted hover:text-text-main transition-colors"
            >
              Ingresar
            </router-link>
            <router-link 
              to="/register" 
              class="bg-brand hover:bg-brand-dark text-white text-text-body font-bold px-4 py-2 rounded-btn shadow-flat transition-colors"
            >
              Registrarse
            </router-link>
          </div>

          <div v-if="authStore.isAuthenticated" class="flex items-center space-x-4">
           
            <div class="text-right hidden sm:block">
              <p class="text-text-body font-bold text-text-main leading-none">
                {{ authStore.user.name }}
              </p>
              <p class="text-[11px] font-semibold text-brand uppercase tracking-wider mt-0.5">
                {{ authStore.user.role }}
              </p>
            </div>

            <button 
              @click="handleLogout" 
              class="border border-surface-border hover:border-red-200 hover:bg-red-50 text-text-muted hover:text-status-error text-text-body font-medium px-3 py-2 rounded-btn transition-colors duration-200"
            >
              Cerrar sesión
            </button>
          </div>

        </div>

      </div>
    </div>
  </nav>
</template>