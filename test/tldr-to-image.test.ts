// Note this tests the dist build, because of the IIFE inlining from esbuild
import { nanoid } from 'nanoid'
import { mkdirSync, rmSync } from 'node:fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import stripAnsi from 'strip-ansi'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { log, tldrawToImage } from '../dist/lib'
import { expectFileToBeValid, getStyleElementCount } from './utilities/file'
import { expectSingleLine } from './utilities/string'

const cleanUp = true
const tldrTestFilePath = './test/assets/valid/2024-01-test-sketch-basic.tldr'
const tldrTestFileThreeFramesPath = './test/assets/valid/2024-01-test-sketch-three-frames.tldr'
const tldrTestFileThreePagesPath = './test/assets/valid/2024-04-test-sketch-three-pages.tldr'
const tldrTestFilePathEmpty = './test/assets/invalid/2024-01-test-sketch-empty.tldr'

describe('save to svg (default behavior)', () => {
	let tempAssetPath: string
	let testFilePaths: string[]

	beforeAll(async () => {
		// Create temp directory
		tempAssetPath = path.join(os.tmpdir(), `tldraw-cli-test-${Date.now().toString()}`)
		await fs.mkdir(tempAssetPath, { recursive: true })

		const sourceDirectory = './test/assets/valid/'
		const files = await fs.readdir(sourceDirectory, { withFileTypes: true })
		for (const { name } of files) {
			// Construct the full path of the source file using sourceDirectory and the file name
			const fullSourcePath = path.join(sourceDirectory, name)

			// Construct the destination path
			const destinationPath = path.join(tempAssetPath, name)

			// Copy the file to the destination path
			await fs.copyFile(fullSourcePath, destinationPath)
		}

		const tempFiles = await fs.readdir(tempAssetPath, { withFileTypes: true })
		testFilePaths = tempFiles
			.filter((file) => file.isFile() && file.name.endsWith('.tldr'))
			.map((file) => `${tempAssetPath}/${file.name}`)
	})

	it(`should export local tldr file to an svg by default`, async () => {
		for (const testFilePath of testFilePaths) {
			const [savedImageFileName] = await tldrawToImage(testFilePath)
			const expectedName = path.join(process.cwd(), `${path.basename(testFilePath, '.tldr')}.svg`)

			expect(savedImageFileName).toBe(expectedName)
			await expectFileToBeValid(savedImageFileName, 'svg')
			if (cleanUp) rmSync(savedImageFileName)
		}
	})

	afterAll(async () => {
		if (cleanUp) {
			await fs.rm(tempAssetPath, { recursive: true })
		}
	})
})

describe('save to format', () => {
	for (const format of ['svg', 'png', 'tldr'] as const) {
		it(`should export local tldr file to a ${format}`, async () => {
			const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
				format,
				name: 'local-tldr-save-to-format',
			})
			await expectFileToBeValid(savedImageFileName, format)
			if (cleanUp) rmSync(savedImageFileName)
		})
	}
})

describe('names and paths', () => {
	it('should export to a specific directory', async () => {
		const randomPath = nanoid()
		mkdirSync(randomPath)

		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			format: 'png',
			output: `./${randomPath}/`,
		})

		expect(savedImageFileName).toBe(`${process.cwd()}/${randomPath}/2024-01-test-sketch-basic.png`)
		await expectFileToBeValid(savedImageFileName, 'png')
		if (cleanUp) rmSync(randomPath, { recursive: true })
	})

	it('should rename the export if name is set', async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			name: 'tiny-little-name',
		})

		await expectFileToBeValid(savedImageFileName, 'svg')
		expect(savedImageFileName).toBe(`${process.cwd()}/tiny-little-name.svg`)

		if (cleanUp) rmSync(savedImageFileName)
	})

	it('should not slugify the name', async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			name: 'I am Un-slugified',
		})

		await expectFileToBeValid(savedImageFileName, 'svg')
		expect(savedImageFileName).toBe(`${process.cwd()}/I am Un-slugified.svg`)

		if (cleanUp) rmSync(savedImageFileName)
	})

	it('should handle a rational extension in name', async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			name: 'tiny-little-name.svg',
		})

		await expectFileToBeValid(savedImageFileName, 'svg')
		expect(savedImageFileName).toBe(`${process.cwd()}/tiny-little-name.svg`)

		if (cleanUp) rmSync(savedImageFileName)
	})

	it('should handle an irrational extension in name', async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			name: 'tiny-little-name.unexpected',
		})

		await expectFileToBeValid(savedImageFileName, 'svg')
		expect(savedImageFileName).toBe(`${process.cwd()}/tiny-little-name.unexpected.svg`)

		if (cleanUp) rmSync(savedImageFileName)
	})

	it('should use name as a base for multiple exported frames', async () => {
		const savedImageFileNames = await tldrawToImage(tldrTestFileThreeFramesPath, {
			frames: true,
			name: 'tiny-little-name',
		})

		expect(savedImageFileNames).toHaveLength(3)

		for (const fileName of savedImageFileNames) {
			await expectFileToBeValid(fileName, 'svg')
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
})

describe('frames', () => {
	it('should export the entire local tldr to an image if multiple frames are present and frames is not set', async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFileThreeFramesPath)

		await expectFileToBeValid(savedImageFileName, 'svg')

		if (cleanUp) rmSync(savedImageFileName)
	})

	it('should export each frame of a local tldr file individually if frames is set', async () => {
		const savedImageFileNames = await tldrawToImage(tldrTestFileThreeFramesPath, {
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

	it('should export specific frames of a local tldr file by name', async () => {
		const savedImageFileNames = await tldrawToImage(tldrTestFileThreeFramesPath, {
			frames: ['Frame 3'],
		})

		expect(savedImageFileNames).toHaveLength(1)
		await expectFileToBeValid(savedImageFileNames[0], 'svg')

		if (cleanUp) rmSync(savedImageFileNames[0])
	})

	it('should export slugified frame name from local tldr file', async () => {
		const savedImageFileNames = await tldrawToImage(tldrTestFileThreeFramesPath, {
			frames: ['frame-3'],
		})

		expect(savedImageFileNames).toHaveLength(1)
		await expectFileToBeValid(savedImageFileNames[0], 'svg')

		if (cleanUp) rmSync(savedImageFileNames[0])
	})

	it('should export frames by id from local tldr file', async () => {
		const savedImageFileNames = await tldrawToImage(tldrTestFileThreeFramesPath, {
			frames: ['shape:x8z3Qf7Hgw4Qqp2AC-eet'],
		})

		expect(savedImageFileNames).toHaveLength(1)
		await expectFileToBeValid(savedImageFileNames[0], 'svg')

		if (cleanUp) rmSync(savedImageFileNames[0])
	})

	it('should export specific frames by id from local tldr file even without the shape: prefix', async () => {
		const savedImageFileNames = await tldrawToImage(tldrTestFileThreeFramesPath, {
			frames: ['x8z3Qf7Hgw4Qqp2AC-eet'],
		})

		expect(savedImageFileNames).toHaveLength(1)
		await expectFileToBeValid(savedImageFileNames[0], 'svg')

		if (cleanUp) rmSync(savedImageFileNames[0])
	})
})

describe('pages', () => {
	it('should export a specific named page of a multi-page tldr file', async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFileThreePagesPath, {
			pages: ['Page With a Name'],
		})

		expect(savedImageFileName).toBe(
			`${process.cwd()}/2024-04-test-sketch-three-pages-page-with-a-name.svg`,
		)
		await expectFileToBeValid(savedImageFileName, 'svg')

		if (cleanUp) rmSync(savedImageFileName)
	})

	it('should export a specific page id of a multi-page tldr file', async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFileThreePagesPath, {
			pages: ['BiSbFe49DEkSQRQs28yJV'], // Cspell:disable-line
		})

		expect(savedImageFileName).toBe(`${process.cwd()}/2024-04-test-sketch-three-pages-page-2.svg`)
		await expectFileToBeValid(savedImageFileName, 'svg')

		if (cleanUp) rmSync(savedImageFileName)
	})

	it('should export a specific page id with a prefix of a multi-page tldr file', async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFileThreePagesPath, {
			pages: ['page:BiSbFe49DEkSQRQs28yJV'], // Cspell:disable-line
		})

		expect(savedImageFileName).toBe(`${process.cwd()}/2024-04-test-sketch-three-pages-page-2.svg`)
		await expectFileToBeValid(savedImageFileName, 'svg')

		if (cleanUp) rmSync(savedImageFileName)
	})

	it('should export a multiple specific pages of a multi-page tldr file', async () => {
		const savedImageFileNames = await tldrawToImage(tldrTestFileThreePagesPath, {
			pages: ['BiSbFe49DEkSQRQs28yJV', 'Page With a Name'], // Cspell:disable-line
		})

		expect(savedImageFileNames).toHaveLength(2)

		for (const fileName of savedImageFileNames) {
			await expectFileToBeValid(fileName, 'svg')
		}

		if (cleanUp) {
			for (const fileName of savedImageFileNames) {
				rmSync(fileName)
			}
		}
	})

	it('should export all pages of a multi-page tldr file', async () => {
		const savedImageFileNames = await tldrawToImage(tldrTestFileThreePagesPath, {
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

	it('should export first page of a multi-page tldr file when pages is explicitly false', async () => {
		const savedImageFileNames = await tldrawToImage(tldrTestFileThreePagesPath, {
			pages: false,
		})

		expect(savedImageFileNames).toHaveLength(1)

		for (const fileName of savedImageFileNames) {
			await expectFileToBeValid(fileName, 'svg')
		}

		if (cleanUp) {
			for (const fileName of savedImageFileNames) {
				rmSync(fileName)
			}
		}
	})

	it('should export frames from a specific page id of a multi-page tldr file', async () => {
		const spyWarn = vi.spyOn(console, 'warn').mockReturnValue()

		const savedImageFileNames = await tldrawToImage(tldrTestFileThreePagesPath, {
			frames: true,
			pages: ['BiSbFe49DEkSQRQs28yJV'], // Cspell:disable-line
		})

		expect(savedImageFileNames).toHaveLength(2)
		for (const fileName of savedImageFileNames) {
			await expectFileToBeValid(fileName, 'svg')
		}

		expect(stripAnsi(String(spyWarn.mock.calls))).toMatchInlineSnapshot(
			`"[Warning],Frame names are not unique, including frame IDs in the output filenames to avoid collisions"`,
		)

		if (cleanUp) {
			for (const fileName of savedImageFileNames) {
				rmSync(fileName)
			}
		}
	})

	it('should export a single page specified by an index of a multi-page tldr file', async () => {
		const savedImageFileNames = await tldrawToImage(tldrTestFileThreePagesPath, {
			frames: true,
			pages: [2],
		})

		expect(savedImageFileNames).toHaveLength(1)
		for (const fileName of savedImageFileNames) {
			await expectFileToBeValid(fileName, 'svg')
		}

		if (cleanUp) {
			for (const fileName of savedImageFileNames) {
				rmSync(fileName)
			}
		}
	})

	it('should export multiple pages specified by index of a multi-page tldr file', async () => {
		const savedImageFileNames = await tldrawToImage(tldrTestFileThreePagesPath, {
			frames: true,
			pages: [0, 2],
		})

		expect(savedImageFileNames).toHaveLength(2)
		for (const fileName of savedImageFileNames) {
			await expectFileToBeValid(fileName, 'svg')
		}

		if (cleanUp) {
			for (const fileName of savedImageFileNames) {
				rmSync(fileName)
			}
		}
	})
})

describe('warnings and failures', () => {
	it('should fail on empty files', async () => {
		await expect(tldrawToImage(tldrTestFilePathEmpty)).rejects.toThrow()
	})

	it('should warn if a nonexistent frame is requested from local tldr file', async () => {
		const spyWarn = vi.spyOn(console, 'warn').mockReturnValue()

		const [savedImageFileName] = await tldrawToImage(tldrTestFileThreeFramesPath, {
			frames: ['ceci-nest-pas-un-cadre'],
		})

		expect(stripAnsi(String(spyWarn.mock.calls))).toMatchInlineSnapshot(
			`"[Warning],Frame "ceci-nest-pas-un-cadre" not found in sketch,[Warning],None of the requested frames were found in sketch, ignoring frames option"`,
		)

		if (cleanUp) rmSync(savedImageFileName)
	})

	it('should warn if a bogus page is requested', async () => {
		const spyWarn = vi.spyOn(console, 'warn').mockReturnValue()

		const [savedImageFileName] = await tldrawToImage(tldrTestFileThreePagesPath, {
			pages: ['i do not exist'],
		})

		expect(stripAnsi(String(spyWarn.mock.calls))).toMatchInlineSnapshot(
			`"[Warning],Page "i do not exist" not found in sketch,[Warning],None of the requested pages were found in sketch, ignoring pages option"`,
		)

		if (cleanUp) rmSync(savedImageFileName)
	})

	it('should warn if requested page index is out of bounds', async () => {
		const spyWarn = vi.spyOn(console, 'warn').mockReturnValue()

		const [savedImageFileName] = await tldrawToImage(tldrTestFileThreePagesPath, {
			pages: [42],
		})

		expect(stripAnsi(String(spyWarn.mock.calls))).toMatchInlineSnapshot(
			`"[Warning],Page "42" not found in sketch,[Warning],None of the requested pages were found in sketch, ignoring pages option"`,
		)

		if (cleanUp) rmSync(savedImageFileName)
	})

	it('should warn if stripStyle and format png are combined', async () => {
		const spyWarn = vi.spyOn(console, 'warn').mockReturnValue()

		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			format: 'png',
			stripStyle: true,
		})

		expect(stripAnsi(String(spyWarn.mock.calls))).toMatchInlineSnapshot(
			`"[Warning],--strip-style is only supported for SVG output"`,
		)

		if (cleanUp) rmSync(savedImageFileName)
	})

	it('should warn if print and name are combined', async () => {
		const spyWarn = vi.spyOn(console, 'warn').mockReturnValue()

		await tldrawToImage(tldrTestFilePath, {
			name: 'impossible',
			print: true,
		})

		expect(stripAnsi(String(spyWarn.mock.calls))).toMatchInlineSnapshot(
			`"[Warning],Ignoring --name when using --print"`,
		)
	})

	it('should fail if print and output are combined', async () => {
		await expect(
			tldrawToImage(tldrTestFilePath, {
				output: 'impossible',
				print: true,
			}),
		).rejects.toThrow()
	})
})

function flagToString(object: Record<string, unknown>) {
	return Object.entries(object)
		.map(([key, value]) => `${key} ${String(value)}`)
		.join(' ')
		.toLowerCase()
}

describe('export options', () => {
	for (const format of ['svg', 'png', 'tldr'] as const) {
		for (const flag of [
			{ dark: true },
			{ transparent: true },
			{ padding: 0 },
			{ scale: 4 },
		] as const) {
			it(`should export local tldr file to a ${format} with ${flagToString(flag)}`, async () => {
				const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
					...flag,
					format,
					name: `local-tldr-export-options-${flagToString(flag)}`,
				})
				await expectFileToBeValid(savedImageFileName, format)
				if (cleanUp) rmSync(savedImageFileName)
			})
		}

		it(`should export local tldr file to a ${format} with print`, async () => {
			const results = await tldrawToImage(tldrTestFilePath, {
				format,
				print: true,
			})

			expect(results).toHaveLength(1)
			expectSingleLine(results[0])

			const tempFileName = `./print-test.${format}`

			await (format === 'png'
				? fs.writeFile(tempFileName, Buffer.from(results[0], 'base64'))
				: fs.writeFile(tempFileName, results[0]))

			await expectFileToBeValid(tempFileName, format)

			if (cleanUp) rmSync(tempFileName)
		})
	}

	it('should strip style elements from SVGs', async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			stripStyle: true,
		})

		await expectFileToBeValid(savedImageFileName, 'svg')
		expect(getStyleElementCount(savedImageFileName)).toBe(0)

		if (cleanUp) rmSync(savedImageFileName)
	})

	it('should return an svg string when the print flag is set', async () => {
		const results = await tldrawToImage(tldrTestFilePath, {
			print: true,
		})

		expect(results).toHaveLength(1)
		expectSingleLine(results[0])
		expect(results[0]).toMatch(/^<svg/)
		expect(results[0]).toMatch(/svg>$/)
	})

	it('should return an svg string for a single frame when the print and frame name flags are set', async () => {
		const results = await tldrawToImage(tldrTestFileThreeFramesPath, {
			frames: ['Frame 1'],
			print: true,
		})

		expect(results).toHaveLength(1)
		expectSingleLine(results[0])
		expect(results[0]).toMatch(/^<svg/)
		expect(results[0]).toMatch(/svg>$/)
	})

	it('should return multiple lines if print and multiple frame names are combined', async () => {
		const results = await tldrawToImage(tldrTestFileThreeFramesPath, {
			frames: ['Frame 1', 'Frame 2'],
			print: true,
		})

		for (const result of results) {
			expectSingleLine(result)
			expect(result).toMatch(/^<svg/)
			expect(result).toMatch(/svg>$/)
		}

		expect(results).toHaveLength(2)
	})

	it('should return multiple lines if print and frames are combined', async () => {
		const results = await tldrawToImage(tldrTestFileThreeFramesPath, {
			frames: true,
			print: true,
		})

		for (const result of results) {
			expectSingleLine(result)
			expect(result).toMatch(/^<svg/)
			expect(result).toMatch(/svg>$/)
		}

		expect(results).toHaveLength(3)
	})
})

describe('logging', () => {
	it('should log extra stuff if asked', async () => {
		log.verbose = true

		const spyWarn = vi.spyOn(console, 'warn').mockReturnValue()
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath)
		expect(spyWarn).toHaveBeenCalled()

		log.verbose = false

		if (cleanUp) rmSync(savedImageFileName)
	})

	it('should not log extra stuff by default', async () => {
		const spyWarn = vi.spyOn(console, 'warn').mockReturnValue()
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath)
		expect(spyWarn).not.toHaveBeenCalled()

		if (cleanUp) rmSync(savedImageFileName)
	})
})
