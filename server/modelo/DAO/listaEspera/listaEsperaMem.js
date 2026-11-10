import { randomUUID } from 'node:crypto'

class ModeloMem {
    #inscripciones = []
    #reservas

    // Consulta de ocupacion provisoria hasta integrar el DAO de reservas (tarea 2.2).
    // Sin datos ficticios en produccion; las pruebas pueden inyectar reservas.
    constructor(reservas = []) {
        this.#reservas = reservas
    }

    obtenerReservaTurno = async ({ court_id, reservation_date, start_time }) => {
        return this.#reservas.find(r => r.court_id === court_id &&
            r.reservation_date === reservation_date && r.start_time.slice(0, 5) === start_time &&
            ['active', 'confirmed'].includes(r.status)) || null
    }

    obtenerPropias = async userId => this.#inscripciones
        .filter(i => i.user_id === userId).map(i => ({ ...i }))

    guardarInscripcion = async inscripcion => {
        // Sin await entre la comprobacion y el alta: protege altas simultaneas en MEM.
        const repetida = this.#inscripciones.some(i => i.user_id === inscripcion.user_id &&
            i.court_id === inscripcion.court_id && i.reservation_date === inscripcion.reservation_date &&
            i.start_time === inscripcion.start_time)
        if (repetida) throw Object.assign(new Error('Ya estas en la lista de espera de ese turno'), { status: 409 })

        const nueva = { ...inscripcion, id: randomUUID(), created_at: new Date().toISOString() }
        this.#inscripciones.push(nueva)
        return { ...nueva }
    }

    borrarInscripcion = async (id, userId) => {
        const index = this.#inscripciones.findIndex(i => i.id === id && i.user_id === userId)
        if (index === -1) return null
        return { ...this.#inscripciones.splice(index, 1)[0] }
    }
}

export default ModeloMem
