// Persistencia en memoria: se usa en los tests y para desarrollar sin base de datos.
// Los campos son los mismos que la tabla "courts" de Supabase.
class ModeloMem {
    #canchas = []

    constructor() {
        this.#canchas = [
            // covered: true = techada, false = al aire libre (ver sql/01_canchas_techada_ubicacion.sql)
            { id: '1', name: 'Cancha Padel 1', sport: 'Padel', club: 'MatchPoint Club', location: 'Villa Sarmiento', price: 12000, active: true, image_url: null, covered: true, latitude: -34.632, longitude: -58.563 },
            { id: '2', name: 'Cancha Tenis 1', sport: 'Tenis', club: 'MatchPoint Club', location: 'Villa Sarmiento', price: 15000, active: true, image_url: null, covered: false, latitude: -34.632, longitude: -58.563 },
        ]
    }

    #getIndex = id => this.#canchas.findIndex(c => c.id == id)

    obtenerCanchas = async () => this.#canchas

    obtenerCancha = async id => {
        const cancha = this.#canchas.find(c => c.id == id)
        return cancha || null
    }

    guardarCancha = async cancha => {
        cancha.id = String(parseInt(this.#canchas[this.#canchas.length - 1]?.id || 0) + 1)
        this.#canchas.push(cancha)
        return cancha
    }

    actualizarCancha = async (id, cancha) => {
        const index = this.#getIndex(id)
        if (index == -1) return null

        const canchaAct = { ...this.#canchas[index], ...cancha, id }
        this.#canchas.splice(index, 1, canchaAct)
        return canchaAct
    }

    borrarCancha = async id => {
        const index = this.#getIndex(id)
        if (index == -1) return null

        return this.#canchas.splice(index, 1)[0]
    }
}

export default ModeloMem
