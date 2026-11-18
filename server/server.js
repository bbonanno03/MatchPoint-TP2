import express from 'express'
import crearServicios from './servicio/crearServicios.js'
import RouterCanchas from './router/canchas.js'
import RouterListaEspera from './router/listaEspera.js'
import RouterReportes from './router/reportes.js'
import { rutaNoEncontrada, manejarErrores } from './middlewares/errores.js'
import RouterPoliticas from './router/politicas.js'
import RouterReservas from './router/reservas.js'

class Server {                          
    #port = null
    #server = null

    #opciones

    constructor(port, opciones = {}) {
        this.#port = port
        this.#opciones = opciones
    }

    start() {
        const app = express()
        const servicios = crearServicios(this.#opciones)

        app.use(express.json())
        app.use(express.urlencoded({ extended: true }))

        /* --------------------------------- */
        /*         Estado del servidor       */
        /* --------------------------------- */
        app.get('/api/health', (req, res) => {
            res.json({ estado: 'ok' })
        })

          /* --------------------------------- */
        /*          APIRest: canchas         */
        /* --------------------------------- */
        app.use('/api/canchas', new RouterCanchas(servicios.canchas).config())
        app.use('/api/lista-espera', new RouterListaEspera(servicios.listaEspera).router)
        app.use('/api/reportes', new RouterReportes(servicios.reportes).router)

        
        /*       APIRestful: politicas       */
        /* --------------------------------- */
        app.use('/api/politicas', new RouterPoliticas().config())

        /* --------------------------------- */
        /*       APIRestful: reservas        */
        /* --------------------------------- */
        app.use('/api/reservas', new RouterReservas(servicios.reservas).config())

        /* --------------------------------- */
        /*        404 y manejo de errores    */
        /* --------------------------------- */
        
        // Van al final: solo se ejecutan si ninguna ruta anterior respondio
        app.use(rutaNoEncontrada)
        app.use(manejarErrores)

        // Devuelvo  una promesa para poder esperar a que el servidor escuche 
        return new Promise((resolve, reject) => {
            this.#server = app.listen(this.#port, () => {
                console.log(`Servidor MatchPoint escuchando en http://localhost:${this.#port}`)
                resolve(this.#server)
            })
            this.#server.on('error', error => {
                console.log(`Error en servidor: ${error.message}`)
                reject(error)
            })
        })
    }

    stop() {
        return new Promise(resolve => this.#server.close(() => resolve()))
    }
}

export default Server