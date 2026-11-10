import dotenv from 'dotenv'

dotenv.config({ quiet: true })

const PORT = process.env.PORT || 8080
const MODO_PERSISTENCIA = process.env.MODO_PERSISTENCIA || 'MEM'     // MEM | SUPABASE
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_KEY || ''
const MODO_MAIL = process.env.MODO_MAIL || 'MEM'     // MEM | SMTP
const SMTP = {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || '',
}

export default {
    PORT,
    MODO_PERSISTENCIA,
    SUPABASE_URL,
    SUPABASE_KEY,
    MODO_MAIL,
    SMTP
}
