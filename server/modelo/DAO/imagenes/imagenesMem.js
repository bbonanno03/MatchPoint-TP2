// Guarda las imagenes en memoria (tests y desarrollo sin Supabase).
// La URL que devuelve es de ejemplo: no se sirve el archivo.
class ImagenesMem {
    #imagenes = new Map()

    guardarImagen = async ({ nombre, buffer, tipo }) => {
        this.#imagenes.set(nombre, { buffer, tipo })
        return `memoria://canchas/${nombre}`
    }

    obtenerImagen = async nombre => this.#imagenes.get(nombre) || null
}

export default ImagenesMem
