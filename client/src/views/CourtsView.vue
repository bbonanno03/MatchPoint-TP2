<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    <div class="mb-8">
      <h1 class="text-title font-black text-text-main font-sans tracking-tight">
        Canchas Disponibles
      </h1>
      <p class="text-text-body text-text-muted mt-1">
        Buscá tu club favorito y filtrá por tu deporte para asegurar el partido.
      </p>
    </div>

    <div v-if="!authStore.user" class="bg-surface-card border border-surface-border rounded-card p-12 text-center shadow-flat max-w-2xl mx-auto mt-12">
      <span class="text-5xl block mb-4">⚽</span>
      <h3 class="text-card-title font-bold text-text-main">Iniciá sesión para ver las canchas</h3>
      <p class="text-text-body text-text-muted mt-2 max-w-sm mx-auto">
        Para poder explorar los clubes disponibles, ver los precios por hora y reservar tu turno, necesitás tener una cuenta.
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
      <div class="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4 bg-surface-card p-4 border border-surface-border rounded-card shadow-flat">
        <div class="relative flex-1 max-w-md">
          <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-xl pointer-events-none">
            🔍
          </span>
          <input 
            v-model="courtsStore.searchQuery"
            type="text"
            placeholder="Buscar por cancha o club..."
            class="w-full text-text-body border border-surface-border rounded-btn pl-10 pr-4 py-2.5 bg-surface-bg text-text-main focus:outline-none focus:border-brand transition-colors placeholder-text-muted"
          />
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button 
            @click="courtsStore.setSportFilter('')"
            :class="[
              'px-4 py-2 text-text-small font-bold rounded-full transition-all cursor-pointer border',
              courtsStore.selectedSport === '' 
                ? 'bg-brand border-brand text-white shadow-flat' 
                : 'bg-surface-bg border-surface-border text-text-muted hover:text-text-main'
            ]"
          >
            Todos
          </button>
          
          <button 
            @click="courtsStore.setSportFilter('Pádel')"
            :class="[
              'px-4 py-2 text-text-small font-bold rounded-full transition-all cursor-pointer border',
              courtsStore.selectedSport === 'Pádel' 
                ? 'bg-brand border-brand text-white shadow-flat' 
                : 'bg-surface-bg border-surface-border text-text-muted hover:text-text-main'
            ]"
          >
            🎾 Pádel
          </button>

          <button 
            @click="courtsStore.setSportFilter('Tenis')"
            :class="[
              'px-4 py-2 text-text-small font-bold rounded-full transition-all cursor-pointer border',
              courtsStore.selectedSport === 'Tenis' 
                ? 'bg-brand border-brand text-white shadow-flat' 
                : 'bg-surface-bg border-surface-border text-text-muted hover:text-text-main'
            ]"
          >
            🥎 Tenis
          </button>

          <button 
            @click="courtsStore.setSportFilter('Fútbol')"
            :class="[
              'px-4 py-2 text-text-small font-bold rounded-full transition-all cursor-pointer border',
              courtsStore.selectedSport === 'Fútbol' 
                ? 'bg-brand border-brand text-white shadow-flat' 
                : 'bg-surface-bg border-surface-border text-text-muted hover:text-text-main'
            ]"
          >
            ⚽ Fútbol
          </button>
        </div>
      </div>
      
      <div 
        v-if="!courtsStore.filteredCourts.length" 
        class="bg-surface-card border border-surface-border rounded-card p-12 text-center shadow-flat"
      >
        <span class="text-5xl block mb-4">🤷‍♂️</span>
        <h3 class="text-card-title font-bold text-text-main">No hay canchas disponibles</h3>
        <p class="text-text-body text-text-muted mt-1 max-w-sm mx-auto">
          No encontramos resultados para tus filtros actuales. Probá limpiando el buscador.
        </p>
        <button 
          @click="courtsStore.clearFilters"
          class="mt-5 bg-surface-bg hover:bg-surface-border text-text-main border border-surface-border font-bold px-5 py-2 rounded-btn transition-colors text-text-body cursor-pointer"
        >
          Limpiar Filtros
        </button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CourtCard
          v-for="court in courtsStore.filteredCourts"
          :key="court.id"
          :court="court"
        />
      </div>
    </div>

  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useCourtsStore } from '../stores/courts'
import { useAuthStore } from '../stores/auth'
import CourtCard from '../components/CourtCard.vue'

const courtsStore = useCourtsStore()
const authStore = useAuthStore()

onMounted(async () => {
  if (authStore.user) {
    try {
      await courtsStore.fetchCourts()
    } catch (error) {
      console.error(error)
    }
  }
})
</script>