import CnxSupabase from '../CnxSupabase.js'


// Valida el token que Supabase Auth le dio al usuario al loguearse en el front
// y busca su perfil (con el rol) en la tabla "profiles".
class AuthSupabase {
    obtenerUsuarioPorToken = async token => {
        const { data, error } = await CnxSupabase.cliente.auth.getUser(token)
        if (error || !data.user) return null

        const { data: perfil, error: errorPerfil } = await CnxSupabase.cliente
            .from('profiles')
            .select('id, name, email, role, active')
            .eq('id', data.user.id)
            .maybeSingle()

        if (errorPerfil) throw new Error(errorPerfil.message)
        return perfil
    }
}

export default AuthSupabase
