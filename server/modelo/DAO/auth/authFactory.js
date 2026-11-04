import AuthMem from './authMem.js'
import AuthSupabase from './authSupabase.js'


class AuthFactory {
    static get(tipo) {
        switch (tipo) {
            case 'SUPABASE':
                return new AuthSupabase()

            default:
                return new AuthMem()
        }
    }
}

export default AuthFactory
