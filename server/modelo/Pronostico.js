// Pronostico del clima para un turno y la recomendacion para el jugador
class Pronostico {
    temperatura = null
    probabilidadLluvia = null
    viento = null

    constructor({ temperatura, probabilidadLluvia, viento }) {
        this.temperatura = temperatura
        this.probabilidadLluvia = probabilidadLluvia
        this.viento = viento
    }

    // El orden importa: primero lo que impide jugar (lluvia), despues lo que molesta
    recomendacion() {
        if (this.probabilidadLluvia >= 50) return 'Probable lluvia: mejor reservar una cancha techada'
        if (this.viento >= 30) return 'Mucho viento: puede complicar el juego'
        if (this.temperatura >= 32) return 'Mucho calor: lleva agua y protector solar'
        if (this.temperatura <= 8) return 'Hace frio: veni abrigado'
        return 'Buen dia para jugar'
    }

    get() {
        return {
            temperatura: this.temperatura,
            probabilidadLluvia: this.probabilidadLluvia,
            viento: this.viento,
            recomendacion: this.recomendacion()
        }
    }
}

export default Pronostico