import { ref } from 'vue'

const toasts = ref([])
let nextToastId = 1
const DEFAULT_DURATION = 4500

function removeToast(id) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

function notify({ message, type = 'info', duration = DEFAULT_DURATION }) {
  const id = nextToastId++

  toasts.value.push({ id, message, type })

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  return id
}

function success(message, duration) {
  return notify({ message, type: 'success', duration })
}

function error(message, duration) {
  return notify({ message, type: 'error', duration })
}

function warning(message, duration) {
  return notify({ message, type: 'warning', duration })
}

export function useToast() {
  return {
    toasts,
    notify,
    success,
    error,
    warning,
    removeToast
  }
}
