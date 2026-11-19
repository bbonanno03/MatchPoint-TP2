import ClimaMem from './climaMem.js'
import ClimaOpenMeteo from './climaOpenMeteo.js'


class ClimaFactory {
    static get(tipo) {
        switch (tipo) {
            case 'MEM':
                console.log('*** Clima falso en Memoria ***')
                return new ClimaMem()

            case 'OPENMETEO':
                console.log('*** Clima real de Open-Meteo ***')
                return new ClimaOpenMeteo()

            default:
                console.log('*** Clima real de Open-Meteo (default) ***')
                return new ClimaOpenMeteo()
        }
    }
}

export default ClimaFactory