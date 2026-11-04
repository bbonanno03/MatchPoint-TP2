<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm">
    <transition-group name="toast" tag="div">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'rounded-btn border p-4 shadow-flat ring-1 ring-black/5 flex items-start justify-between gap-3',
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-status-success' : '',
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-status-error' : '',
          toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' : '',
          toast.type === 'info' ? 'bg-surface-card border-surface-border text-text-main' : ''
        ]"
      >
        <div class="flex-1">
          <p class="text-text-body text-sm leading-relaxed">{{ toast.message }}</p>
        </div>
        <button
          type="button"
          class="text-text-muted hover:text-text-main text-base font-semibold leading-none"
          @click="removeToast(toast.id)"
          aria-label="Cerrar notificación"
        >
          ×
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToast } from '../composables/useToast'

const { toasts, removeToast } = useToast()
</script>
