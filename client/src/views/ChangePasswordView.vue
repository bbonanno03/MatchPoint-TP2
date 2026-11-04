<template>
  <div class="max-w-3xl mx-auto py-10 px-6">

    <h1 class="text-3xl font-bold mb-8">
      Cambiar Contraseña
    </h1>

    <div class="bg-white rounded-lg shadow p-6 space-y-6">

      <div>
        <label class="block font-semibold mb-2">
          Nueva contraseña
        </label>

        <input
          v-model="password"
          type="password"
          class="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label class="block font-semibold mb-2">
          Confirmar contraseña
        </label>

        <input
          v-model="confirmPassword"
          type="password"
          class="w-full border rounded px-3 py-2"
        />
      </div>

      <button
        @click="changePassword"
        class="bg-green-600 text-white px-5 py-2 rounded"
      >
        Actualizar contraseña
      </button>

    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../services/supabase'

const password = ref('')
const confirmPassword = ref('')

async function changePassword() {
  if (password.value.length < 6) {
    alert('La contraseña debe tener al menos 6 caracteres')
    return
  }

  if (password.value !== confirmPassword.value) {
    alert('Las contraseñas no coinciden')
    return
  }

  const { error } = await supabase.auth.updateUser({
    password: password.value
  })

  if (error) {
    alert('Error al actualizar la contraseña')
    return
  }

  password.value = ''
  confirmPassword.value = ''

  alert('Contraseña actualizada correctamente. Debes iniciar sesión nuevamente.')

  await supabase.auth.signOut()

  window.location.href = '/login'
}
</script>