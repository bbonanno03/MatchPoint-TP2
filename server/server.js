import express from 'express'
import { rutaNoEncontrada, manejarErrores } from './middlewares/errores.js'
import RouterPoliticas from './router/politicas.js'


class Server {
    #port = null
    #server = null

    constructor(port) {
        this.#port = port
    }

    start() {
        const app = express()

        app.use(express.json())
        app.use(express.urlencoded({ extended: true }))

        /* --------------------------------- */
        /*         Estado del servidor       */
        /* --------------------------------- */
        app.get('/api/health', (req, res) => {
            res.json({ estado: 'ok' })
        })

        /* --------------------------------- */
        /*       APIRestful: politicas       */     
        /* --------------------------------- */
        app.use('/api/politicas', new RouterPoliticas().config())

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