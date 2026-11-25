import { supabase } from './supabase.js'
import { crearApiAutenticada } from './authenticatedRequest.js'

export const apiAutenticada = crearApiAutenticada(supabase.auth)
