// Note this tests the dist build, because of the iife inlining from esbuild
import { nanoid } from 'nanoid'
import { mkdirSync, rmSync } from 'node:fs'
import { expect, it } from 'vitest'
import { tldrawToImage } from '../dist/lib'
import { expectFileToBeValid } from './utilities/file'

const cleanUp = true
const tldrawTestUrl = 'https://www.tldraw.com/s/v2_c_9nMYBwT8UQ99RGDWfGr8H'
const tldrawTestUrlSchema2 = 'https://www.tldraw.com/s/v2_c_85CiFqkLgUaiwmed4kIa_'
const tldrawTestThreeFramesUrl = 'https://www.tldraw.com/s/v2_c_FI5RYWbdpAtjsy4OIKrKw'
const tldrawTestThreePagesUrl = 'https://www.tldraw.com/s/v2_c_L_RFQ3mJA_BWHejdH2hlD'

it('should export the tldraw url to an svg in the current folder by default', async () => {
	const [savedImageFileName] = await tldrawToImage(tldrawTestUrl)

	expect(savedImageFileName).toBe(`${process.cwd()}/v2_c_9nMYBwT8UQ99RGDWfGr8H.svg`)
	await expectFileToBeValid(savedImageFileName, 'svg')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should export the tldraw url to an svg when specified', async () => {
	const [savedImageFileName] = await tldrawToImage(tldrawTestUrl, { format: 'svg' })

	expect(savedImageFileName).toBe(`${process.cwd()}/v2_c_9nMYBwT8UQ99RGDWfGr8H.svg`)
	await expectFileToBeValid(savedImageFileName, 'svg')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should export the tldraw url to a png when specified', async () => {
	const [savedImageFileName] = await tldrawToImage(tldrawTestUrl, { format: 'png' })

	expect(savedImageFileName).toBe(`${process.cwd()}/v2_c_9nMYBwT8UQ99RGDWfGr8H.png`)
	await expectFileToBeValid(savedImageFileName, 'png')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should export the file to a specific directory when specified', async () => {
	const randomPath = nanoid()
	mkdirSync(randomPath)

	const [savedImageFileName] = await tldrawToImage(tldrawTestUrl, {
		format: 'png',
		output: `./${randomPath}/`,
	})
	expect(savedImageFileName).toContain(randomPath)

	await expectFileToBeValid(savedImageFileName, 'png')

	if (cleanUp) rmSync(randomPath, { recursive: true })
})

it('should export the entire image if multiple frames are present and --frames is not set', async () => {
	const [savedImageFileName] = await tldrawToImage(tldrawTestThreeFramesUrl)

	await expectFileToBeValid(savedImageFileName, 'svg')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should export each frame individually if --frames is set', async () => {
	const savedImageFileNames = await tldrawToImage(tldrawTestThreeFramesUrl, {
		frames: true,
	})

	expect(savedImageFileNames).toHaveLength(3)

	for (const fileName of savedImageFileNames) {
		await expectFileToBeValid(fileName, 'svg')
	}

	if (cleanUp) {
		for (const fileName of savedImageFileNames) {
			rmSync(fileName)
		}
	}
})

it('should export each page individually if --pages is set', async () => {
	const savedImageFileNames = await tldrawToImage(tldrawTestThreePagesUrl, {
		pages: true,
	})

	expect(savedImageFileNames).toHaveLength(3)

	for (const fileName of savedImageFileNames) {
		await expectFileToBeValid(fileName, 'svg')
	}

	if (cleanUp) {
		for (const fileName of savedImageFileNames) {
			rmSync(fileName)
		}
	}
})

it('should export to tldr', async () => {
	const [savedImageFileName] = await tldrawToImage(tldrawTestUrl, {
		format: 'tldr',
	})

	expect(savedImageFileName).toBe(`${process.cwd()}/v2_c_9nMYBwT8UQ99RGDWfGr8H.tldr`)
	await expectFileToBeValid(savedImageFileName, 'tldr')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should export schema 2 sketches to svg', async () => {
	const [savedImageFileName] = await tldrawToImage(tldrawTestUrlSchema2)

	expect(savedImageFileName).toBe(`${process.cwd()}/v2_c_85CiFqkLgUaiwmed4kIa_.svg`)
	await expectFileToBeValid(savedImageFileName, 'svg')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should export schema 2 sketches to tldr', async () => {
	const [savedImageFileName] = await tldrawToImage(tldrawTestUrlSchema2, {
		format: 'tldr',
	})

	expect(savedImageFileName).toBe(`${process.cwd()}/v2_c_85CiFqkLgUaiwmed4kIa_.tldr`)
	await expectFileToBeValid(savedImageFileName, 'tldr')

	if (cleanUp) rmSync(savedImageFileName)
})
