import { tldrawToImage } from '../src/lib/tldraw-to-image'
import { expectFileToBeValid } from './utilities/file'
import { randomId } from './utilities/random'
import { mkdirSync, rmSync, rmdirSync } from 'node:fs'
import { expect, it } from 'vitest'

const cleanUp = true
const tldrTestFilePath = './test/assets/test-sketch.tldr'

it('should convert the tldr file to an svg in the current folder by default', async () => {
	const savedImageFileName = await tldrawToImage(tldrTestFilePath)
	expect(savedImageFileName).toBe(`${process.cwd()}/test-sketch.svg`)

	expectFileToBeValid(savedImageFileName, 'svg')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should convert the tldr file to an svg when specified', async () => {
	const savedImageFileName = await tldrawToImage(tldrTestFilePath, { format: 'svg' })
	expect(savedImageFileName).toBe(`${process.cwd()}/test-sketch.svg`)

	expectFileToBeValid(savedImageFileName, 'svg')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should convert the tldr file to a png when specified', async () => {
	const savedImageFileName = await tldrawToImage(tldrTestFilePath, { format: 'png' })
	expect(savedImageFileName).toBe(`${process.cwd()}/test-sketch.png`)

	expectFileToBeValid(savedImageFileName, 'png')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should save the file to a specific directory when specified', async () => {
	const randomPath = randomId()
	mkdirSync(randomPath)

	const savedImageFileName = await tldrawToImage(tldrTestFilePath, {
		format: 'png',
		output: `./${randomPath}/`,
	})
	expect(savedImageFileName).toBe(`${process.cwd()}/${randomPath}/test-sketch.png`)

	expectFileToBeValid(savedImageFileName, 'png')

	if (cleanUp) rmdirSync(randomPath, { recursive: true })
})

it('should reject empty files', async () => {
	await expect(tldrawToImage('./test/assets/test-sketch-empty.tldr')).rejects.toThrow()
})
