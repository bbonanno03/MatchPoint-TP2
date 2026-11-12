import ExcelJS from 'exceljs'
import config from '../config.js'
import ModelFactory from '../modelo/DAO/reportes/reportesFactory.js'
import { validarPeriodo } from '../modelo/ReporteReservas.js'

const minutos = hora => {
    if (typeof hora !== 'string' || !/^(?:([01]\d|2[0-3]):[0-5]\d(?::00)?|24:00(?::00)?)$/.test(hora)) {
        throw new Error('Horario de reserva invalido en los datos del reporte')
    }
    const [h, m] = hora.split(':').map(Number)
    return h * 60 + m
}

class Servicio {
    #modelo

    constructor({ modelo, tipo = config.MODO_PERSISTENCIA } = {}) {
        this.#modelo = modelo || ModelFactory.get(tipo)
    }

    generarReservas = async query => {
        const periodo = validarPeriodo(query)
        const reservas = await this.#modelo.obtenerReservasPeriodo(periodo)
        const libro = new ExcelJS.Workbook()
        libro.creator = 'MatchPoint'
        libro.subject = `Reservas del ${periodo.desde} al ${periodo.hasta}`
        const detalle = libro.addWorksheet('Reservas')
        detalle.columns = [
            { header: 'Reserva', key: 'id', width: 38 },
            { header: 'Usuario', key: 'user_id', width: 38 },
            { header: 'Cancha ID', key: 'court_id', width: 38 },
            { header: 'Cancha', key: 'cancha', width: 28 },
            { header: 'Fecha', key: 'reservation_date', width: 14 },
            { header: 'Inicio', key: 'start_time', width: 12 },
            { header: 'Fin', key: 'end_time', width: 12 },
            { header: 'Estado', key: 'status', width: 16 },
            { header: 'Horas de ocupacion', key: 'horas', width: 22 },
            { header: 'Tarifa actual / hora', key: 'tarifa', width: 24 },
            { header: 'Ingreso estimado', key: 'ingreso', width: 22 },
        ]
        const porCancha = new Map()
        for (const reserva of reservas) {
            const { court_id, courts } = reserva
            const tarifa = Number(courts?.price)
            const duracion = minutos(reserva.end_time) - minutos(reserva.start_time)
            if (!courts?.name || courts.price == null || !Number.isFinite(tarifa) || tarifa < 0 || duracion <= 0) {
                throw new Error('Cancha, tarifa o duracion invalida en los datos del reporte')
            }
            if (!['active', 'confirmed', 'completed', 'cancelled'].includes(reserva.status)) {
                throw new Error('Estado de reserva invalido en los datos del reporte')
            }
            const ocupa = ['active', 'confirmed', 'completed'].includes(reserva.status)
            const horas = ocupa ? duracion / 60 : 0
            // Acumular centavos enteros para evitar errores al sumar importes.
            const centavos = ocupa ? Math.round(tarifa * 100 * duracion / 60) : 0
            detalle.addRow({
                ...reserva, cancha: courts.name, horas, tarifa, ingreso: centavos / 100,
                start_time: reserva.start_time.slice(0, 5), end_time: reserva.end_time.slice(0, 5),
            })
            if (!porCancha.has(court_id)) porCancha.set(court_id, {
                court_id, cancha: courts.name, reservas: 0, canceladas: 0, ocupadas: 0, minutos: 0, centavos: 0,
            })
            const fila = porCancha.get(court_id)
            fila.reservas++
            if (reserva.status === 'cancelled') fila.canceladas++
            if (ocupa) { fila.ocupadas++; fila.minutos += duracion; fila.centavos += centavos }
        }

        const resumen = libro.addWorksheet('Resumen')
        resumen.columns = [
            { header: 'Cancha ID', key: 'court_id', width: 38 },
            { header: 'Cancha', key: 'cancha', width: 30 },
            { header: 'Reservas del periodo', key: 'reservas', width: 24 },
            { header: 'Canceladas', key: 'canceladas', width: 16 },
            { header: 'Reservas no canceladas', key: 'ocupadas', width: 26 },
            { header: 'Horas ocupadas', key: 'horas', width: 20 },
            { header: 'Ingresos estimados', key: 'ingreso', width: 24 },
        ]
        const totales = { cancha: 'TOTAL', reservas: 0, canceladas: 0, ocupadas: 0, minutos: 0, centavos: 0 }
        for (const fila of [...porCancha.values()].sort((a, b) => a.cancha.localeCompare(b.cancha) || a.court_id.localeCompare(b.court_id))) {
            resumen.addRow({ ...fila, horas: fila.minutos / 60, ingreso: fila.centavos / 100 })
            for (const campo of ['reservas', 'canceladas', 'ocupadas', 'minutos', 'centavos']) totales[campo] += fila[campo]
        }
        resumen.addRow({ ...totales, horas: totales.minutos / 60, ingreso: totales.centavos / 100 }).font = { bold: true }
        resumen.addRow([])
        resumen.addRow({ cancha: `Periodo inclusivo: ${periodo.desde} a ${periodo.hasta}` })
        resumen.addRow({ cancha: 'Ocupacion: reservas active, confirmed y completed; canceladas excluidas.' })
        resumen.addRow({ cancha: 'Ingresos estimados con la tarifa actual por hora; no representan pagos registrados.' })
        resumen.addRow({ cancha: 'Se resumen las canchas con reservas en el periodo. Sin reservas, el total es cero.' })
        for (const hoja of [detalle, resumen]) {
            hoja.getRow(1).font = { bold: true }
            hoja.views = [{ state: 'frozen', ySplit: 1 }]
        }
        detalle.autoFilter = { from: 'A1', to: `K${Math.max(detalle.rowCount, 1)}` }
        detalle.getColumn('horas').numFmt = '0.00'
        detalle.getColumn('tarifa').numFmt = '#,##0.00'
        detalle.getColumn('ingreso').numFmt = '#,##0.00'
        resumen.getColumn('horas').numFmt = '0.00'
        resumen.getColumn('ingreso').numFmt = '#,##0.00'
        return {
            archivo: Buffer.from(await libro.xlsx.writeBuffer()),
            nombre: `reservas_${periodo.desde}_${periodo.hasta}.xlsx`,
        }
    }
}

export default Servicio
