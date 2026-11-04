<template>
  <div class="flex items-center space-x-1">
    <button
      v-for="star in 5"
      :key="star"
      type="button"
      :disabled="readonly"
      @click="$emit('update:modelValue', star)"
      @mouseenter="hoverRating = star"
      @mouseleave="hoverRating = 0"
      :class="[
        'text-2xl transition-colors duration-150',
        readonly ? 'cursor-default' : 'cursor-pointer transform hover:scale-110',
        star <= (hoverRating || modelValue) ? 'text-amber-400' : 'text-slate-200'
      ]"
    >
      ★
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  modelValue: {
    type: Number,
    default: 0
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:modelValue'])

const hoverRating = ref(0)
</script>