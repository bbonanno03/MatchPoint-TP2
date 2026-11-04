import AuthFactory from '../modelo/DAO/auth/authFactory.js'
import config from '../config.js'


// Uso en un router:
//   const auth = new Auth()
//   router.post('/', auth.autenticar, auth.soloAdmin, this.#controlador.guardarCancha)
class Auth {
    #modelo = null

    constructor() {
        this.#modelo = AuthFactory.get(config.MODO_PERSISTENCIA)
    }

    // Lee el header "Authorization: Bearer <token>" y deja el usuario en req.usuario
    autenticar = async (req, res, next) => {
        try {
            const header = req.headers.authorization || ''
            const [tipo, token] = header.split(' ')

            if (tipo != 'Bearer' || !token) {
                return res.status(401).json({ error: 'Falta el token de autenticacion' })
            }

            const usuario = await this.#modelo.obtenerUsuarioPorToken(token)
            if (!usuario || !usuario.active) {
                return res.status(401).json({ error: 'Token invalido o usuario inactivo' })
            }

            req.usuario = usuario
            next()
        }
        catch (error) {
            res.status(500).json({ url: req.url, method: req.method, error: error.message })
        }
    }

    // Se usa despues de autenticar
    soloAdmin = (req, res, next) => {
        if (req.usuario?.role != 'admin') {
            return res.status(403).json({ error: 'Solo un administrador puede realizar esta accion' })
        }
        next()
    }
}

export default Auth
