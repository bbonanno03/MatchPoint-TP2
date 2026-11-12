
class ModeloMem {
    #politicas = null

    constructor() {
        this.#politicas = {
            id: '1',
            max_active_reservations: 5,
            cancellation_hours: 24,
            opening_time: '08:00',
            closing_time: '23:00',
            updated_at: new Date().toISOString()
        }
    }

    obtenerPoliticas = async () => this.#politicas

    actualizarPoliticas = async politicas => {
        this.#politicas = { ...this.#politicas, ...politicas, updated_at: new Date().toISOString() }
        return this.#politicas
    }
}

export default ModeloMem