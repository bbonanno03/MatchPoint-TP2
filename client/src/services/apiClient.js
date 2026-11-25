import { supabase } from './supabase.js'
import { apiRequest } from './apiRequest.js'

export async function apiAutenticada(path, opciones = {}) {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session?.access_token) throw new Error('Tu sesión venció. Iniciá sesión nuevamente.')
  return apiRequest(path, { ...opciones, token: data.session.access_token })
}
