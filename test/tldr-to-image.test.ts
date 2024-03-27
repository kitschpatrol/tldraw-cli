// Note this tests the dist build, because of the iife inlining from esbuild
import { log, tldrawToImage } from '../dist/lib'
import { expectFileToBeValid, getStyleElementCount } from './utilities/file'
import { expectSingleLine } from './utilities/string'
import { nanoid } from 'nanoid'
import { mkdirSync, rmSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

const cleanUp = true
const tldrTestFilePath = './test/assets/test-sketch.tldr'
const tldrTestFileThreeFramesPath = './test/assets/test-sketch-three-frames.tldr'

describe('default behavior', () => {
	it(
		'should export local tldr file to an svg in the current folder',
		{ timeout: 10_000 },
		async () => {
			const [savedImageFileName] = await tldrawToImage(tldrTestFilePath)

			expect(savedImageFileName).toBe(`${process.cwd()}/test-sketch.svg`)
			expectFileToBeValid(savedImageFileName, 'svg')

			if (cleanUp) rmSync(savedImageFileName)
		},
	)
})

describe('save to format', () => {
	for (const format of ['svg', 'png', 'json', 'tldr'] as const) {
		it(`should export local tldr file to an ${format}`, { timeout: 10_000 }, async () => {
			const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
				format,
				name: 'local-tldr-save-to-format',
			})
			expectFileToBeValid(savedImageFileName, 'svg')
			if (cleanUp) rmSync(savedImageFileName)
		})
	}
})

describe('names and paths', () => {
	it('should export to a specific directory', { timeout: 10_000 }, async () => {
		const randomPath = nanoid()
		mkdirSync(randomPath)

		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			format: 'png',
			output: `./${randomPath}/`,
		})

		expect(savedImageFileName).toBe(`${process.cwd()}/${randomPath}/test-sketch.png`)
		expectFileToBeValid(savedImageFileName, 'png')
		if (cleanUp) rmSync(randomPath, { recursive: true })
	})

	it('should rename the export if name is set', { timeout: 10_000 }, async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			name: 'tiny-little-name',
		})

		expectFileToBeValid(savedImageFileName, 'svg')
		expect(savedImageFileName).toBe(`${process.cwd()}/tiny-little-name.svg`)

		if (cleanUp) rmSync(savedImageFileName)
	})

	it('should not slugify the name', { timeout: 10_000 }, async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			name: 'I am Un-slugified',
		})

		expectFileToBeValid(savedImageFileName, 'svg')
		expect(savedImageFileName).toBe(`${process.cwd()}/I am Un-slugified.svg`)

		if (cleanUp) rmSync(savedImageFileName)
	})

	it('should handle a rational extension in name', { timeout: 10_000 }, async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			name: 'tiny-little-name.svg',
		})

		expectFileToBeValid(savedImageFileName, 'svg')
		expect(savedImageFileName).toBe(`${process.cwd()}/tiny-little-name.svg`)

		if (cleanUp) rmSync(savedImageFileName)
	})

	it('should handle an irrational extension in name', { timeout: 10_000 }, async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			name: 'tiny-little-name.unexpected',
		})

		expectFileToBeValid(savedImageFileName, 'svg')
		expect(savedImageFileName).toBe(`${process.cwd()}/tiny-little-name.unexpected.svg`)

		if (cleanUp) rmSync(savedImageFileName)
	})

	it('should use name as a base for multiple exported frames', { timeout: 20_000 }, async () => {
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
	})
})

describe('frames', () => {
	it(
		'should export the entire local tldr to an image if multiple frames are present and frames is not set',
		{ timeout: 10_000 },
		async () => {
			const [savedImageFileName] = await tldrawToImage(tldrTestFileThreeFramesPath)

			expectFileToBeValid(savedImageFileName, 'svg')

			if (cleanUp) rmSync(savedImageFileName)
		},
	)

	it(
		'should export each frame of a local tldr file individually if frames is set',
		{ timeout: 10_000 },
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
	)

	it(
		'should export specific frames of a local tldr file by name',
		{ timeout: 10_000 },
		async () => {
			const savedImageFileNames = await tldrawToImage(tldrTestFileThreeFramesPath, {
				frames: ['Frame 3'],
			})

			expect(savedImageFileNames).toHaveLength(1)
			expectFileToBeValid(savedImageFileNames[0], 'svg')

			if (cleanUp) rmSync(savedImageFileNames[0])
		},
	)

	it('should export slugified frame name from local tldr file', { timeout: 10_000 }, async () => {
		const savedImageFileNames = await tldrawToImage(tldrTestFileThreeFramesPath, {
			frames: ['frame-3'],
		})

		expect(savedImageFileNames).toHaveLength(1)
		expectFileToBeValid(savedImageFileNames[0], 'svg')

		if (cleanUp) rmSync(savedImageFileNames[0])
	})

	it('should export frames by id from local tldr file', { timeout: 10_000 }, async () => {
		const savedImageFileNames = await tldrawToImage(tldrTestFileThreeFramesPath, {
			frames: ['shape:x8z3Qf7Hgw4Qqp2AC-eet'],
		})

		expect(savedImageFileNames).toHaveLength(1)
		expectFileToBeValid(savedImageFileNames[0], 'svg')

		if (cleanUp) rmSync(savedImageFileNames[0])
	})

	it(
		'should export specific frames by id from local tldr file even without the shape: prefix',
		{ timeout: 10_000 },
		async () => {
			const savedImageFileNames = await tldrawToImage(tldrTestFileThreeFramesPath, {
				frames: ['x8z3Qf7Hgw4Qqp2AC-eet'],
			})

			expect(savedImageFileNames).toHaveLength(1)
			expectFileToBeValid(savedImageFileNames[0], 'svg')

			if (cleanUp) rmSync(savedImageFileNames[0])
		},
	)
})

describe('warnings and failures', () => {
	it('should fail on empty files', { timeout: 10_000 }, async () => {
		await expect(tldrawToImage('./test/assets/test-sketch-empty.tldr')).rejects.toThrow()
	})

	it(
		'should fail if a nonexistent frame is requested from local tldr file',
		{ timeout: 10_000 },
		async () => {
			await expect(
				tldrawToImage(tldrTestFileThreeFramesPath, {
					frames: ['ceci-nest-pas-un-cadre'],
				}),
			).rejects.toThrow()
		},
	)

	it('should warn if stripStyle and format png are combined', { timeout: 10_000 }, async () => {
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
	})

	it('should warn if print and name are combined', { timeout: 10_000 }, async () => {
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
	})

	it('should fail if print and output are combined', { timeout: 10_000 }, async () => {
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
		.map(([key, value]) => `${key}-${String(value)}`)
		.join('-')
		.toLowerCase()
}

describe('export options', () => {
	for (const format of ['svg', 'png', 'json', 'tldr'] as const) {
		for (const flag of [
			{ dark: true },
			{ transparent: true },
			{ padding: 0 },
			{ scale: 4 },
		] as const) {
			it(
				`should export local tldr file to an ${format} with ${flagToString(flag)}`,
				{ timeout: 10_000 },
				async () => {
					const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
						...flag,
						format,
						name: `local-tldr-export-options-${flagToString(flag)}`,
					})
					expectFileToBeValid(savedImageFileName, 'svg')
					if (cleanUp) rmSync(savedImageFileName)
				},
			)
		}

		it(
			`should export local tldr file to an ${format} with print`,
			{ timeout: 10_000 },
			async () => {
				const results = await tldrawToImage(tldrTestFilePath, {
					format,
					print: true,
				})

				expect(results).toHaveLength(1)
				expectSingleLine(results[0])
				expect(results[0]).toMatchSnapshot()
			},
		)
	}

	it('should strip style elements from SVGs', { timeout: 10_000 }, async () => {
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath, {
			stripStyle: true,
		})

		expectFileToBeValid(savedImageFileName, 'svg')
		expect(getStyleElementCount(savedImageFileName)).toBe(0)

		if (cleanUp) rmSync(savedImageFileName)
	})

	it('should return an svg string when the print flag is set', { timeout: 10_000 }, async () => {
		const results = await tldrawToImage(tldrTestFilePath, {
			print: true,
		})

		expect(results).toHaveLength(1)
		expectSingleLine(results[0])
		expect(results[0]).toMatch(/^<svg/)
		expect(results[0]).toMatch(/svg>$/)
	})

	it(
		'should return an svg string for a single frame when the print and frame name flags are set',
		{ timeout: 10_000 },
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
	)

	it(
		'should return multiple lines if print and multiple frame names are combined',
		{ timeout: 10_000 },
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
	)

	it(
		'should return multiple lines if print and frames are combined',
		{ timeout: 10_000 },
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
	)
})

describe('logging', () => {
	it('should log extra stuff if asked', { timeout: 10_000 }, async () => {
		log.verbose = true

		const warnSpy = vi.spyOn(console, 'warn')
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath)
		expect(warnSpy).toHaveBeenCalled()

		log.verbose = false

		if (cleanUp) rmSync(savedImageFileName)
	})

	it('should not log extra stuff by default', { timeout: 10_000 }, async () => {
		const warnSpy = vi.spyOn(console, 'warn')
		const [savedImageFileName] = await tldrawToImage(tldrTestFilePath)
		expect(warnSpy).not.toHaveBeenCalled()

		if (cleanUp) rmSync(savedImageFileName)
	})
})
