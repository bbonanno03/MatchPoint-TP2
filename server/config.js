import dotenv from 'dotenv'

dotenv.config({ quiet: true })

const PORT = process.env.PORT || 8080
const MODO_PERSISTENCIA = process.env.MODO_PERSISTENCIA || 'MEM'     // MEM | SUPABASE
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_KEY || ''

export default {
    PORT,
    MODO_PERSISTENCIA,
    SUPABASE_URL,
    SUPABASE_KEY
}
