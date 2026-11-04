import Server from './server.js'
import config from './config.js'
import CnxSupabase from './modelo/DAO/CnxSupabase.js'


if (config.MODO_PERSISTENCIA == 'SUPABASE') {
    await CnxSupabase.conectar()
}

const server = new Server(config.PORT)
await server.start()
