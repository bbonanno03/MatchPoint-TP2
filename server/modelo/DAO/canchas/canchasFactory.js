import ModeloMem from './canchasMem.js'


class ModelFactory {
    static get(tipo) {
        switch (tipo) {
            case 'MEM':
                console.log('*** Persistiendo en Memoria (canchas) ***')
                return new ModeloMem()

            default:
                console.log('*** Persistiendo en Memoria (default) (canchas) ***')
                return new ModeloMem()
        }
    }
}

export default ModelFactory
