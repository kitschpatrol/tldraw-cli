// Note this tests the dist build, because of the iife inlining from esbuild
import { log, tldrawToImage } from '../dist/lib'
import { expectFileToBeValid, getStyleElementCount } from './utilities/file'
import { expectSingleLine } from './utilities/string'
import { nanoid } from 'nanoid'
import { mkdirSync, rmSync } from 'node:fs'
import { expect, it, vi } from 'vitest'

const cleanUp = true
const tldrTestFilePath = './test/assets/test-sketch.tldr'
const tldrTestFileThreeFramesPath = './test/assets/test-sketch-three-frames.tldr'

it(
	'should export the tldr file to an svg in the current folder by default',
	async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath)
		expect(savedImageFileName).toBe(`${process.cwd()}/test-sketch.svg`)

		expectFileToBeValid(savedImageFileName, 'svg')

		if (cleanUp) rmSync(savedImageFileName)
	},
	{ timeout: 10_000 },
)

it(
	'should export the tldr file to an svg when specified',
	async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, { format: 'svg' })

		expect(savedImageFileName).toBe(`${process.cwd()}/test-sketch.svg`)
		expectFileToBeValid(savedImageFileName, 'svg')

		if (cleanUp) rmSync(savedImageFileName)
	},
	{ timeout: 10_000 },
)

it(
	'should export the tldr file to a png when specified',
	async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, { format: 'png' })

		expect(savedImageFileName).toBe(`${process.cwd()}/test-sketch.png`)
		expectFileToBeValid(savedImageFileName, 'png')

		if (cleanUp) rmSync(savedImageFileName)
	},
	{ timeout: 10_000 },
)

it(
	'should export the file to a specific directory when specified',
	async () => {
		const randomPath = nanoid()
		mkdirSync(randomPath)

		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			format: 'png',
			output: `./${randomPath}/`,
		})

		expect(savedImageFileName).toBe(`${process.cwd()}/${randomPath}/test-sketch.png`)
		expectFileToBeValid(savedImageFileName, 'png')

		if (cleanUp) rmSync(randomPath, { recursive: true })
	},
	{ timeout: 10_000 },
)

it(
	'should fail on empty files',
	async () => {
		await expect(tldrawToImage('./test/assets/test-sketch-empty.tldr')).rejects.toThrow()
	},
	{ timeout: 10_000 },
)

it(
	'should export the entire image if multiple frames are present and frames is not set',
	async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFileThreeFramesPath)

		expectFileToBeValid(savedImageFileName, 'svg')

		if (cleanUp) rmSync(savedImageFileName)
	},
	{ timeout: 10_000 },
)

it(
	'should export each frame individually if frames is set',
	async () => {
		const savedImageFileNames = await tldrawToImage(tldrTestFileThreeFramesPath, {
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

it(
	'should export specific frames by name',
	async () => {
		const savedImageFileNames = await tldrawToImage(tldrTestFileThreeFramesPath, {
			frames: ['Frame 3'],
		})

		expect(savedImageFileNames).toHaveLength(1)
		expectFileToBeValid(savedImageFileNames[0], 'svg')

		if (cleanUp) rmSync(savedImageFileNames[0])
	},
	{ timeout: 10_000 },
)

it(
	'should accommodate slugified frame name',
	async () => {
		const savedImageFileNames = await tldrawToImage(tldrTestFileThreeFramesPath, {
			frames: ['frame-3'],
		})

		expect(savedImageFileNames).toHaveLength(1)
		expectFileToBeValid(savedImageFileNames[0], 'svg')

		if (cleanUp) rmSync(savedImageFileNames[0])
	},
	{ timeout: 10_000 },
)

it(
	'should export specific frames by id',
	async () => {
		const savedImageFileNames = await tldrawToImage(tldrTestFileThreeFramesPath, {
			frames: ['shape:x8z3Qf7Hgw4Qqp2AC-eet'],
		})

		expect(savedImageFileNames).toHaveLength(1)
		expectFileToBeValid(savedImageFileNames[0], 'svg')

		if (cleanUp) rmSync(savedImageFileNames[0])
	},
	{ timeout: 10_000 },
)

it(
	'should export specific frames by id even without the shape: prefix',
	async () => {
		const savedImageFileNames = await tldrawToImage(tldrTestFileThreeFramesPath, {
			frames: ['x8z3Qf7Hgw4Qqp2AC-eet'],
		})

		expect(savedImageFileNames).toHaveLength(1)
		expectFileToBeValid(savedImageFileNames[0], 'svg')

		if (cleanUp) rmSync(savedImageFileNames[0])
	},
	{ timeout: 10_000 },
)

it(
	'should fail if a nonexistent frame is requested',
	async () => {
		await expect(
			tldrawToImage(tldrTestFileThreeFramesPath, {
				frames: ['ceci-nest-pas-un-cadre'],
			}),
		).rejects.toThrow()
	},
	{ timeout: 10_000 },
)

it(
	'should warn if stripStyle and format png are combined',
	async () => {
		const warnSpy = vi.spyOn(console, 'warn')

		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			format: 'png',
			stripStyle: true,
		})

		expect(warnSpy).toMatchInlineSnapshot(`
		[MockFunction warn] {
		  "calls": [
		    [
		      "[33m[Warning][39m",
		      "--strip-style is only supported for SVG output",
		    ],
		  ],
		  "results": [
		    {
		      "type": "return",
		      "value": undefined,
		    },
		  ],
		}
	`)

		if (cleanUp) rmSync(savedImageFileName)
	},
	{ timeout: 10_000 },
)

it(
	'should strip style elements from SVGs if requested',
	async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			stripStyle: true,
		})

		expectFileToBeValid(savedImageFileName, 'svg')
		expect(getStyleElementCount(savedImageFileName)).toBe(0)

		if (cleanUp) rmSync(savedImageFileName)
	},
	{ timeout: 10_000 },
)

it(
	'should rename the export if name is set',
	async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			name: 'tiny-little-name',
		})

		expectFileToBeValid(savedImageFileName, 'svg')
		expect(savedImageFileName).toBe(`${process.cwd()}/tiny-little-name.svg`)

		if (cleanUp) rmSync(savedImageFileName)
	},
	{ timeout: 10_000 },
)

it(
	'should not slugify the name',
	async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			name: 'I am Un-slugified',
		})

		expectFileToBeValid(savedImageFileName, 'svg')
		expect(savedImageFileName).toBe(`${process.cwd()}/I am Un-slugified.svg`)

		if (cleanUp) rmSync(savedImageFileName)
	},
	{ timeout: 10_000 },
)

it(
	'should handle a rational extension in name',
	async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			name: 'tiny-little-name.svg',
		})

		expectFileToBeValid(savedImageFileName, 'svg')
		expect(savedImageFileName).toBe(`${process.cwd()}/tiny-little-name.svg`)

		if (cleanUp) rmSync(savedImageFileName)
	},
	{ timeout: 10_000 },
)

it(
	'should handle an irrational extension in name',
	async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			name: 'tiny-little-name.unexpected',
		})

		expectFileToBeValid(savedImageFileName, 'svg')
		expect(savedImageFileName).toBe(`${process.cwd()}/tiny-little-name.unexpected.svg`)

		if (cleanUp) rmSync(savedImageFileName)
	},
	{ timeout: 10_000 },
)

it(
	'should use name as a base for multiple exported frames',
	async () => {
		const savedImageFileNames = await tldrawToImage(tldrTestFileThreeFramesPath, {
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
	},
	{ timeout: 20_000 },
)

it(
	'should export to json',
	async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			format: 'json',
		})

		expect(savedImageFileName).toBe(`${process.cwd()}/test-sketch.json`)
		expectFileToBeValid(savedImageFileName, 'json')

		if (cleanUp) rmSync(savedImageFileName)
	},
	{ timeout: 10_000 },
)

it(
	'should export frames to json',
	async () => {
		const savedImageFileNames = await tldrawToImage(tldrTestFileThreeFramesPath, {
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
	},
	{ timeout: 10_000 },
)

it(
	'should export to tldr',
	async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			format: 'tldr',
		})

		expect(savedImageFileName).toBe(`${process.cwd()}/test-sketch.tldr`)
		expectFileToBeValid(savedImageFileName, 'tldr')

		if (cleanUp) rmSync(savedImageFileName)
	},
	{ timeout: 10_000 },
)

it(
	'should return an svg string when the print flag is set',
	async () => {
		const results = await tldrawToImage(tldrTestFilePath, {
			print: true,
		})

		expect(results).toHaveLength(1)
		expectSingleLine(results[0])
		expect(results[0]).toMatch(/^<svg/)
		expect(results[0]).toMatch(/svg>$/)
	},
	{ timeout: 10_000 },
)

it(
	'should return an svg string for a single frame when the print and frame name flags are set',
	async () => {
		const results = await tldrawToImage(tldrTestFileThreeFramesPath, {
			frames: ['Frame 1'],
			print: true,
		})

		expect(results).toHaveLength(1)
		expectSingleLine(results[0])
		expect(results[0]).toMatch(/^<svg/)
		expect(results[0]).toMatch(/svg>$/)
	},
	{ timeout: 10_000 },
)

it(
	'should return base64 image string when the print and format "png" flags are set',
	async () => {
		const results = await tldrawToImage(tldrTestFilePath, {
			format: 'png',
			print: true,
		})

		expect(results).toHaveLength(1)
		expectSingleLine(results[0])
		expect(results).toMatchSnapshot()
	},
	{ timeout: 10_000 },
)

it(
	'should return a json string when the print and format "json" flags are set',
	async () => {
		const [result] = await tldrawToImage(tldrTestFilePath, {
			format: 'json',
			print: true,
		})

		expectSingleLine(result)
		expect(result).toMatchSnapshot()
	},
	{ timeout: 10_000 },
)

it(
	'should return a tldr string when the print and format "tldr" flags are set',
	async () => {
		const [result] = await tldrawToImage(tldrTestFilePath, {
			format: 'tldr',
			print: true,
		})

		expectSingleLine(result)
		expect(result).toMatchSnapshot()
	},
	{ timeout: 10_000 },
)

it(
	'should return multiple lines if print and multiple frame names are combined',
	async () => {
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
	},
	{ timeout: 10_000 },
)

it(
	'should return multiple lines if print and frames are combined',
	async () => {
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
	},
	{ timeout: 10_000 },
)

it(
	'should warn if print and name are combined',
	async () => {
		const warnSpy = vi.spyOn(console, 'warn')

		await tldrawToImage(tldrTestFilePath, {
			name: 'impossible',
			print: true,
		})

		expect(warnSpy).toMatchInlineSnapshot(`
		[MockFunction warn] {
		  "calls": [
		    [
		      "[33m[Warning][39m",
		      "Ignoring --name when using --print",
		    ],
		  ],
		  "results": [
		    {
		      "type": "return",
		      "value": undefined,
		    },
		  ],
		}
	`)
	},
	{ timeout: 10_000 },
)

it(
	'should fail if print and output are combined',
	async () => {
		await expect(
			tldrawToImage(tldrTestFilePath, {
				output: 'impossible',
				print: true,
			}),
		).rejects.toThrow()
	},
	{ timeout: 10_000 },
)

it(
	'should log extra stuff if asked',
	async () => {
		log.verbose = true

		const warnSpy = vi.spyOn(console, 'warn')
		await tldrawToImage(tldrTestFilePath)
		expect(warnSpy).toHaveBeenCalled()

		log.verbose = false
	},
	{ timeout: 10_000 },
)

it(
	'should not log extra stuff by default',
	async () => {
		const warnSpy = vi.spyOn(console, 'warn')
		await tldrawToImage(tldrTestFilePath)
		expect(warnSpy).not.toHaveBeenCalled()
	},
	{ timeout: 10_000 },
)
