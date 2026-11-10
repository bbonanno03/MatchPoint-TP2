import express from 'express'
import RouterListaEspera from './router/listaEspera.js'
import { rutaNoEncontrada, manejarErrores } from './middlewares/errores.js'


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

        app.use('/api/lista-espera', new RouterListaEspera().router)

        /* --------------------------------- */
        /*        404 y manejo de errores    */
        /* --------------------------------- */
        // Van al final: solo se ejecutan si ninguna ruta anterior respondio
        app.use(rutaNoEncontrada)
        app.use(manejarErrores)

        // Devolvemos una promesa para poder esperar a que el servidor escuche (lo usan los tests)
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
