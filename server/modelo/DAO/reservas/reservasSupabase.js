import CnxSupabase from '../CnxSupabase.js'


// Persistencia en la tabla "reservations" de Supabase.
class ModeloSupabase {

    #tabla = () => CnxSupabase.cliente.from('reservations')

    // Postgres guarda las horas como "19:00:00": las dejamos en "19:00"
    #formatear = reserva => reserva && {
        ...reserva,
        start_time: reserva.start_time?.slice(0, 5),
        end_time: reserva.end_time?.slice(0, 5)
    }

    obtenerReservas = async () => {
        const { data, error } = await this.#tabla().select('*').order('reservation_date')
        if (error) throw new Error(error.message)
        return data.map(this.#formatear)
    }

    obtenerReserva = async id => {
        const { data, error } = await this.#tabla().select('*').eq('id', id).maybeSingle()
        if (error) throw new Error(error.message)
        return this.#formatear(data)
    }

    guardarReserva = async reserva => {
        const { data, error } = await this.#tabla().insert(reserva).select().single()
        if (error) throw new Error(error.message)
        return this.#formatear(data)
    }

    cancelarReserva = async id => {
        const { data, error } = await this.#tabla()
            .update({ status: 'cancelled' })
            .eq('id', id)
            .select()
            .maybeSingle()

        if (error) throw new Error(error.message)
        return this.#formatear(data)
    }
}

export default ModeloSupabase