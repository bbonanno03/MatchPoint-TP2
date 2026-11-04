<template>
  <Navbar />
  <router-view />
  <Alert />
</template>

<script setup>
import { onMounted } from 'vue'
import Navbar from './components/Navbar.vue'
import Alert from './components/Alert.vue'
import { useCourtsStore } from './stores/courts'

const courtsStore = useCourtsStore()

// Cargar canchas desde Supabase al iniciar
onMounted(async () => {
  await courtsStore.fetchCourts()
})


</script>