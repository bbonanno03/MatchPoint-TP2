import ModeloMem from './listaEsperaMem.js'
import ModeloSupabase from './listaEsperaSupabase.js'

class ModelFactory {
    static get(tipo, { reservas, usuarios } = {}) {
        switch (tipo) {
            case 'SUPABASE': return new ModeloSupabase()
            case 'MEM': return new ModeloMem(reservas, usuarios)
            default: throw new Error(`Persistencia no soportada: ${tipo}`)
        }
    }
}

export default ModelFactory
