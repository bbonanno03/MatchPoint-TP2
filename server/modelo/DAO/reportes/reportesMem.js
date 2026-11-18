class ModeloMem {
    #reservas
    #canchas

    // Consulta los DAOs compartidos en cada descarga para ver altas y cancelaciones.
    // Los tests unitarios tambien pueden inyectar arrays.
    constructor({ reservas = [], canchas = [] } = {}) {
        this.#reservas = reservas
        this.#canchas = canchas
    }

    obtenerReservasPeriodo = async ({ desde, hasta }) => {
        const reservas = Array.isArray(this.#reservas) ? this.#reservas : await this.#reservas.obtenerReservas()
        const canchas = Array.isArray(this.#canchas) ? this.#canchas : await this.#canchas.obtenerCanchas()
        return reservas.filter(r => r.reservation_date >= desde && r.reservation_date <= hasta)
            .map(r => ({ ...r, courts: { ...canchas.find(c => c.id === r.court_id) } }))
            .sort((a, b) => a.reservation_date.localeCompare(b.reservation_date) || String(a.id).localeCompare(String(b.id)))
    }
}

export default ModeloMem
