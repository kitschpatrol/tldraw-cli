import { tldrawToImage } from '../src/lib/tldraw-to-image'
import { expectFileToBeValid } from './utilities/file'
import { randomId } from './utilities/random'
import { mkdirSync, rmSync, rmdirSync } from 'node:fs'
import { expect, it } from 'vitest'

const cleanUp = true
const tldrawTestUrl = 'https://www.tldraw.com/s/v2_c_9nMYBwT8UQ99RGDWfGr8H'
const tldrawTestThreeFramesUrl = 'https://www.tldraw.com/s/v2_c_FI5RYWbdpAtjsy4OIKrKw'

it('should convert the tldraw url to an svg in the current folder by default', async () => {
	const [savedImageFileName] = await tldrawToImage(tldrawTestUrl)

	expect(savedImageFileName).toBe(`${process.cwd()}/v2_c_9nMYBwT8UQ99RGDWfGr8H.svg`)
	expectFileToBeValid(savedImageFileName, 'svg')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should convert the tldraw url to an svg when specified', async () => {
	const [savedImageFileName] = await tldrawToImage(tldrawTestUrl, { format: 'svg' })

	expect(savedImageFileName).toBe(`${process.cwd()}/v2_c_9nMYBwT8UQ99RGDWfGr8H.svg`)
	expectFileToBeValid(savedImageFileName, 'svg')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should convert the tldraw url to a png when specified', async () => {
	const [savedImageFileName] = await tldrawToImage(tldrawTestUrl, { format: 'png' })

	expect(savedImageFileName).toBe(`${process.cwd()}/v2_c_9nMYBwT8UQ99RGDWfGr8H.png`)
	expectFileToBeValid(savedImageFileName, 'png')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should save the file to a specific directory when specified', async () => {
	const randomPath = randomId()
	mkdirSync(randomPath)

	const [savedImageFileName] = await tldrawToImage(tldrawTestUrl, {
		format: 'png',
		output: `./${randomPath}/`,
	})
	expect(savedImageFileName).toContain(randomPath)

	expectFileToBeValid(savedImageFileName, 'png')

	if (cleanUp) rmdirSync(randomPath, { recursive: true })
})

it('should export the entire image if multiple frames are present and --frames is not set', async () => {
	const [savedImageFileName] = await tldrawToImage(tldrawTestThreeFramesUrl)

	expectFileToBeValid(savedImageFileName, 'svg')

	if (cleanUp) rmSync(savedImageFileName)
})

it(
	'should export each frame individually if --frames is set',
	async () => {
		const savedImageFileNames = await tldrawToImage(tldrawTestThreeFramesUrl, {
			frames: true,
			verbose: true,
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
