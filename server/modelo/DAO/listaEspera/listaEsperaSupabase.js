import CnxSupabase from '../CnxSupabase.js'

class ModeloSupabase {
    #tabla = () => CnxSupabase.cliente.from('waiting_list')

    // Adaptador de lectura de reservations; no implementa el ABM de la tarea 2.2.
    obtenerReservaTurno = async ({ court_id, reservation_date, start_time }) => {
        const { data, error } = await CnxSupabase.cliente.from('reservations')
            .select('id').eq('court_id', court_id).eq('reservation_date', reservation_date)
            .eq('start_time', `${start_time}:00`).in('status', ['active', 'confirmed']).limit(1)
        if (error) throw new Error(error.message)
        return data[0] || null
    }

    obtenerPropias = async userId => {
        const { data, error } = await this.#tabla().select('*').eq('user_id', userId)
            .order('created_at').order('id')
        if (error) throw new Error(error.message)
        return data
    }

    obtenerEnEsperaPorTurno = async ({ court_id, reservation_date, start_time }) => {
        const { data, error } = await this.#tabla().select('user_id, profiles(email)')
            .eq('court_id', court_id).eq('reservation_date', reservation_date)
            .eq('start_time', `${start_time}:00`).order('created_at').order('id')
        if (error) throw new Error(error.message)
        return data.map(i => ({ user_id: i.user_id, email: i.profiles?.email }))
    }

    guardarInscripcion = async inscripcion => {
        const { data, error } = await this.#tabla().insert(inscripcion).select().single()
        if (error?.code === '23505') {
            throw Object.assign(new Error('Ya estas en la lista de espera de ese turno'), { status: 409 })
        }
        if (error) throw new Error(error.message)
        return data
    }

    borrarInscripcion = async (id, userId) => {
        const { data, error } = await this.#tabla().delete().eq('id', id)
            .eq('user_id', userId).select().maybeSingle()
        if (error) throw new Error(error.message)
        return data
    }
}

export default ModeloSupabase
