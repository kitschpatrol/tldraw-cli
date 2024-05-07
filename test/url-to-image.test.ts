// Note this tests the dist build, because of the iife inlining from esbuild
import { tldrawToImage } from '../dist/lib'
import { expectFileToBeValid } from './utilities/file'
import { nanoid } from 'nanoid'
import { mkdirSync, rmSync } from 'node:fs'
import { expect, it } from 'vitest'

const cleanUp = true
const tldrawTestUrl = 'https://www.tldraw.com/s/v2_c_9nMYBwT8UQ99RGDWfGr8H'
const tldrawTestUrlSchema2 = 'https://www.tldraw.com/s/v2_c_85CiFqkLgUaiwmed4kIa_'
const tldrawTestThreeFramesUrl = 'https://www.tldraw.com/s/v2_c_FI5RYWbdpAtjsy4OIKrKw'
const tldrawTestThreePagesUrl = 'https://www.tldraw.com/s/v2_c_L_RFQ3mJA_BWHejdH2hlD'

it(
	'should export the tldraw url to an svg in the current folder by default',
	{ timeout: 10_000 },
	async () => {
		const [savedImageFileName] = await tldrawToImage(tldrawTestUrl)

		expect(savedImageFileName).toBe(`${process.cwd()}/v2_c_9nMYBwT8UQ99RGDWfGr8H.svg`)
		expectFileToBeValid(savedImageFileName, 'svg')

		if (cleanUp) rmSync(savedImageFileName)
	},
)

it('should export the tldraw url to an svg when specified', { timeout: 10_000 }, async () => {
	const [savedImageFileName] = await tldrawToImage(tldrawTestUrl, { format: 'svg' })

	expect(savedImageFileName).toBe(`${process.cwd()}/v2_c_9nMYBwT8UQ99RGDWfGr8H.svg`)
	expectFileToBeValid(savedImageFileName, 'svg')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should export the tldraw url to a png when specified', { timeout: 10_000 }, async () => {
	const [savedImageFileName] = await tldrawToImage(tldrawTestUrl, { format: 'png' })

	expect(savedImageFileName).toBe(`${process.cwd()}/v2_c_9nMYBwT8UQ99RGDWfGr8H.png`)
	expectFileToBeValid(savedImageFileName, 'png')

	if (cleanUp) rmSync(savedImageFileName)
})

it(
	'should export the file to a specific directory when specified',
	{ timeout: 10_000 },
	async () => {
		const randomPath = nanoid()
		mkdirSync(randomPath)

		const [savedImageFileName] = await tldrawToImage(tldrawTestUrl, {
			format: 'png',
			output: `./${randomPath}/`,
		})
		expect(savedImageFileName).toContain(randomPath)

		expectFileToBeValid(savedImageFileName, 'png')

		if (cleanUp) rmSync(randomPath, { recursive: true })
	},
)

it(
	'should export the entire image if multiple frames are present and --frames is not set',
	{ timeout: 10_000 },
	async () => {
		const [savedImageFileName] = await tldrawToImage(tldrawTestThreeFramesUrl)

		expectFileToBeValid(savedImageFileName, 'svg')

		if (cleanUp) rmSync(savedImageFileName)
	},
)

it('should export each frame individually if --frames is set', { timeout: 10_000 }, async () => {
	const savedImageFileNames = await tldrawToImage(tldrawTestThreeFramesUrl, {
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
})

it('should export each page individually if --pages is set', { timeout: 10_000 }, async () => {
	const savedImageFileNames = await tldrawToImage(tldrawTestThreePagesUrl, {
		pages: true,
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
})

it('should export to json', { timeout: 10_000 }, async () => {
	const [savedImageFileName] = await tldrawToImage(tldrawTestUrl, {
		format: 'json',
	})

	expect(savedImageFileName).toBe(`${process.cwd()}/v2_c_9nMYBwT8UQ99RGDWfGr8H.json`)
	expectFileToBeValid(savedImageFileName, 'json')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should export frames to json', { timeout: 10_000 }, async () => {
	const savedImageFileNames = await tldrawToImage(tldrawTestThreeFramesUrl, {
		format: 'json',
		frames: true,
	})

	expect(savedImageFileNames).toHaveLength(3)

	for (const fileName of savedImageFileNames) {
		expectFileToBeValid(fileName, 'json')
	}

	if (cleanUp) {
		for (const fileName of savedImageFileNames) {
			rmSync(fileName)
		}
	}
})

it('should export to tldr', { timeout: 10_000 }, async () => {
	const [savedImageFileName] = await tldrawToImage(tldrawTestUrl, {
		format: 'tldr',
	})

	expect(savedImageFileName).toBe(`${process.cwd()}/v2_c_9nMYBwT8UQ99RGDWfGr8H.tldr`)
	expectFileToBeValid(savedImageFileName, 'tldr')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should export schema 2 sketches to svg', { timeout: 10_000 }, async () => {
	const [savedImageFileName] = await tldrawToImage(tldrawTestUrlSchema2)

	expect(savedImageFileName).toBe(`${process.cwd()}/v2_c_85CiFqkLgUaiwmed4kIa_.svg`)
	expectFileToBeValid(savedImageFileName, 'svg')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should export schema 2 sketches to tldr', { timeout: 10_000 }, async () => {
	const [savedImageFileName] = await tldrawToImage(tldrawTestUrlSchema2, {
		format: 'tldr',
	})

	expect(savedImageFileName).toBe(`${process.cwd()}/v2_c_85CiFqkLgUaiwmed4kIa_.tldr`)
	expectFileToBeValid(savedImageFileName, 'tldr')

	if (cleanUp) rmSync(savedImageFileName)
})
