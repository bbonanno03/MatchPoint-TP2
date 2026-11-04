<template>
  <div class="max-w-3xl mx-auto py-10 px-6">
    
    <h1 class="text-3xl font-bold mb-8">
      Mi Perfil
    </h1>

    <div class="bg-white rounded-lg shadow p-6 space-y-6">

      <div>
        <label class="block font-semibold mb-2">
          Nombre
        </label>

        <input
          v-model="name"
          type="text"
          class="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label class="block font-semibold mb-2">
          Email
        </label>

        <input
          :value="authStore.user?.email"
          disabled
          class="w-full border rounded px-3 py-2 bg-gray-100"
        />
      </div>

      <div>
        <label class="block font-semibold mb-2">
          Rol
        </label>

        <input
          :value="authStore.user?.role"
          disabled
          class="w-full border rounded px-3 py-2 bg-gray-100"
        />
      </div>

      <button
        @click="saveProfile"
        class="bg-green-600 text-white px-5 py-2 rounded"
      >
        Guardar cambios
      </button>

      <router-link
        to="/cambiar-password"
        class="inline-block ml-4 text-green-600 font-semibold hover:underline"
      >
        Cambiar contraseña
      </router-link>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../services/supabase'

const authStore = useAuthStore()

const name = ref('')

onMounted(() => {
  name.value = authStore.user?.name || ''
})

async function saveProfile() {

  const { error } = await supabase
    .from('profiles')
    .update({
      name: name.value
    })
    .eq('id', authStore.user.id)

  if (error) {
    alert('Error al actualizar perfil')
    return
  }

  authStore.user.name = name.value

  alert('Perfil actualizado correctamente')
}
</script>