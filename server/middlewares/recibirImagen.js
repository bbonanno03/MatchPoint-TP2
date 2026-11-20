import multer from 'multer'
import { ErrorHttp } from './errores.js'
import { TAMANIO_MAXIMO } from '../modelo/Imagen.js'


// multer lee el archivo de un pedido multipart/form-data y lo deja en req.file.
// memoryStorage: el archivo queda en memoria (req.file.buffer), no se guarda en disco.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: TAMANIO_MAXIMO, files: 1 },
})

// Recibe un archivo en el campo "imagen" y traduce los errores de multer a ErrorHttp
export const recibirImagen = (req, res, next) => {
    upload.single('imagen')(req, res, error => {
        if (!error) return next()

        if (error.code == 'LIMIT_FILE_SIZE') return next(new ErrorHttp(413, 'La imagen supera los 2 MB'))
        if (error instanceof multer.MulterError) {
            return next(new ErrorHttp(400, 'Enviar un solo archivo en el campo "imagen"'))
        }
        next(error)
    })
}
