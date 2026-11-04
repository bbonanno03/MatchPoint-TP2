import { createClient } from '@supabase/supabase-js'
import config from '../../config.js'


class CnxSupabase {
    static cliente = null

    static conectar = async () => {
        if (!config.SUPABASE_URL || !config.SUPABASE_KEY) {
            throw new Error('Faltan SUPABASE_URL o SUPABASE_KEY en el archivo .env')
        }

        console.log('Conectando a Supabase...')
        CnxSupabase.cliente = createClient(config.SUPABASE_URL, config.SUPABASE_KEY)

        // Consulta minima para comprobar que la URL y la clave son correctas
        const { error } = await CnxSupabase.cliente.from('courts').select('id').limit(1)
        if (error) throw new Error(`Error en la conexion a Supabase: ${error.message}`)

        console.log('Supabase conectado!')
    }
}

export default CnxSupabase
