/* eslint-disable unicorn/prefer-string-replace-all */
import * as cheerio from 'cheerio'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { expect } from 'vitest'

function getFileHash(filePath: string): string {
	const fileBuffer = readFileSync(filePath)
	const hash = createHash('sha256')
	hash.update(fileBuffer)
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

function expectFileToExist(filePath: string): void {
	expect(existsSync(filePath))
}

function expectFileToHaveType(filePath: string, extension: string): void {
	expect(filePath.endsWith(`.${extension}`))
}

export function expectFileToBeValid(filePath: string, extension: string): void {
	expectFileToExist(filePath)
	expectFileToHaveType(filePath, extension)

	// Also tested jest-image-snapshot, which was interesting, but it's only
	// compatible with PNGs, and it and pollutes the repo with big files
	switch (extension) {
		case 'svg': {
			expectSvgToMatchHash(filePath)
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
