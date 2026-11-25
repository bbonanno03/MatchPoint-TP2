<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-title font-black text-text-main mb-6">Métricas</h1>
    <ExportReservations />
    <Dashboard />

    </div>
</template>

<script setup>
import Dashboard from '../components/Dashboard.vue'
import ExportReservations from '../components/ExportReservations.vue'

</script>
