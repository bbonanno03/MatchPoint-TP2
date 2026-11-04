<template>
  <div class="fixed top-4 right-4 z-50 pointer-events-none w-full max-w-sm space-y-3">
    
    <TransitionGroup 
      name="toast" 
      tag="div" 
      class="space-y-3"
    >
      <div 
        v-for="alert in alertsStore.alerts" 
        :key="alert.id"
        :class="[
          'pointer-events-auto relative overflow-hidden rounded-card p-4 shadow-flat border flex items-center justify-between gap-3 transition-all duration-300',
          alert.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-status-error'
        ]"
      >
        <div class="flex items-center gap-2">
          <span class="text-xl">
            {{ alert.type === 'success' ? '✅' : '❌' }}
          </span>
          <p class="text-text-body font-semibold">{{ alert.message }}</p>
        </div>

        <button 
          @click="alertsStore.removeAlert(alert.id)" 
          class="text-text-muted hover:text-text-main font-bold text-lg cursor-pointer px-1"
        >
          &times;
        </button>

        <div 
          :class="[
            'absolute bottom-0 left-0 h-1 animation-progress-bar',
            alert.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          ]"
          :style="{ animationDuration: `${alert.timeout}ms` }"
        ></div>
      </div>
    </TransitionGroup>

  </div>
</template>

<script setup>
import { useAlertsStore } from '../stores/alerts.js'

const alertsStore = useAlertsStore()
</script>

<style scoped>
.toast-enter-from {
  transform: translateX(120%);
  opacity: 0;
}
.toast-enter-to {
  transform: translateX(0);
  opacity: 1;
}
.toast-leave-from {
  transform: translateX(0);
  opacity: 1;
}
.toast-leave-to {
  transform: translateX(120%);
  opacity: 0;
}

.animation-progress-bar {
  animation-name: shrinkWidth;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes shrinkWidth {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
</style>