import express from 'express'
import { manejarErrores } from '../../middlewares/errores.js'

export const iniciarHttp = async (ruta, router) => {
    const app = express()
    app.use(express.json())
    app.use(ruta, router)
    app.use(manejarErrores)
    const server = await new Promise((resolve, reject) => {
        const listener = app.listen(0, '127.0.0.1', () => resolve(listener))
        listener.once('error', reject)
    })
    return {
        cerrar: () => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
        pedir: async ({ method = 'GET', body, token = 'token-player', path = '' } = {}) => {
            const res = await fetch(`http://127.0.0.1:${server.address().port}${ruta}${path}`, {
                method,
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: body === undefined ? undefined : JSON.stringify(body),
            })
            const buffer = Buffer.from(await res.arrayBuffer())
            return {
                status: res.status,
                headers: res.headers,
                body: res.status === 204 ? null : res.headers.get('content-type')?.includes('application/json')
                    ? JSON.parse(buffer.toString()) : buffer,
            }
        },
    }
}
