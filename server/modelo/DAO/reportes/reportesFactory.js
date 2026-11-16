import ModeloMem from './reportesMem.js'
import ModeloSupabase from './reportesSupabase.js'

class ModelFactory {
    static get(tipo) {
        switch (tipo) {
            case 'MEM': return new ModeloMem()
            case 'SUPABASE': return new ModeloSupabase()
            default: throw new Error(`Persistencia no soportada: ${tipo}`)
        }
    }
}

export default ModelFactory
