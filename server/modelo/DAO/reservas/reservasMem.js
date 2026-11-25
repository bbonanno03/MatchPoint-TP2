// Persistencia en memoria: se usa en los tests y para desarrollar sin base de datos.
// Mismos campos que la tabla "reservations" de Supabase.
class ModeloMem {
    #reservas = []

    #getIndex = id => this.#reservas.findIndex(r => r.id == id)

    obtenerReservas = async () => this.#reservas

    obtenerReserva = async id => {
        const reserva = this.#reservas.find(r => r.id == id)
        return reserva || null
    }

    guardarReserva = async reserva => {
        // Comprobacion y escritura sincronicas: dos altas no pueden ocupar el mismo intervalo.
        const minutos = hora => { const [h, m] = hora.split(':').map(Number); return h * 60 + m }
        if (this.#reservas.some(r => ['active', 'confirmed'].includes(r.status) && r.court_id === reserva.court_id &&
            r.reservation_date === reserva.reservation_date && minutos(r.start_time) < minutos(reserva.end_time) &&
            minutos(reserva.start_time) < minutos(r.end_time))) {
            throw Object.assign(new Error('El turno ya esta ocupado'), { status: 409, code: 'TURNO_OCUPADO' })
        }
        reserva.id = String(parseInt(this.#reservas[this.#reservas.length - 1]?.id || 0) + 1)
        reserva.created_at = new Date().toISOString()
        this.#reservas.push(reserva)
        return reserva
    }

    // Cancelar no borra la reserva: le cambia el estado a "cancelled" (queda en el historial)
    cancelarReserva = async id => {
        const index = this.#getIndex(id)
        if (index == -1) return null
        if (this.#reservas[index].status === 'cancelled') return null

        const reservaAct = { ...this.#reservas[index], status: 'cancelled' }
        this.#reservas.splice(index, 1, reservaAct)
        return reservaAct
    }
}

export default ModeloMem
