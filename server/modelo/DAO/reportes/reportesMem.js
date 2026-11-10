class ModeloMem {
    #reservas
    #canchas

    // Adaptador de lectura hasta integrar reservas (2.2). No inventa reservas.
    constructor({ reservas = [], canchas = [] } = {}) {
        this.#reservas = reservas
        this.#canchas = canchas
    }

    obtenerReservasPeriodo = async ({ desde, hasta }) => this.#reservas
        .filter(r => r.reservation_date >= desde && r.reservation_date <= hasta)
        .map(r => ({ ...r, courts: { ...this.#canchas.find(c => c.id === r.court_id) } }))
        .sort((a, b) => a.reservation_date.localeCompare(b.reservation_date) || String(a.id).localeCompare(String(b.id)))
}

export default ModeloMem
