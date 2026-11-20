import assert from 'assert'
import Imagen, { TAMANIO_MAXIMO } from '../modelo/Imagen.js'

// Test unitario: prueba solo la clase Imagen, sin servidor ni base de datos.

// Buffers minimos con la "firma" de cada formato, completados con ceros
const conFirma = bytes => Buffer.concat([Buffer.from(bytes), Buffer.alloc(20)])
const JPG = conFirma([0xFF, 0xD8, 0xFF, 0xE0])
const PNG = conFirma([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(20)])
const TEXTO = Buffer.from('esto es un archivo de texto, no una imagen')

const archivo = (buffer, size = buffer.length) => ({ buffer, size })

describe('Imagen (test unitario)', () => {

    describe('detectarFormato', () => {
        it('reconoce un JPG por sus primeros bytes', () => {
            assert.deepStrictEqual(Imagen.detectarFormato(JPG), { tipo: 'image/jpeg', extension: 'jpg' })
        })

        it('reconoce un PNG', () => {
            assert.deepStrictEqual(Imagen.detectarFormato(PNG), { tipo: 'image/png', extension: 'png' })
        })

        it('reconoce un WEBP', () => {
            assert.deepStrictEqual(Imagen.detectarFormato(WEBP), { tipo: 'image/webp', extension: 'webp' })
        })

        it('devuelve null para un archivo de texto', () => {
            assert.strictEqual(Imagen.detectarFormato(TEXTO), null)
        })

        it('devuelve null para un archivo vacio', () => {
            assert.strictEqual(Imagen.detectarFormato(Buffer.alloc(0)), null)
        })
    })

    describe('validar', () => {
        it('acepta una imagen valida y devuelve su formato', () => {
            assert.strictEqual(Imagen.validar(archivo(PNG)).extension, 'png')
        })

        it('sin archivo lanza un error 400', () => {
            assert.throws(() => Imagen.validar(undefined), error => error.status == 400)
        })

        it('con mas de 2 MB lanza un error 413', () => {
            assert.throws(() => Imagen.validar(archivo(JPG, TAMANIO_MAXIMO + 1)), error => error.status == 413)
        })

        it('con un archivo que no es imagen lanza un error 415', () => {
            assert.throws(() => Imagen.validar(archivo(TEXTO)), error => error.status == 415)
        })
    })
})
