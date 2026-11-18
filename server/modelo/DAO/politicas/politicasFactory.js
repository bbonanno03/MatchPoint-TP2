import ModeloMem from './politicasMem.js'
import ModeloSupabase from './politicasSupabase.js'


class ModelFactory {
    // Una sola instancia por tipo: asi las politicas que cambia el admin
    // son las mismas que usa el servicio de reservas (importante en memoria)
    static #instancias = {}

    static get(tipo) {
        if (!ModelFactory.#instancias[tipo]) {
            ModelFactory.#instancias[tipo] = ModelFactory.#crear(tipo)
        }
        return ModelFactory.#instancias[tipo]
    }

    static #crear(tipo) {
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