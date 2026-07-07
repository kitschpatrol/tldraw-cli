import '@blazediff/vitest'
import * as cheerio from 'cheerio'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { stringify } from 'safe-stable-stringify'
import { expect } from 'vitest'

// BlazeDiff options for PNG comparison: use SSIM for perceptual similarity,
// allowing minor cross-platform rendering differences to pass.
// Threshold of 1% accommodates macOS vs. Linux Chromium rendering variance
// (observed up to ~0.42% in CI).
const imageSnapshotOptions = {
	failureThreshold: 1,
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
 *
 * - <style> elements (font embedding order is non-deterministic)
 * - Comment nodes
 * - Inline `style` attributes (huge, unstable across Chromium versions)
 * - `id` attributes and `url(#…)` references (tldraw's export uses React
 *   `useId()`, whose output depends on the surrounding tree shape — not on
 *   anything visually observable). Also sorts remaining attributes on every
 *   element for canonical output.
 * - `pseudo-XXXXXXXXXXXXXXXXXXXXX` class tokens that tldraw uses to scope CSS
 *   pseudo-element rules to specific elements; the ID changes between runs and
 *   the matching `<style>` rules are already removed above.
 */
function cleanSvg(svgContent: string): string {
	const dom = cheerio.load(svgContent, { xmlMode: true })

	// Remove <style> elements
	dom('style').remove()

	// Remove comment nodes
	dom('*')
		.contents()
		.filter((_index, contentNode) => contentNode.nodeType === 8)
		.remove()

	// Process every element: remove inline styles, blank out all ids, and sort
	// attributes for deterministic output.
	dom('*').each((_index, rawElement) => {
		const element = dom(rawElement)

		element.removeAttr('style')
		element.attr('id', '')

		// Sort attributes for deterministic serialization order. Cheerio
		// doesn't expose a public API for reordering attributes, so we
		// access the internal `attribs` property on the underlying node.

		const node = rawElement as unknown as { attribs: Record<string, string> }
		const sorted: Record<string, string> = {}
		for (const k of Object.keys(node.attribs).toSorted()) {
			sorted[k] = node.attribs[k]
		}

		node.attribs = sorted
	})

	// Blank out url(#…) references in any attribute (mask, fill, clip-path,
	// etc.) and pseudo-XXX class tokens so the cleaned form matches
	// regardless of the underlying id.
	return dom
		.xml()
		.replaceAll(/url\(#[^\)]*\)/gv, 'url(#)')
		.replaceAll(/pseudo-[\w\-]{21}/gv, 'pseudo-')
}

/**
 * Replace numeric values (integers, decimals, negative numbers, scientific
 * notation) with a placeholder to absorb rounding differences across platforms,
 * while preserving tag names and attribute names.
 */
function stripNumbers(text: string): string {
	return text.replaceAll(/-?\d+(?:\.\d+)?(?:e[+\-]?\d+)?/giv, '0')
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
 * Remove all dynamic IDs from the given text, replacing them with a stable
 * string.
 */
export function stripUnstableIds(text: string): string {
	// 21-character tldraw IDs fluctuate from run to run
	// eslint-disable-next-line regexp/no-unused-capturing-group
	return text.replaceAll(/:([^\s",.:]{21})"/gv, () => `:XXXXXXXXXXXXXXXXXXXXX"`)
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
 * Build a sort key for a tldraw record that is stable across runs. Bindings get
 * new random IDs each export, so we sort them by their relationship (fromId +
 * toId + terminal) instead.
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

	const parsed = JSON.parse(jsonContent) as TldrawRecord

	// Drop `user` records — pure session metadata (random id, random hex
	// color) that's unrelated to sketch content. The random color escapes
	// `stripNumbers` because A-F hex letters remain after digit stripping.
	// Sort the remaining records for deterministic ordering — tldraw emits
	// records in non-deterministic order across runs. Use a composite key
	// so records with unstable IDs (like bindings) sort by their stable
	// relationship fields instead.
	if (parsed.records) {
		parsed.records = parsed.records.filter((record) => record.typeName !== 'user')
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
 * Test fails if the given file does not look structurally valid for its type.
 * Does NOT compare against snapshots — use for tests against live/mutable
 * sources.
 */
export function expectFileToBeStructurallyValid(filePath: string, extension: string): void {
	expectFileToExist(filePath)
	expectFileToHaveType(filePath, extension)

	const content = readFileSync(filePath, { encoding: 'utf8' })
	expect(content.length).toBeGreaterThan(0)

	switch (extension) {
		case 'png': {
			// Full 8-byte PNG signature
			const buffer = readFileSync(filePath)
			expect(buffer.length).toBeGreaterThan(67) // Minimum valid PNG size
			expect([...buffer.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
			break
		}

		case 'svg': {
			const dom = cheerio.load(content, { xmlMode: true })
			const svg = dom('svg')
			expect(svg.length).toBe(1)
			expect(svg.attr('viewBox')).toBeDefined()
			expect(svg.children().length).toBeGreaterThan(0)
			break
		}

		case 'tldr': {
			const parsed = JSON.parse(content) as TldrawRecord
			expect(parsed).toHaveProperty('tldrawFileFormatVersion')
			expect(parsed).toHaveProperty('schema')
			expect(parsed).toHaveProperty('records')
			expect(Array.isArray(parsed.records)).toBe(true)
			expect(parsed.records!.length).toBeGreaterThan(0)
			const typeNames = new Set(parsed.records!.map((r) => r.typeName))
			expect(typeNames).toContain('document')
			expect(typeNames).toContain('page')
			break
		}

		default: {
			break
		}
	}
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
