import { tldrawToImage } from '../src/lib/tldraw-to-image'
import { expectFileToBeValid, getStyleElementCount } from './utilities/file'
import { randomId } from './utilities/random'
import { mkdirSync, rmSync, rmdirSync } from 'node:fs'
import { expect, it, vi } from 'vitest'

const cleanUp = true
const tldrTestFilePath = './test/assets/test-sketch.tldr'

it('should convert the tldr file to an svg in the current folder by default', async () => {
	const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, { verbose: true })
	expect(savedImageFileName).toBe(`${process.cwd()}/test-sketch.svg`)

	expectFileToBeValid(savedImageFileName, 'svg')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should convert the tldr file to an svg when specified', async () => {
	const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, { format: 'svg' })

	expect(savedImageFileName).toBe(`${process.cwd()}/test-sketch.svg`)
	expectFileToBeValid(savedImageFileName, 'svg')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should convert the tldr file to a png when specified', async () => {
	const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, { format: 'png' })

	expect(savedImageFileName).toBe(`${process.cwd()}/test-sketch.png`)
	expectFileToBeValid(savedImageFileName, 'png')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should save the file to a specific directory when specified', async () => {
	const randomPath = randomId()
	mkdirSync(randomPath)

	const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
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
	const [savedImageFileName] = await tldrawToImage('./test/assets/test-sketch-three-frames.tldr')

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

it('should export specific frames by name', async () => {
	const savedImageFileNames = await tldrawToImage('./test/assets/test-sketch-three-frames.tldr', {
		frames: ['Frame 3'],
	})

	expect(savedImageFileNames).toHaveLength(1)
	expectFileToBeValid(savedImageFileNames[0], 'svg')

	if (cleanUp) rmSync(savedImageFileNames[0])
})

it('should accommodate slugified frame name', async () => {
	const savedImageFileNames = await tldrawToImage('./test/assets/test-sketch-three-frames.tldr', {
		frames: ['frame-3'],
	})

	expect(savedImageFileNames).toHaveLength(1)
	expectFileToBeValid(savedImageFileNames[0], 'svg')

	if (cleanUp) rmSync(savedImageFileNames[0])
})

it('should export specific frames by id', async () => {
	const savedImageFileNames = await tldrawToImage('./test/assets/test-sketch-three-frames.tldr', {
		frames: ['shape:x8z3Qf7Hgw4Qqp2AC-eet'],
	})

	expect(savedImageFileNames).toHaveLength(1)
	expectFileToBeValid(savedImageFileNames[0], 'svg')

	if (cleanUp) rmSync(savedImageFileNames[0])
})

it('should export specific frames by id even without the shape: prefix', async () => {
	const savedImageFileNames = await tldrawToImage('./test/assets/test-sketch-three-frames.tldr', {
		frames: ['x8z3Qf7Hgw4Qqp2AC-eet'],
	})

	expect(savedImageFileNames).toHaveLength(1)
	expectFileToBeValid(savedImageFileNames[0], 'svg')

	if (cleanUp) rmSync(savedImageFileNames[0])
})

it('should fail if a nonexistent frame is requested', async () => {
	await expect(
		tldrawToImage('./test/assets/test-sketch-three-frames.tldr', {
			frames: ['ceci-nest-pas-un-cadre'],
		}),
	).rejects.toThrow()
})

it('should warn if --strip-style is passed with --format=png', async () => {
	const warnSpy = vi.spyOn(console, 'warn')

	const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
		format: 'png',
		stripStyle: true,
	})

	expect(warnSpy).toHaveBeenCalledWith('Warning: --strip-style is only supported for SVG output')

	if (cleanUp) rmSync(savedImageFileName)
})

it('should strip style elements from SVGs if requested', async () => {
	const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
		stripStyle: true,
	})

	expectFileToBeValid(savedImageFileName, 'svg')
	expect(getStyleElementCount(savedImageFileName)).toBe(0)

	if (cleanUp) rmSync(savedImageFileName)
})

it('should rename the export if --name is passed', async () => {
	const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
		name: 'tiny-little-name',
	})

	expectFileToBeValid(savedImageFileName, 'svg')
	expect(savedImageFileName).toBe(`${process.cwd()}/tiny-little-name.svg`)

	if (cleanUp) rmSync(savedImageFileName)
})

it('should not slugify the --name', async () => {
	const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
		name: 'I am Un-slugified',
	})

	expectFileToBeValid(savedImageFileName, 'svg')
	expect(savedImageFileName).toBe(`${process.cwd()}/I am Un-slugified.svg`)

	if (cleanUp) rmSync(savedImageFileName)
})

it('should handle a rational extension passed to --name', async () => {
	const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
		name: 'tiny-little-name.svg',
	})

	expectFileToBeValid(savedImageFileName, 'svg')
	expect(savedImageFileName).toBe(`${process.cwd()}/tiny-little-name.svg`)

	if (cleanUp) rmSync(savedImageFileName)
})

it('should handle an  irrational extension passed to --name', async () => {
	const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
		name: 'tiny-little-name.unexpected',
	})

	expectFileToBeValid(savedImageFileName, 'svg')
	expect(savedImageFileName).toBe(`${process.cwd()}/tiny-little-name.unexpected.svg`)

	if (cleanUp) rmSync(savedImageFileName)
})

it('should use --name as a base for multiple exported frames', async () => {
	const savedImageFileNames = await tldrawToImage('./test/assets/test-sketch-three-frames.tldr', {
		frames: true,
		name: 'tiny-little-name',
	})

	expect(savedImageFileNames).toHaveLength(3)

	for (const fileName of savedImageFileNames) {
		expectFileToBeValid(fileName, 'svg')
	}

	expect(savedImageFileNames.at(0)).toBe(`${process.cwd()}/tiny-little-name-frame-1.svg`)
	expect(savedImageFileNames.at(1)).toBe(`${process.cwd()}/tiny-little-name-frame-2.svg`)
	expect(savedImageFileNames.at(2)).toBe(`${process.cwd()}/tiny-little-name-frame-3.svg`)

	if (cleanUp) {
		for (const fileName of savedImageFileNames) {
			rmSync(fileName)
		}
	}
})
