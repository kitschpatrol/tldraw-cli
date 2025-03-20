/* eslint-disable ts/no-unnecessary-condition */
/* eslint-disable unicorn/prefer-global-this */
// Note special inline IIFE import, see ./plugins/esbuild-plugin-iife.ts
import type { Browser, Page } from 'puppeteer'
import slugify from '@sindresorhus/slugify'
import * as cheerio from 'cheerio'
import { orderBy } from 'natural-orderby'
import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer'
import { base64ToString, base64ToUint8Array, stringToBase64 } from 'uint8array-extras'
import untildify from 'untildify'
import type { TldrawToImageOptions } from './tldraw-to-image'
import getImageInlineScript from './inline/get-image?iife'
import getTldrInlineScript from './inline/get-tldr?iife'
import setTldrInlineScript from './inline/set-tldr?iife'
import log from './utilities/log'

type TlPage = {
	frames: TlFrame[]
	id: string
	name: string
}
type TlFrame = { id: string; name: string }

type DownloadPlan = {
	fileSuffix: string
	frameId: string | undefined
	pageId: string
}

export default class TldrawController {
	private browser?: Browser
	private isEmpty?: boolean
	private page?: Page

	private get isLocal(): boolean {
		return this.href.startsWith('http://localhost')
	}

	constructor(private readonly href: string) {}

	async close() {
		if (!this.browser) throw new Error('Controller not started')

		// Avoid lingering Chrome processes
		// https://stackoverflow.com/a/76505750/2437832
		const pages = await this.browser.pages()
		await Promise.all(pages.map(async (page) => page.close()))

		await this.browser.close()
		log.info('Stopped controller')
	}

	// eslint-disable-next-line complexity
	async download(options: TldrawToImageOptions): Promise<string[]> {
		// Validate options at the last minute
		if (!this.page) throw new Error('Controller not started')
		if (this.isEmpty) throw new Error('Cannot export an empty document')

		// Only SVGs have style tags
		if (options.stripStyle && options.format !== 'svg')
			log.warn('--strip-style is only supported for SVG output')

		// Many flags don't make sense for TLDR
		if (options.format === 'tldr') {
			if (options.frames !== undefined)
				log.warn(
					'--frames is not supported when exporting to "tldr", ignoring flag and exporting entire sketch file',
				)

			if (options.pages !== undefined)
				log.warn(
					'--pages is not supported when exporting to "tldr", ignoring flag and exporting entire sketch file',
				)

			if (options.dark !== undefined && options.dark) {
				log.warn(
					'--dark is not supported when exporting to "tldr", ignoring flag and exporting sketch file',
				)
			}

			if (options.padding !== undefined) {
				log.warn(
					'--padding is not supported when exporting to "tldr", ignoring flag and exporting sketch file',
				)
			}

			if (options.scale !== undefined) {
				log.warn(
					'--scale is not supported when exporting to "tldr", ignoring flag and exporting sketch file',
				)
			}

			if (options.transparent !== undefined && options.transparent) {
				log.warn(
					'--transparent is not supported when exporting to "tldr", ignoring flag and exporting sketch file',
				)
			}
		}

		// Set defaults, most come from tldraw itself or the cli tools
		const {
			dark = false,
			format = 'svg',
			name: filename,
			output = './',
			padding,
			print = false,
			scale,
			stripStyle = false,
			transparent = false,
		} = this.stripUndefined(options) as TldrawToImageOptions

		// Downloading to TLDR format is a "short path"
		if (format === 'tldr') {
			await this.page.evaluate(getTldrInlineScript)
			const base64String = await this.page.evaluate(async () => window.getTldr())

			if (print) {
				const plainString = base64ToString(base64String).replaceAll('\n', '')
				return [plainString]
			}

			const outputPath = path.resolve(untildify(path.join(output, `${filename}.${format}`)))
			await fs.writeFile(outputPath, base64ToUint8Array(base64String))
			return [outputPath]
		}

		// Download to other formats, long path

		// Load the getImage function into the page
		await this.page.evaluate(getImageInlineScript)

		// Get the page / frames of sketch...
		const sketchStructure = await this.getSketchStructure()

		// Parse those down into a download plan
		// Note that this validates and throws warnings about requested pages and frames
		const downloadPlan = this.getDownloadPlans(sketchStructure, options.pages, options.frames)

		const outputAccumulator: string[] = []

		const initialPageId = await this.getCurrentPage()

		for (const download of downloadPlan) {
			// Change page if necessary
			const currentPageId = await this.getCurrentPage()
			if (download.pageId !== currentPageId) {
				log.info(`Selecting sketch page "${download.pageId}"`)

				await this.setCurrentPage(download.pageId)
			}

			// Wait until editor is available
			await this.page.waitForFunction('editor !== undefined')

			if (download.frameId === undefined) {
				await this.page.evaluate('editor.selectAll()')
			} else {
				// Select frame
				log.info(`Selecting sketch frame "${download.frameId}"`)

				// Select the frame shape
				await this.page.evaluate('editor.selectNone()')
				await this.page.evaluate(`editor.select('${download.frameId}')`)
			}

			let base64String = await this.page.evaluate(async (options) => window.getImage(options), {
				background: transparent === undefined ? undefined : !transparent,
				darkMode: dark,
				format,
				padding,
				scale,
			})

			if (stripStyle && format === 'svg') {
				base64String = stringToBase64(this.stripStyleElement(base64ToString(base64String)))
			}

			if (print) {
				if (format === 'png') {
					outputAccumulator.push(base64String)
				} else {
					// All others are plain text, without newlines
					const plainString = base64ToString(base64String).replaceAll('\n', '')
					outputAccumulator.push(plainString)
				}
			} else {
				const outputPath = path.resolve(
					untildify(path.join(output, `${filename}${download.fileSuffix}.${format}`)),
				)

				await fs.writeFile(outputPath, base64ToUint8Array(base64String))
				outputAccumulator.push(outputPath)
			}
		}

		// Restore page if necessary
		const currentPageId = await this.getCurrentPage()
		if (currentPageId !== initialPageId) {
			await this.setCurrentPage(initialPageId)
		}

		// Sort output naturally in place, addresses rare instability
		return orderBy(outputAccumulator)
	}

	async loadFile(filePath: string) {
		if (!this.page) throw new Error('Controller not started')
		if (this.isLocal)
			throw new Error(
				'File loading is only supported for remote tldraw.com instances. See tldraw-open.ts for local file loading approach.',
			)

		await this.closeMenus()
		await this.page.evaluate(`userPreferences.showFileOpenWarning.set(false);`)

		log.info(`Uploading local file to tldraw.com: ${filePath}`)
		const tldrFile = await fs.readFile(filePath, 'utf8')

		// We have to call a custom function to upload the tldr file,
		// puppeteer waitForFileChooser fileInput.accept etc. does NOT work
		await this.page.evaluate(setTldrInlineScript)
		await this.page.evaluate(`window.setTldr(${tldrFile})`)
	}

	async start() {
		// Set up Puppeteer
		log.info('Starting Puppeteer...')
		this.browser = await puppeteer.launch({
			args: this.isLocal
				? ['--no-sandbox', '--disable-web-security', '--disable-setuid-sandbox']
				: // Both contexts for now?
					['--no-sandbox', '--disable-web-security', '--disable-setuid-sandbox'],
			headless: true,
		})

		this.page = await this.browser.newPage()
		this.page.setDefaultTimeout(120_000)

		// Set up console logging passthrough
		this.page.on('console', (message) => {
			const messageType = message.type()
			const messageText = message.text()

			if (messageType === 'error') {
				log.errorPrefixed('Browser', messageText)
			} else if (messageType === 'warn') {
				log.warnPrefixed('Browser', messageText)
			} else {
				log.infoPrefixed('Browser', messageText)
			}
		})

		// Navigate to tldraw
		log.info(`Navigating to: ${this.href}`)
		await this.page.goto(this.href, { waitUntil: 'networkidle0' })

		// Wait until editor is available
		await this.page.waitForFunction('editor !== undefined')

		// Check for emptiness
		const shapeCount = (await this.page.evaluate('editor.getCurrentPageShapes().length')) as number
		this.isEmpty = shapeCount === 0
	}

	private async closeMenus(): Promise<void> {
		if (!this.page) throw new Error('Controller not started')
		await this.page.evaluate(`editor.clearOpenMenus()`)
	}

	private async getCurrentPage(): Promise<string> {
		if (!this.page) throw new Error('Controller not started')
		return (await this.page.evaluate(`editor.getCurrentPageId()`)) as string
	}

	// eslint-disable-next-line complexity
	private getDownloadPlans(
		sketch: TlPage[],
		pages?: boolean | number[] | string[],
		frames?: boolean | string[],
	): DownloadPlan[] {
		const validPages = this.validatePages(sketch, pages)
		const validFrames = this.validateFrames(sketch, validPages, frames)

		// First pick pages
		// Logic:
		// Pages undefined or false, download the first page only
		// Pages true, download all pages
		// Pages string array, download matching page ids or names, allowing slugs and prefixes
		// TODO Pages number array, download matching page indexes
		const filteredSketch =
			validPages === undefined
				? [sketch[0]]
				: typeof validPages === 'boolean' && !validPages
					? [sketch[0]]
					: sketch.filter((sketchPage) =>
							typeof validPages === 'boolean' && validPages
								? true
								: validPages.some(
										(p) =>
											slugify(p) === slugify(sketchPage.name) ||
											p.replace('page:', '') === sketchPage.id.replace('page:', ''),
									),
						)

		// Then pick frames for each page
		// Logic:
		// Frames undefined or false, download the whole page contents, so pass empty array to frames
		// Frames true, download each frame separately
		// Frames string array, download matching frame ids or names, allowing slugs and prefixes

		for (const page of filteredSketch) {
			page.frames =
				validFrames === undefined || (typeof validFrames === 'boolean' && !validFrames)
					? [] // Empty means download entire page as-is!
					: page.frames.filter((frame) =>
							typeof validFrames === 'boolean' && validFrames
								? true
								: validFrames.some(
										(f) =>
											slugify(f) === slugify(frame.name) ||
											f.replace('shape:', '') === frame.id.replace('shape:', ''),
									),
						)
		}

		// Flatten the filtered sketch into a download plan
		const downloadPlans: DownloadPlan[] = []

		// Check for page.name collisions, if we have any then include page id in the filename
		const isPageNameCollision =
			new Set(filteredSketch.map((page) => slugify(page.name))).size !== filteredSketch.length

		if (isPageNameCollision) {
			log.warn(
				'Page names are not unique, including page IDs in the output filenames to avoid collisions',
			)
		}

		for (const page of filteredSketch) {
			// Ensure page names are unique

			const pageSuffix =
				validPages === undefined || (typeof validPages === 'boolean' && !validPages)
					? undefined // No suffix unless pages are explicitly requested
					: isPageNameCollision
						? `${slugify(page.name)}-${page.id.replace('page:', '')}`
						: slugify(page.name)

			if (page.frames.length === 0) {
				downloadPlans.push({
					fileSuffix: pageSuffix ?? '',
					frameId: undefined,
					pageId: page.id,
				})
			} else {
				// Check for frame name collisions, if we have any then include frame id in the filename
				const isFrameNameCollision =
					new Set(page.frames.map((frame) => slugify(frame.name))).size !== page.frames.length

				// TODO warn once?
				if (isFrameNameCollision) {
					log.warn(
						'Frame names are not unique, including frame IDs in the output filenames to avoid collisions',
					)
				}

				for (const frame of page.frames) {
					// Frames must have been explicitly requested
					const frameSuffix = isFrameNameCollision
						? [slugify(frame.name), frame.id.replace('shape:', '')]
								.filter((value) => value !== '')
								.join('-')
						: slugify(frame.name)

					downloadPlans.push({
						fileSuffix: [pageSuffix, frameSuffix].filter((value) => value !== undefined).join('-'),
						frameId: frame.id,
						pageId: page.id,
					})
				}
			}
		}

		// Prefix suffix with dash
		for (const plan of downloadPlans) {
			if (plan.fileSuffix !== '') {
				plan.fileSuffix = `-${plan.fileSuffix}`
			}
		}

		return downloadPlans
	}

	private async getPageFrames(pageId: string): Promise<TlFrame[]> {
		if (!this.page) throw new Error('Controller not started')

		const initialPageId = await this.getCurrentPage()

		if (pageId !== initialPageId) {
			await this.setCurrentPage(pageId)
		}

		// Returns empty array if no frames
		// Note that while 'Frame' is the default name shown in the UI... it's an
		// empty string in the data until explicitly set by the user (consider i18n)
		// we could pass 'frame' here for nicer filenames
		const frames = (await this.page.evaluate(
			`editor.getCurrentPageShapes().reduce((accumulator, shape) => {
				if (shape.type === 'frame') {
					accumulator.push({ id: shape.id, name: shape.props.name === '' ? 'Frame' : shape.props.name })
				}
				return accumulator
			}, [])`,
		)) as TlFrame[]

		// Restore page if necessary
		if (pageId !== initialPageId) {
			await this.setCurrentPage(initialPageId)
		}

		return frames
	}

	private async getPages(): Promise<TlPage[]> {
		if (!this.page) throw new Error('Controller not started')

		return (await this.page.evaluate(
			`editor.getPages().map((page) => ({ id: page.id, name: page.name, frames: []}))`,
		)) as TlPage[]
	}

	// Structure
	private async getSketchStructure(): Promise<TlPage[]> {
		if (!this.page) throw new Error('Controller not started')

		const document = await this.getPages()

		for (const page of document) {
			page.frames = await this.getPageFrames(page.id)
		}

		return document
	}

	private async setCurrentPage(pageId?: string): Promise<void> {
		if (!this.page) throw new Error('Controller not started')
		await this.page.evaluate(`editor.setCurrentPage("${pageId}")`)
	}

	// Helpers
	private stripStyleElement(svg: string): string {
		const dom = cheerio.load(svg, { xmlMode: true })
		dom('style').remove()
		return dom.xml()
	}

	private stripUndefined(options: Record<string, unknown>): Record<string, unknown> {
		return Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined))
	}

	private validateFrames(
		sketch: TlPage[],
		pages: boolean | number[] | string[] | undefined,
		frames: boolean | string[] | undefined,
	): boolean | string[] | undefined {
		if (Array.isArray(frames)) {
			const validSketch = sketch.filter(
				(page, index) =>
					pages === undefined ||
					(typeof pages === 'boolean' && !pages && index === 0) ||
					(typeof pages === 'boolean' && pages) ||
					(Array.isArray(pages) &&
						pages.some((p, index) =>
							typeof p === 'number'
								? index === p
								: slugify(p) === slugify(page.name) ||
									p.replace(/^page:/, '') === page.id.replace(/^page:/, ''),
						)),
			)

			const validFrames = []

			for (const f of frames) {
				const matchingFrames: string[] = []

				// One frame name can match multiple frame IDs across pages
				for (const page of validSketch) {
					const match = page.frames.find(
						(frame) =>
							slugify(f) === slugify(frame.name) ||
							`shape:${f.replace(/^shape:/, '')}` === frame.id,
					)

					if (match && !matchingFrames.includes(match.id)) {
						matchingFrames.push(match.id)
					}
				}

				if (matchingFrames.length === 0) {
					log.warn(`Frame "${f}" not found in sketch`)
				} else {
					validFrames.push(...matchingFrames)
				}

				if (validFrames.length === 0) {
					log.warn('None of the requested frames were found in sketch, ignoring frames option')
					return undefined
				}
			}

			return validFrames
		}

		return frames
	}

	// Deduplicates, verifies existence, and normalizes to ids of the style 'page:xxxx'
	private validatePages(
		sketch: TlPage[],
		pages: boolean | number[] | string[] | undefined,
	): boolean | string[] | undefined {
		if (Array.isArray(pages)) {
			const validPages: string[] = []
			for (const p of pages) {
				const matchingPage =
					typeof p === 'number'
						? sketch[p]
						: sketch.find(
								(page) =>
									slugify(p) === slugify(page.name) ||
									`page:${p.replace(/^page:/, '')}` === page.id,
							)
				if (matchingPage) {
					if (!validPages.includes(matchingPage.id)) {
						validPages.push(matchingPage.id)
					}
				} else {
					log.warn(`Page "${p}" not found in sketch`)
				}
			}

			if (validPages.length === 0) {
				log.warn('None of the requested pages were found in sketch, ignoring pages option')
				return undefined
			}

			return validPages
		}

		return pages
	}
}
