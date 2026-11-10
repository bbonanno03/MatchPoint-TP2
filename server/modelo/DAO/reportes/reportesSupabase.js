import CnxSupabase from '../CnxSupabase.js'

class ModeloSupabase {
    obtenerReservasPeriodo = async ({ desde, hasta }) => {
        const reservas = []
        const tamanioPagina = 500
        // Paginar para no truncar el Excel al limite de filas de PostgREST.
        for (let inicio = 0; ; inicio += tamanioPagina) {
            const { data, error } = await CnxSupabase.cliente.from('reservations')
                .select('id, user_id, court_id, reservation_date, start_time, end_time, status, courts(name, price)')
                .gte('reservation_date', desde).lte('reservation_date', hasta)
                .order('reservation_date').order('id').range(inicio, inicio + tamanioPagina - 1)
            if (error) throw new Error(error.message)
            reservas.push(...data)
            if (data.length < tamanioPagina) return reservas
        }
    }
}

export default ModeloSupabase
