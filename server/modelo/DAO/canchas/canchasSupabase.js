import CnxSupabase from '../CnxSupabase.js'
import { ErrorHttp } from '../../../middlewares/errores.js'


// Persistencia en la tabla "courts" de Supabase.
// Supabase devuelve { data, error }: si hay error lo lanzamos para que lo atrape el controlador.
class ModeloSupabase {

    #tabla = () => CnxSupabase.cliente.from('courts')

    // En Supabase los id son UUID. Si llega otra cosa (por ejemplo /api/canchas/abc) la cancha
    // no puede existir: devolvemos null (404) en vez de mandar la consulta y que Postgres de error 500.
    #esUuid = id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    obtenerCanchas = async () => {
        const { data, error } = await this.#tabla().select('*').order('name')
        if (error) throw new Error(error.message)
        return data
    }

    obtenerCancha = async id => {
        if (!this.#esUuid(id)) return null

        // maybeSingle devuelve null (sin error) si no existe la cancha
        const { data, error } = await this.#tabla().select('*').eq('id', id).maybeSingle()
        if (error) throw new Error(error.message)
        return data
    }

    guardarCancha = async cancha => {
        const { data, error } = await this.#tabla().insert(cancha).select().single()
        if (error) throw new Error(error.message)
        return data
    }

    actualizarCancha = async (id, cancha) => {
        if (!this.#esUuid(id)) return null
        const { data, error } = await this.#tabla().update(cancha).eq('id', id).select().maybeSingle()
        if (error) throw new Error(error.message)
        return data
    }

    borrarCancha = async id => {
        if (!this.#esUuid(id)) return null
        const { data, error } = await this.#tabla().delete().eq('id', id).select().maybeSingle()
        // 23503 = la cancha tiene reservas o resenas que la referencian (clave foranea)
        if (error?.code == '23503') {
            throw new ErrorHttp(409, 'La cancha tiene reservas asociadas: desactivala con active=false en lugar de borrarla')
        }
        if (error) throw new Error(error.message)
        return data
    }
}

export default ModeloSupabase
