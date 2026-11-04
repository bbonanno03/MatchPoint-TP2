<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
    
    <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p class="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Usuarios</p>
        <h3 class="text-3xl font-black text-slate-800 mt-1">{{ totalUsers }}</h3>
      </div>
      <div class="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-2xl">
        👥
      </div>
    </div>

    <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p class="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Canchas</p>
        <h3 class="text-3xl font-black text-slate-800 mt-1">{{ totalCourts }}</h3>
      </div>
      <div class="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-2xl">
        🎾
      </div>
    </div>

    <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p class="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Reservas</p>
        <h3 class="text-3xl font-black text-slate-800 mt-1">{{ totalReservations }}</h3>
      </div>
      <div class="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-2xl">
        📅
      </div>
    </div>

    <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
      <div>
        <p class="text-sm font-bold text-slate-500 uppercase tracking-wider">Reservas Activas</p>
        <h3 class="text-3xl font-black text-emerald-600 mt-1">{{ activeReservations }}</h3>
      </div>
      <div class="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-2xl">
        ⚡
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue' 
import { useUsersStore } from '../stores/users'
import { useCourtsStore } from '../stores/courts'
import { useReservationsStore } from '../stores/reservations'

const usersStore = useUsersStore()
const courtsStore = useCourtsStore()
const reservationsStore = useReservationsStore()

onMounted(async () => {
  if (usersStore.users.length === 0) {
    await usersStore.fetchUsers()
  }
  
  if (courtsStore.courts.length === 0) {
    await courtsStore.fetchCourts()
  }

  await reservationsStore.fetchAllReservations()
})

const totalUsers = computed(() => usersStore.users.length)
const totalCourts = computed(() => courtsStore.courts.length)
const totalReservations = computed(() => reservationsStore.reservations.length)

const activeReservations = computed(() => {
  if (!reservationsStore.reservations || reservationsStore.reservations.length === 0) {
    return 0
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return [...reservationsStore.reservations].filter(res => {
    if (!res) return false

    const resDateStr = res.reservation_date || res.date
    if (!resDateStr) return false

    const cleanDateStr = resDateStr.split('T')[0]

    const isFutureOrToday = cleanDateStr >= todayStr
    const isStatusActive = res.status === 'active' || res.status === 'confirmed'

    return isFutureOrToday && isStatusActive
  }).length
})
</script>