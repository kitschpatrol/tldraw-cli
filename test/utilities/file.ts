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

	return phash(filePath)
}

function getStableJsonHash(filePath: string): string {
	const jsonContent = readFileSync(filePath, { encoding: 'utf8' })
	const stableJsonString = stringify(JSON.parse(jsonContent))

	if (stableJsonString === undefined) {
		throw new Error('Could not parse JSON file')
	}

	// Even then, some of the IDs seem to fluctuate from run to run
	// This is brittle
	const ultraStableJsonString = stableJsonString.replace(
		/:([^\s,.:]{21})"/g,
		() => `:XXXXXXXXXXXXXXXXXXXXX"`,
	)

	const hash = createHash('sha256')
	hash.update(ultraStableJsonString)
	return hash.digest('hex')
}

// Value of e.g. <clipPath id="sbpPSR9XbI1"> changes across runs, and appears in
// multiple locations in the SVG file. This function removes it before taking
// the hash to ensure stability across test runs
function getStableSvgHash(filePath: string): string {
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
	svgContent = stripUnstableElements(svgContent)

	const hash = createHash('sha256')
	hash.update(svgContent)
	return hash.digest('hex')
}

function expectFileToMatchHash(filePath: string): void {
	// Also tested jest-image-snapshot, which was interesting, but it's only
	// compatible with PNGs, and it and pollutes the repo with big files
	expect(getFileHash(filePath)).matchSnapshot()
}

function expectSvgToMatchHash(filePath: string): void {
	expect(getStableSvgHash(filePath)).matchSnapshot()
}

function expectJsonToMatchHash(filePath: string): void {
	expect(getStableJsonHash(filePath)).matchSnapshot()
}

function expectFileToExist(filePath: string): void {
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
		case 'json': {
			expectJsonToMatchHash(filePath)
			break
		}

		case 'tldr': {
			expectJsonToMatchHash(filePath)
			break
		}

		case 'svg': {
			expectSvgToMatchHash(filePath)
			break
		}

		case 'png': {
			await expectBitmapToMatchHash(filePath)
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
