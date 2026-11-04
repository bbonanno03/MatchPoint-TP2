// Usuarios de prueba para el modo MEM: el "token" es un texto fijo.
// Permite probar rutas protegidas sin depender de Supabase.
class AuthMem {
    #usuarios = {
        'token-admin': { id: 'u1', name: 'Admin', email: 'admin@matchpoint.com', role: 'admin', active: true },
        'token-player': { id: 'u2', name: 'Jugador', email: 'player@matchpoint.com', role: 'player', active: true },
    }

    obtenerUsuarioPorToken = async token => this.#usuarios[token] || null
}

export default AuthMem
