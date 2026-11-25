import CnxSupabase from '../CnxSupabase.js'


const BUCKET = 'canchas'     // se crea con sql/003_bucket_imagenes_canchas.sql

// Sube la imagen a Supabase Storage y devuelve su URL publica
class ImagenesSupabase {
    guardarImagen = async ({ nombre, buffer, tipo }) => {
        const storage = CnxSupabase.cliente.storage.from(BUCKET)

        const { error } = await storage.upload(nombre, buffer, { contentType: tipo, upsert: true })
        if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`)

        const { data } = storage.getPublicUrl(nombre)
        return data.publicUrl
    }
}

export default ImagenesSupabase
