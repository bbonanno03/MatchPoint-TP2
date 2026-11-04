import ModeloMem from './canchasMem.js'
import ModeloSupabase from './canchasSupabase.js'


class ModelFactory {
    static get(tipo) {
        switch (tipo) {
            case 'MEM':
                console.log('*** Persistiendo en Memoria (canchas) ***')
                return new ModeloMem()

            case 'SUPABASE':
                console.log('*** Persistiendo en Supabase (canchas) ***')
                return new ModeloSupabase()

            default:
                console.log('*** Persistiendo en Memoria (default) (canchas) ***')
                return new ModeloMem()
        }
    }
}

export default ModelFactory
