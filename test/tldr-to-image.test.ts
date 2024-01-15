import { tldrawToImage } from '../src/lib/tldraw-to-image'
import { expectFileToBeValid } from './utilities/file'
import { randomId } from './utilities/random'
import { mkdirSync, rmSync, rmdirSync } from 'node:fs'
import { expect, it } from 'vitest'

const tldrTestFilePath = './test/assets/test-sketch.tldr'

// TODO snapshots
const tldrTestFileHashSvg = 'd944e73a5439bf5a05358edf4456374d6077ee26dbc6c6ed08ccd354b54cd088'
const tldrTestFileHashPng = '8ab6fd1f2408a07bf053cadc920ab55536822f825256f81f74f0df3c72eb2cc3'

it('should convert the tldr file to an svg in the current folder by default', async () => {
	const savedImageFileName = await tldrawToImage(tldrTestFilePath)
	expect(savedImageFileName).toBe(`${process.cwd()}/test-sketch.svg`)

	expectFileToBeValid(savedImageFileName, 'svg', tldrTestFileHashSvg)

	rmSync(savedImageFileName)
})

it('should convert the tldr file to an svg when specified', async () => {
	const savedImageFileName = await tldrawToImage(tldrTestFilePath, 'svg')
	expect(savedImageFileName).toBe(`${process.cwd()}/test-sketch.svg`)

	expectFileToBeValid(savedImageFileName, 'svg', tldrTestFileHashSvg)

	rmSync(savedImageFileName)
})

it('should convert the tldr file to a png when specified', async () => {
	const savedImageFileName = await tldrawToImage(tldrTestFilePath, 'png')
	expect(savedImageFileName).toBe(`${process.cwd()}/test-sketch.png`)

	expectFileToBeValid(savedImageFileName, 'png', tldrTestFileHashPng)

	rmSync(savedImageFileName)
})

it('should save the file to a specific directory when specified', async () => {
	const randomPath = randomId()
	mkdirSync(randomPath)

	const savedImageFileName = await tldrawToImage(tldrTestFilePath, 'png', `./${randomPath}/`)
	expect(savedImageFileName).toBe(`${process.cwd()}/${randomPath}/test-sketch.png`)

	expectFileToBeValid(savedImageFileName, 'png', tldrTestFileHashPng)

	rmdirSync(randomPath, { recursive: true })
})
