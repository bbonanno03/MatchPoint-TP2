// Pronostico real: se lo pide a la API de Open-Meteo (gratis, sin API key).
// Documentacion: https://open-meteo.com/en/docs
class ClimaOpenMeteo {
    #url = null

    constructor(url = 'https://api.open-meteo.com/v1/forecast') {
        this.#url = url
    }

    // Error 502: el problema es de la API externa, no del pedido del usuario
    #errorApi = mensaje => {
        const error = new Error(mensaje)
        error.status = 502
        return error
    }

    obtenerPronostico = async ({ latitude, longitude, fecha, hora }) => {
        const parametros = new URLSearchParams({
            latitude,
            longitude,
            hourly: 'temperature_2m,precipitation_probability,wind_speed_10m',
            timezone: 'America/Argentina/Buenos_Aires',
            start_date: fecha,
            end_date: fecha
        })

        let datos = null
        try {
            const respuesta = await fetch(`${this.#url}?${parametros}`)
            if (!respuesta.ok) throw new Error(`respondio ${respuesta.status}`)
            datos = await respuesta.json()
        }
        catch (error) {
            throw this.#errorApi(`No se pudo consultar el clima: ${error.message}`)
        }

        // Open-Meteo devuelve un dato por hora: buscamos la hora del turno (19:30 -> 19:00)
        const horaRedonda = `${fecha}T${hora.slice(0, 2)}:00`
        const indice = datos.hourly?.time?.indexOf(horaRedonda)
        if (indice == undefined || indice == -1) throw this.#errorApi('No hay pronostico para esa fecha y hora')

        return {
            temperatura: datos.hourly.temperature_2m[indice],
            probabilidadLluvia: datos.hourly.precipitation_probability[indice],
            viento: datos.hourly.wind_speed_10m[indice]
        }
    }
}

export default ClimaOpenMeteo