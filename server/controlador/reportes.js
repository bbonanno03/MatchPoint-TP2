import Servicio from '../servicio/reportes.js'

class Controlador {
    #servicio

    constructor(servicio = new Servicio()) {
        this.#servicio = servicio
    }

    reservas = async (req, res) => {
        const { archivo, nombre } = await this.#servicio.generarReservas(req.query)
        res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.set('Content-Disposition', `attachment; filename="${nombre}"`)
        res.set('Cache-Control', 'no-store')
        res.send(archivo)
    }
}

export default Controlador
