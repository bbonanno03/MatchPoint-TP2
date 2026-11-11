import ModeloMem from './politicasMem.js'
import ModeloSupabase from './politicasSupabase.js'


class ModelFactory {
    static get(tipo) {
        switch (tipo) {
            case 'MEM':
                console.log('*** Persistiendo en Memoria (politicas) ***')
                return new ModeloMem()

            case 'SUPABASE':
                console.log('*** Persistiendo en Supabase (politicas) ***')
                return new ModeloSupabase()

            default:
                console.log('*** Persistiendo en Memoria (default) (politicas) ***')
                return new ModeloMem()
        }
    }
}

export default ModelFactory