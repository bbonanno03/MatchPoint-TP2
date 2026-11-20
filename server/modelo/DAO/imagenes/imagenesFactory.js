import ImagenesMem from './imagenesMem.js'
import ImagenesSupabase from './imagenesSupabase.js'


class ImagenesFactory {
    static get(tipo) {
        switch (tipo) {
            case 'SUPABASE':
                console.log('*** Imagenes en Supabase Storage ***')
                return new ImagenesSupabase()

            default:
                console.log('*** Imagenes en Memoria ***')
                return new ImagenesMem()
        }
    }
}

export default ImagenesFactory
