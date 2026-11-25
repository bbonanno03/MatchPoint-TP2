import Server from './server.js'
import config from './config.js'
import CnxSupabase from './modelo/DAO/CnxSupabase.js'


if (config.MODO_PERSISTENCIA === 'MEM') {
    console.warn('API en modo MEM: solo admite token-admin/token-player de pruebas. Para usar cuentas reales de la web, configura MODO_PERSISTENCIA=SUPABASE, SUPABASE_URL y SUPABASE_KEY en server/.env.')
}

if (config.MODO_PERSISTENCIA == 'SUPABASE') {
    await CnxSupabase.conectar()
}

const server = new Server(config.PORT)
await server.start()
