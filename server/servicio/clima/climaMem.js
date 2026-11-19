// Pronostico falso y fijo: se usa en los tests y para desarrollar sin internet.
// Devuelve los mismos campos que la version real (Open-Meteo).
class ClimaMem {
    obtenerPronostico = async ({ latitude, longitude, fecha, hora }) => {
        return {
            temperatura: 22,            // grados
            probabilidadLluvia: 10,     // porcentaje
            viento: 12                  // km/h
        }
    }
}

export default ClimaMem