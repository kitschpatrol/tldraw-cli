import '@blazediff/vitest'
import * as cheerio from 'cheerio'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { stringify } from 'safe-stable-stringify'
import { expect } from 'vitest'

// BlazeDiff options for PNG comparison: use SSIM for perceptual similarity,
// allowing minor cross-platform rendering differences to pass.
const imageSnapshotOptions = {
	failureThreshold: 0.01,
	failureThresholdType: 'percent' as const,
	method: 'ssim' as const,
}

// ---- PNG ----

async function expectBitmapToMatchSnapshot(filePath: string): Promise<void> {
	await expect(filePath).toMatchImageSnapshot(imageSnapshotOptions)
}

// ---- SVG ----

/**
 * Parse an SVG string and remove noisy / non-deterministic parts:
 *   - <style> elements (font embedding order is non-deterministic)
 *   - comment nodes
 *   - inline `style` attributes (huge, unstable across Chromium versions)
 *   - clipPath `id` attributes (random per run)
 * Also sorts remaining attributes on every element for canonical output.
 */
function cleanSvg(svgContent: string): string {
	const dom = cheerio.load(svgContent, { xmlMode: true })

	// Remove <style> elements
	dom('style').remove()

	// Remove comment nodes
	dom('*')
		.contents()
		.filter(function () {
			return this.nodeType === 8
		})
		.remove()

	// Process every element: remove inline styles, normalize clipPath ids,
	// and sort attributes for deterministic output.
	dom('*').each(function () {
		const element = dom(this)

		element.removeAttr('style')

		const tagName = element.prop('tagName')
		if (tagName === 'clipPath') {
			element.attr('id', '')
		}

		// Sort attributes for deterministic serialization order. Cheerio
		// doesn't expose a public API for reordering attributes, so we
		// access the internal `attribs` property on the underlying node.
		// eslint-disable-next-line ts/no-unsafe-type-assertion -- cheerio internal
		const node = this as unknown as { attribs: Record<string, string> }
		const sorted: Record<string, string> = {}
		for (const k of Object.keys(node.attribs).toSorted()) {
			sorted[k] = node.attribs[k]
		}

		node.attribs = sorted
	})

	return dom.xml()
}

/**
 * Replace numeric values (integers, decimals, negative numbers, scientific
 * notation) with a placeholder to absorb rounding differences across
 * platforms, while preserving tag names and attribute names.
 */
function stripNumbers(text: string): string {
	return text.replaceAll(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi, '0')
}

function getStableSvg(filePath: string): string {
	const svgContent = readFileSync(filePath, { encoding: 'utf8' })
	return stripNumbers(cleanSvg(svgContent))
}

function expectSvgToMatch(filePath: string): void {
	const stableSvg = getStableSvg(filePath)
	const hash = createHash('sha256').update(stableSvg).digest('hex')
	expect(hash).matchSnapshot()
}

// ---- TLDR (JSON) ----

/**
 * Remove all dynamic IDs from the given text, replacing them with a stable string.
 */
export function stripUnstableIds(text: string): string {
	// 21-character tldraw IDs fluctuate from run to run
	// eslint-disable-next-line regexp/no-unused-capturing-group
	return text.replaceAll(/:([^\s",.:]{21})"/g, () => `:XXXXXXXXXXXXXXXXXXXXX"`)
}

type TldrawRecord = {
	[key: string]: unknown
	fromId?: string
	id?: string
	props?: { terminal?: string }
	records?: TldrawRecord[]
	toId?: string
	typeName?: string
}

/**
 * Build a sort key for a tldraw record that is stable across runs.
 * Bindings get new random IDs each export, so we sort them by their
 * relationship (fromId + toId + terminal) instead.
 */
function recordSortKey(record: TldrawRecord): string {
	const typeName = record.typeName ?? ''
	if (typeName === 'binding') {
		return `${typeName}:${record.fromId ?? ''}:${record.toId ?? ''}:${record.props?.terminal ?? ''}`
	}

	return `${typeName}:${record.id ?? ''}`
}

function getStableJson(filePath: string): string {
	const jsonContent = readFileSync(filePath, { encoding: 'utf8' })
	// eslint-disable-next-line ts/no-unsafe-type-assertion -- JSON structure is known
	const parsed = JSON.parse(jsonContent) as TldrawRecord

	// Sort records for deterministic ordering — tldraw emits records in
	// non-deterministic order across runs. Use a composite key so that
	// records with unstable IDs (like bindings) sort by their stable
	// relationship fields instead.
	if (parsed.records) {
		parsed.records.sort((a, b) => recordSortKey(a).localeCompare(recordSortKey(b)))
	}

	const stableJsonString = stringify(parsed)

	return stripNumbers(stripUnstableIds(stableJsonString))
}

function expectJsonToMatch(filePath: string): void {
	const stableJson = getStableJson(filePath)
	const hash = createHash('sha256').update(stableJson).digest('hex')
	expect(hash).matchSnapshot()
}

// ---- Other formats ----

function getFileHash(filePath: string): string {
	const fileBuffer = readFileSync(filePath)
	const hash = createHash('sha256')
	hash.update(fileBuffer)
	return hash.digest('hex')
}

function expectFileToMatchHash(filePath: string): void {
	expect(getFileHash(filePath)).matchSnapshot()
}

// ---- Public API ----

/**
 * Test fails if the given file does not exist.
 */
export function expectFileToExist(filePath: string): void {
	expect(existsSync(filePath))
}

function expectFileToHaveType(filePath: string, extension: string): void {
	expect(filePath.endsWith(`.${extension}`))
}

/**
 * Test fails if the given file is not a valid image or tldr file.
 */
export async function expectFileToBeValid(filePath: string, extension: string): Promise<void> {
	expectFileToExist(filePath)
	expectFileToHaveType(filePath, extension)

	switch (extension) {
		case 'png': {
			await expectBitmapToMatchSnapshot(filePath)
			break
		}

		case 'svg': {
			expectSvgToMatch(filePath)
			break
		}

		case 'tldr': {
			expectJsonToMatch(filePath)
			break
		}

		default: {
			expectFileToMatchHash(filePath)
			break
		}
	}
}

/**
 * Gets the number of `<style>` elements in the given SVG file.
 */
export function getStyleElementCount(filePath: string): number {
	const svg = readFileSync(filePath, { encoding: 'utf8' })
	const dom = cheerio.load(svg, { xmlMode: true })
	return dom('style').length
}
