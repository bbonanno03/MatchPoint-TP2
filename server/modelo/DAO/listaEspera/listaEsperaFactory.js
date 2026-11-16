import ModeloMem from './listaEsperaMem.js'
import ModeloSupabase from './listaEsperaSupabase.js'

class ModelFactory {
    static get(tipo) {
        switch (tipo) {
            case 'SUPABASE': return new ModeloSupabase()
            case 'MEM': return new ModeloMem()
            default: throw new Error(`Persistencia no soportada: ${tipo}`)
        }
    }
}

export default ModelFactory
