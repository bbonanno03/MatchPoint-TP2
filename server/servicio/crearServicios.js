import config from '../config.js'
import CanchasFactory from '../modelo/DAO/canchas/canchasFactory.js'
import ReservasFactory from '../modelo/DAO/reservas/reservasFactory.js'
import ListaEsperaFactory from '../modelo/DAO/listaEspera/listaEsperaFactory.js'
import ReportesFactory from '../modelo/DAO/reportes/reportesFactory.js'
import AuthFactory from '../modelo/DAO/auth/authFactory.js'
import ServicioCanchas from './canchas.js'
import ServicioReservas from './reservas.js'
import ServicioListaEspera from './listaEspera.js'
import ServicioReportes from './reportes.js'

// Una composicion por servidor: todos los routers ven los mismos datos MEM,
// sin convertir los DAOs en singletons globales que contaminen otros servidores.
export default function crearServicios({ correo, registrarAviso } = {}) {
    const tipo = config.MODO_PERSISTENCIA
    const canchas = CanchasFactory.get(tipo)
    const reservas = ReservasFactory.get(tipo)
    const usuarios = AuthFactory.get(tipo)
    const modeloLista = ListaEsperaFactory.get(tipo, { reservas, usuarios })
    const listaEspera = new ServicioListaEspera({ modelo: modeloLista, canchas, correo, tipo })
    return {
        canchas: new ServicioCanchas({ modelo: canchas, reservas: tipo === 'MEM' ? reservas : undefined }),
        reservas: new ServicioReservas({ modelo: reservas, canchas, listaEspera, registrarAviso }),
        listaEspera,
        reportes: new ServicioReportes({ modelo: ReportesFactory.get(tipo, { reservas, canchas }), tipo }),
    }
}
