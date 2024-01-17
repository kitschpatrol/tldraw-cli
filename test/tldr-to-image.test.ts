import { tldrawToImage } from '../src/lib/tldraw-to-image'
import { expectFileToBeValid } from './utilities/file'
import { randomId } from './utilities/random'
import { mkdirSync, rmSync, rmdirSync } from 'node:fs'
import { expect, it } from 'vitest'

const cleanUp = false
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

it('should export the entire image if multiple frames are present and --frames is not set', async () => {
	const savedImageFileName = await tldrawToImage('./test/assets/test-sketch-three-frames.tldr')

	expectFileToBeValid(savedImageFileName, 'svg')

	if (cleanUp) rmSync(savedImageFileName)
})

it(
	'should export each frame individually if --frames is set',
	async () => {
		const savedImageFileNames = await tldrawToImage('./test/assets/test-sketch-three-frames.tldr', {
			frames: true,
		})

		expect(savedImageFileNames).toHaveLength(3)

		for (const fileName of savedImageFileNames) {
			expectFileToBeValid(fileName, 'svg')
		}

		if (cleanUp) {
			for (const fileName of savedImageFileNames) {
				rmSync(fileName)
			}
		}
	},
	{ timeout: 10_000 },
)
