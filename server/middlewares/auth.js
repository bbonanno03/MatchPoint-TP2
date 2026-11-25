import AuthFactory from '../modelo/DAO/auth/authFactory.js'
import config from '../config.js'


// Uso en un router:
//   const auth = new Auth()
//   router.post('/', auth.autenticar, auth.soloAdmin, this.#controlador.guardarCancha)
class Auth {
    #modelo = null
    #tipo

    constructor() {
        this.#tipo = config.MODO_PERSISTENCIA
        this.#modelo = AuthFactory.get(this.#tipo)
    }

    // Lee el header "Authorization: Bearer <token>" y deja el usuario en req.usuario
    autenticar = async (req, res, next) => {
        try {
            const header = req.headers.authorization || ''
            const [tipo, token] = header.split(' ')

            if (tipo != 'Bearer' || !token) {
                return res.status(401).json({ error: 'Falta el token de autenticacion' })
            }

            if (this.#tipo === 'MEM' && token.split('.').length === 3) {
                return res.status(503).json({ code: 'API_MODO_MEM', error: 'El servicio de reservas esta en modo de pruebas y no admite cuentas reales. Contacta al administrador para habilitar las reservas.' })
            }
            const usuario = await this.#modelo.obtenerUsuarioPorToken(token)
            if (!usuario) {
                return res.status(401).json({ code: 'TOKEN_INVALIDO', error: 'Token invalido' })
            }
            if (!usuario.active) {
                return res.status(403).json({ code: 'USUARIO_INACTIVO', error: 'Tu usuario esta deshabilitado. Consulta con el administrador.' })
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
