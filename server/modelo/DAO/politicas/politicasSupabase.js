import CnxSupabase from '../CnxSupabase.js'


// Persistencia en la tabla "policies" de Supabase (una sola fila).
class ModeloSupabase {

    #tabla = () => CnxSupabase.cliente.from('policies')

    // Postgres guarda las horas como "08:00:00": las dejamos en "08:00"
    #formatear = politicas => politicas && {
        ...politicas,
        opening_time: politicas.opening_time?.slice(0, 5),
        closing_time: politicas.closing_time?.slice(0, 5)
    }

    obtenerPoliticas = async () => {
        const { data, error } = await this.#tabla().select('*').limit(1).maybeSingle()
        if (error) throw new Error(error.message)
        return this.#formatear(data)
    }

    actualizarPoliticas = async politicas => {
        const actuales = await this.obtenerPoliticas()
        if (!actuales) throw new Error('No hay politicas cargadas en la base')

        const { data, error } = await this.#tabla()
            .update({ ...politicas, updated_at: new Date().toISOString() })
            .eq('id', actuales.id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return this.#formatear(data)
    }
}

export default ModeloSupabase