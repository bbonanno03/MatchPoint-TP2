import { ErrorHttp } from '../middlewares/errores.js'


export const TAMANIO_MAXIMO = 2 * 1024 * 1024      // 2 MB

// Los primeros bytes de cada formato ("firma"). Sirven para no confiar solo en la
// extension o el tipo que manda el navegador: un .txt renombrado a .jpg no pasa.
const FIRMAS = [
    { tipo: 'image/jpeg', extension: 'jpg', es: b => b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF },
    { tipo: 'image/png', extension: 'png', es: b => b[0] == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47 },
    { tipo: 'image/webp', extension: 'webp', es: b => b.toString('ascii', 0, 4) == 'RIFF' && b.toString('ascii', 8, 12) == 'WEBP' },
]

class Imagen {
    // Devuelve { tipo, extension } segun el contenido real del archivo, o null si no es una imagen aceptada
    static detectarFormato(buffer) {
        if (!buffer || buffer.length < 12) return null
        const firma = FIRMAS.find(f => f.es(buffer))
        return firma ? { tipo: firma.tipo, extension: firma.extension } : null
    }

    // archivo: lo que deja multer en req.file ({ buffer, size, mimetype, ... })
    static validar(archivo) {
        if (!archivo) throw new ErrorHttp(400, 'Falta la imagen: enviala en el campo "imagen" (multipart/form-data)')
        if (archivo.size > TAMANIO_MAXIMO) throw new ErrorHttp(413, 'La imagen supera los 2 MB')

        const formato = Imagen.detectarFormato(archivo.buffer)
        if (!formato) throw new ErrorHttp(415, 'El archivo no es una imagen JPG, PNG o WEBP')
        return formato
    }
}

export default Imagen
