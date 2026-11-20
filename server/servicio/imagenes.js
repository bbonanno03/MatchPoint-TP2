import ImagenesFactory from '../modelo/DAO/imagenes/imagenesFactory.js'
import Imagen from '../modelo/Imagen.js'
import config from '../config.js'


class Servicio {
    #canchas = null       // servicio de canchas (el mismo que usa /api/canchas)
    #imagenes = null      // DAO de imagenes: memoria o Supabase Storage

    constructor({ canchas, imagenes }) {
        this.#canchas = canchas
        this.#imagenes = imagenes || ImagenesFactory.get(config.MODO_PERSISTENCIA)
    }

    // 1. valida la imagen  2. verifica que exista la cancha  3. sube el archivo  4. guarda la URL en la cancha
    subirImagen = async (id, archivo) => {
        const formato = Imagen.validar(archivo)
        await this.#canchas.obtenerCancha(id)                  // 404 si no existe

        const nombre = `cancha-${id}-${Date.now()}.${formato.extension}`
        const url = await this.#imagenes.guardarImagen({ nombre, buffer: archivo.buffer, tipo: formato.tipo })

        return await this.#canchas.guardarImagenUrl(id, url)
    }
}

export default Servicio
