import ModeloMem from './reservasMem.js'
import ModeloSupabase from './reservasSupabase.js'


class ModelFactory {
    static get(tipo) {
        switch (tipo) {
            case 'MEM':
                console.log('*** Persistiendo en Memoria (reservas) ***')
                return new ModeloMem()

            case 'SUPABASE':
                console.log('*** Persistiendo en Supabase (reservas) ***')
                return new ModeloSupabase()

            default:
                console.log('*** Persistiendo en Memoria (default) (reservas) ***')
                return new ModeloMem()
        }
    }
}

export default ModelFactory