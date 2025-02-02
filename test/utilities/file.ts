/* eslint-disable unicorn/prefer-string-replace-all */
import * as cheerio from 'cheerio'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import stringify from 'safe-stable-stringify'
import phash from 'sharp-phash'
import { expect } from 'vitest'

function getFileHash(filePath: string): string {
	const fileBuffer = readFileSync(filePath)
	const hash = createHash('sha256')
	hash.update(fileBuffer)
	return hash.digest('hex')
}

async function expectBitmapToMatchHash(filePath: string): Promise<void> {
	const hash = await getStableBitmapHash(filePath)
	expect(hash).matchSnapshot()
}

async function getStableBitmapHash(filePath: string): Promise<string> {
	// Alternate, still not stable enough...
	// const pixelBuffer = await sharp(filePath).raw().toBuffer()
	// const hash = createHash('sha256')
	// hash.update(pixelBuffer)
	// return hash

	const perceptualHash = await phash(filePath)

	// First and last few characters might be enough to identify the image...
	// there's subtle instability in the GitHub test runner that's breaking tests
	return perceptualHash.slice(0, 3) + perceptualHash.slice(-3)
}

export function stripUnstableIds(text: string): string {
	// Even then, some of the IDs seem to fluctuate from run to run
	// This is brittle
	return text.replace(/:([^\s",.:]{21})"/g, () => `:XXXXXXXXXXXXXXXXXXXXX"`)
}

function getStableJson(filePath: string): string {
	const jsonContent = readFileSync(filePath, { encoding: 'utf8' })
	const stableJsonString = stringify(JSON.parse(jsonContent))

	if (stableJsonString === undefined) {
		throw new Error('Could not parse JSON file')
	}

	// Even then, some of the IDs seem to fluctuate from run to run
	// This is brittle
	const ultraStableJsonString = stripNumbers(stripUnstableIds(stableJsonString))

	return ultraStableJsonString
}

// Using the full JSON instead of hash for easier debugging
// function getStableJsonHash(filePath: string): string {
// 	const ultraStableJsonString = getStableJson(filePath)

// 	const hash = createHash('sha256')
// 	hash.update(ultraStableJsonString)
// 	return hash.digest('hex')
// }

// Value of e.g. <clipPath id="sbpPSR9XbI1"> changes across runs, and appears in
// multiple locations in the SVG file. This function removes it
// to ensure stability across test runs
function getStableSvg(filePath: string): string {
	let svgContent = readFileSync(filePath, { encoding: 'utf8' })

	// Could use jsdom...
	const regex = /<clipPath\s+id="([^"]+)">/g
	let match
	const ids = []

	while ((match = regex.exec(svgContent)) !== null) {
		ids.push(match[1])
	}

	// Tldraw SVGs with multiple frames will have multiple clipPath ids
	if (ids.length === 0) {
		// Console.warn('No <clipPath> id found in SVG file, using unstable hash')
	} else {
		for (const id of ids) {
			svgContent = svgContent.replace(new RegExp(`${id}`, 'g'), '')
		}
	}

	// Remove style elements and comments, since font embed ordering is not deterministic
	svgContent = stripNumbers(stripUnstableElements(svgContent))

	return svgContent
}

// Using the full SVG instead of hash for easier debugging
// function getStableSvgHash(filePath: string): string {
// 	const svgContent = getStableSvg(filePath)

// 	const hash = createHash('sha256')
// 	hash.update(svgContent)
// 	return hash.digest('hex')
// }

function expectFileToMatchHash(filePath: string): void {
	// Also tested jest-image-snapshot, which was interesting, but it's only
	// compatible with PNGs, and it and pollutes the repo with big files
	expect(getFileHash(filePath)).matchSnapshot()
}

function expectSvgToMatch(filePath: string): void {
	expect(getStableSvg(filePath)).matchSnapshot()
}

// Using the full SVG instead of hash for easier debugging
// function expectSvgToMatchHash(filePath: string): void {
// 	expect(getStableSvgHash(filePath)).matchSnapshot()
// }

function expectJsonToMatch(filePath: string): void {
	expect(getStableJson(filePath)).matchSnapshot()
}

// Using the full JSON for easier debugging
// function expectJsonToMatchHash(filePath: string): void {
// 	expect(getStableJsonHash(filePath)).matchSnapshot()
// }

export function expectFileToExist(filePath: string): void {
	expect(existsSync(filePath))
}

function expectFileToHaveType(filePath: string, extension: string): void {
	expect(filePath.endsWith(`.${extension}`))
}

export async function expectFileToBeValid(filePath: string, extension: string): Promise<void> {
	expectFileToExist(filePath)
	expectFileToHaveType(filePath, extension)

	// Also tested jest-image-snapshot, which was interesting, but it's only
	// compatible with PNGs, and it and pollutes the repo with big files
	switch (extension) {
		case 'png': {
			await expectBitmapToMatchHash(filePath)
			break
		}

		case 'svg': {
			// Using the full SVG file instead of hash for easier debugging
			// expectSvgToMatchHash(filePath)
			expectSvgToMatch(filePath)
			break
		}

		case 'tldr': {
			// Using the full JSON file instead of hash for easier debugging
			// expectJsonToMatchHash(filePath)
			expectJsonToMatch(filePath)
			break
		}

		default: {
			expectFileToMatchHash(filePath)
			break
		}
	}
}

export function getStyleElementCount(filePath: string): number {
	const svg = readFileSync(filePath, { encoding: 'utf8' })
	const dom = cheerio.load(svg, { xmlMode: true })
	return dom('style').length
}

export function stripUnstableElements(svg: string): string {
	const dom = cheerio.load(svg, { xmlMode: true })
	dom('style').remove()

	// Remove all comment nodes
	dom('*')
		.contents()
		.filter(function () {
			// Node type 8 corresponds to comments
			return this.nodeType === 8
		})
		.remove()

	return dom.xml()
}

// Rounding errors create instability across test platforms...
// Sometimes up to the major digit. Also strip sign since that
// can exhibit hysteresis as well.
export function stripNumbers(text: string): string {
	return text.replace(/[\d.A-Z]+/g, 'x').replaceAll('-x', 'x')
}
