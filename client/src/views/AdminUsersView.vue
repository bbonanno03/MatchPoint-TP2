<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    <div class="mb-8">
      <h1 class="text-title font-black text-text-main font-sans tracking-tight">
        Gestión de Usuarios
      </h1>
      <p class="text-text-body text-text-muted mt-1">
        Controlá el acceso, roles y estados de los usuarios registrados en el sistema.
      </p>
    </div>

    <div v-if="isEditing" class="bg-surface-card border border-surface-border rounded-card p-6 shadow-flat mb-8 animation-fade-in">
      <h2 class="text-card-title font-bold text-text-main mb-4">
        📝 Modificar Usuario: <span class="text-brand">{{ form.name }}</span>
      </h2>
      
      <form @submit.prevent="handleSubmit" class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label class="block text-text-small font-bold text-text-main mb-1">Nombre Completo:</label>
          <input v-model="form.name" type="text" required class="w-full text-text-body border border-surface-border rounded-btn px-3 py-2 bg-surface-bg text-text-main focus:outline-none focus:border-brand" />
        </div>

        <div>
          <label class="block text-text-small font-bold text-text-main mb-1">Rol en la App:</label>
          <select v-model="form.role" class="w-full text-text-body border border-surface-border rounded-btn px-3 py-2 bg-surface-bg text-text-main focus:outline-none focus:border-brand">
            <option value="Cliente">Cliente</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        <div class="flex gap-2">
          <button type="submit" class="flex-1 bg-brand hover:bg-brand-dark text-white font-bold py-2 rounded-btn shadow-flat transition-colors text-text-body cursor-pointer text-center">
            Guardar Cambios
          </button>
          <button type="button" @click="cancelEdit" class="bg-surface-bg hover:bg-surface-border text-text-muted border border-surface-border font-bold py-2 px-4 rounded-btn transition-colors text-text-body cursor-pointer">
            Cancelar
          </button>
        </div>
      </form>
    </div>

    <div class="bg-surface-card border border-surface-border rounded-card shadow-flat overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-bg border-b border-surface-border text-text-small font-bold text-text-muted">
              <th class="p-4">Usuario / Email</th>
              <th class="p-4">Rol</th>
              <th class="p-4">Estado</th>
              <th class="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-border text-text-body text-text-main">
            <tr v-for="user in usersStore.users" :key="user.id" class="hover:bg-slate-50/50 transition-colors">
              <td class="p-4">
                <div class="font-semibold">{{ user.name }}</div>
                <div class="text-text-small text-text-muted">{{ user.email }}</div>
              </td>
              <td class="p-4">
                <span :class="[
                  'px-2.5 py-0.5 text-text-small font-bold rounded-full border',
                  user.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                ]">
                  {{ user.role }}
                </span>
              </td>
              <td class="p-4">
                <span :class="[
                  'px-2.5 py-0.5 text-text-small font-bold rounded-full border',
                  user.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-status-error border-red-200'
                ]">
                  {{ user.active ? 'Activo' : 'Deshabilitado' }}
                </span>
              </td>
              <td class="p-4">
                <div class="flex justify-center gap-2">
                  <button @click="selectUser(user)" class="text-text-small bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-btn font-bold transition-colors cursor-pointer">
                    Editar
                  </button>
                  <button 
                    @click="handleToggleStatus(user)" 
                    :class="[
                      'text-text-small px-3 py-1 rounded-btn font-bold transition-colors cursor-pointer border',
                      user.active 
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' 
                        : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200'
                    ]"
                  >
                    {{ user.active ? 'Deshabilitar' : 'Habilitar' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue' 
import { useUsersStore } from '../stores/users'
import { useAlertsStore } from '../stores/alerts.js'

const usersStore = useUsersStore()
const alertsStore = useAlertsStore()

const isEditing = ref(false)
const currentUserId = ref(null)
const form = ref({ name: '', role: '' })

onMounted(async () => {
  await usersStore.fetchUsers()
  if (usersStore.error) {
    alertsStore.showAlert(`Error al cargar usuarios: ${usersStore.error}`, 'error')
  }
})

function selectUser(user) {
  isEditing.value = true
  currentUserId.value = user.id
  form.value = { name: user.name, role: user.role }
}

async function handleSubmit() {
  const success = await usersStore.updateUser(currentUserId.value, form.value)
  
  if (success) {
    alertsStore.showAlert(`Usuario "${form.value.name}" actualizado correctamente.`, 'success')
    cancelEdit()
  } else {
    alertsStore.showAlert(`No se pudo actualizar el usuario: ${usersStore.error}`, 'error')
  }
}

async function handleToggleStatus(user) {
  const estadoOriginal = user.active 
  
  const success = await usersStore.toggleUserStatus(user.id)
  
  if (success) {
    if (!user.active) {
      alertsStore.showAlert(`El usuario "${user.name}" ha sido deshabilitado.`, 'error')
    } else {
      alertsStore.showAlert(`El usuario "${user.name}" fue reactivado con éxito.`, 'success')
    }
  } else {
    alertsStore.showAlert(`Error al cambiar el estado: ${usersStore.error}`, 'error')
  }
}

function cancelEdit() {
  isEditing.value = false
  currentUserId.value = null
  form.value = { name: '', role: '' }
}
</script>