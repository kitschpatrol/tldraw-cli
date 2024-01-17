import { tldrawToImage } from '../src/lib/tldraw-to-image'
import { expectFileToBeValid } from './utilities/file'
import { randomId } from './utilities/random'
import { mkdirSync, rmSync, rmdirSync } from 'node:fs'
import { expect, it } from 'vitest'

const cleanUp = true
const tldrawTestUrl = 'https://www.tldraw.com/s/v2_c_9nMYBwT8UQ99RGDWfGr8H'

it('should convert the tldraw url to an svg in the current folder by default', async () => {
	const savedImageFileName = await tldrawToImage(tldrawTestUrl)
	// TODO vet file names

	expectFileToBeValid(savedImageFileName, 'svg')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should convert the tldraw url to an svg when specified', async () => {
	const savedImageFileName = await tldrawToImage(tldrawTestUrl, { format: 'svg' })
	// TODO vet file names

	expectFileToBeValid(savedImageFileName, 'svg')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should convert the tldraw url to a png when specified', async () => {
	const savedImageFileName = await tldrawToImage(tldrawTestUrl, { format: 'png' })

	expectFileToBeValid(savedImageFileName, 'png')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should save the file to a specific directory when specified', async () => {
	const randomPath = randomId()
	mkdirSync(randomPath)

	const savedImageFileName = await tldrawToImage(tldrawTestUrl, {
		format: 'png',
		output: `./${randomPath}/`,
	})
	expect(savedImageFileName).toContain(randomPath)

	expectFileToBeValid(savedImageFileName, 'png')

	if (cleanUp) rmdirSync(randomPath, { recursive: true })
})
