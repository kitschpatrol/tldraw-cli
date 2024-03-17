// Note special inline IIFE import, see ./plugins/esbuild-plugin-iife.ts
import getImageInlineScript from './inline/get-image?iife'
import getTldrInlineScript from './inline/get-tldr?iife'
import setTldrInlineScript from './inline/set-tldr?iife'
import type { TldrawToImageOptions } from './tldraw-to-image'
import log from './utilities/log'
import slugify from '@sindresorhus/slugify'
import * as cheerio from 'cheerio'
import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer'
import type { Browser, Page } from 'puppeteer'
import { base64ToString, base64ToUint8Array, stringToBase64 } from 'uint8array-extras'
import untildify from 'untildify'

type DownloadOptions = Omit<TldrawToImageOptions, 'frames'>
type PageFrame = { id: string; name: string }

/* eslint-disable perfectionist/sort-classes */
export default class TldrawController {
	private page?: Page
	private isEmpty?: boolean
	private browser?: Browser

	constructor(private readonly href: string) {
		this.href = href
	}

	private get isLocal(): boolean {
		return this.href.startsWith('http://localhost')
	}

	async start() {
		// Set up Puppeteer
		log.info('Starting Puppeteer...')
		this.browser = await puppeteer.launch({
			args: this.isLocal ? ['--no-sandbox', '--disable-web-security'] : [],
			headless: true,
		})

		this.page = await this.browser.newPage()

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

		// Check for emptiness
		const shapeCount = (await this.page.evaluate('editor.getCurrentPageShapes().length')) as number
		this.isEmpty = shapeCount === 0
	}

	async close() {
		if (!this.browser) throw new Error('Controller not started')

		await this.browser.close()
		log.info('Stopped controller')
	}

	// Public method doesn't expose pageFrame
	async download(options: DownloadOptions): Promise<string[]> {
		return this._download(undefined, options)
	}

	async downloadFrame(frameNameOrId: string, options: DownloadOptions): Promise<string[]> {
		return this.downloadFrames([frameNameOrId], options)
	}

	async downloadFrames(frameNamesOrIds: string[], options: DownloadOptions): Promise<string[]> {
		// Validate frame existence
		const validPageFrames: PageFrame[] = []
		for (const frame of frameNamesOrIds) {
			const pageFrame = await this.getPageFrameWithNameOrId(frame)
			if (pageFrame === undefined) {
				log.warn(`Frame "${frame}" not found, skipping`)
			} else {
				validPageFrames.push(pageFrame)
			}
		}

		if (validPageFrames.length === 0) {
			throw new Error('No valid frames found')
		}

		// Check for frame.name collisions, if we have any then include frame id in the filename
		const validFrameNames = validPageFrames.map((frame) => slugify(frame.name))
		const isFrameNameCollision = validFrameNames.length !== new Set(validFrameNames).size

		if (isFrameNameCollision) {
			log.warn(
				'Frame names are not unique, including frame IDs in the output filenames to avoid collisions',
			)
		}

		const outputAccumulator: string[] = []
		for (const frame of validPageFrames) {
			const frameSuffix = isFrameNameCollision ? `-${frame.id.replace('shape:', '')}` : ''
			outputAccumulator.push(
				...(await this._download(frame, {
					...options,
					name: `${options.name}${frameSuffix}`,
				})),
			)
		}

		return outputAccumulator
	}

	async downloadAllFrames(options: DownloadOptions): Promise<string[]> {
		const pageFrames = await this.getPageFrames()
		const frameNamesOrIds = pageFrames.map((f) => f.id)
		return this.downloadFrames(frameNamesOrIds, options)
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

	async getShareUrl(): Promise<string> {
		if (!this.page) throw new Error('Controller not started')
		if (this.isLocal)
			throw new Error('Share URLs are only supported for remote tldraw.com instances.')

		// TODO revisit this without UI manipulation
		await this.closeMenus()
		await this.clickButtonTitles(['Menu', 'File', 'Share this project'])
		// Recently broken
		// await this.clickMenuTestIds(['main.menu', 'menu-item.file', 'menu.share-project'])
		await this.page.waitForNavigation({ waitUntil: 'networkidle0' })

		// Clear search params with viewport offset
		// Tried zooming to fit and then waiting for param update,
		// but wasn't reliable
		const shareUrl = new URL(this.page.url())
		shareUrl.search = ''
		return shareUrl.href
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	private async _download(
		pageFrame: PageFrame | undefined, // Trust that existence has been validated
		options: DownloadOptions,
	): Promise<string[]> {
		// Validate options at the last minute
		if (!this.page) throw new Error('Controller not started')
		if (this.isEmpty) throw new Error('Cannot export an empty document')

		// Only SVGs have style tags
		if (options.stripStyle && options.format !== 'svg')
			log.warn('--strip-style is only supported for SVG output')

		// Many flags don't make sense for TLDR
		if (options.format === 'tldr') {
			if (pageFrame !== undefined)
				log.warn(
					'--frames is not supported when exporting to "tldr", ignoring flag and exporting entire sketch file',
				)

			if (options.dark !== false) {
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

			if (options.transparent !== false) {
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
		} = this.stripUndefined(options) as DownloadOptions

		let frameSuffix = ''
		let base64String = ''

		if (format === 'tldr') {
			// Downloading to TLDR format
			await this.page.evaluate(getTldrInlineScript)
			base64String = await this.page.evaluate(async () => window.getTldr())
		} else {
			// Downloading to an image format
			if (pageFrame === undefined) {
				await this.page.evaluate('editor.selectAll()')
			} else {
				// Select frame
				log.info(`Selecting sketch frame "${pageFrame.name}" with ID "${pageFrame.id}"`)
				frameSuffix = `-${slugify(pageFrame.name)}`

				// Select the frame shape
				await this.page.evaluate('editor.selectNone()')
				await this.page.evaluate(`editor.select('${pageFrame.id}')`)
			}

			// Load the getImage function into the page
			await this.page.evaluate(getImageInlineScript)

			base64String = await this.page.evaluate(async (options) => window.getImage(options), {
				background: transparent === undefined ? undefined : !transparent,
				darkMode: dark,
				format,
				padding,
				scale,
			})

			if (stripStyle && format === 'svg') {
				base64String = stringToBase64(this.stripStyleElement(base64ToString(base64String)))
			}
		}

		const outputPath = path.resolve(
			untildify(path.join(output, `${filename}${frameSuffix}.${format}`)),
		)

		if (print) {
			if (format === 'png') {
				return [base64String]
			}

			// All others are plain text, without newlines
			const plainString = base64ToString(base64String).replaceAll('\n', '')
			return [plainString]
		}

		await fs.writeFile(outputPath, base64ToUint8Array(base64String))
		return [outputPath]
	}

	private async closeMenus(): Promise<void> {
		if (!this.page) throw new Error('Controller not started')
		await this.page.evaluate(`editor.clearOpenMenus()`)
	}

	// Band-aide which will break under different translations
	// TODO more robust
	private async clickButtonTitles(titles: string[]) {
		if (!this.page) throw new Error('Controller not started')
		for (const title of titles) {
			await this.page.waitForSelector(`button[title="${title}"]`)
			await this.page.click(`button[title="${title}"]`)
		}
	}

	// TODO memoize...
	private async getPageFrameWithNameOrId(nameOrId: string): Promise<PageFrame | undefined> {
		const pageFrames = await this.getPageFrames()

		if (pageFrames.length === 0) {
			throw new Error('No frames found')
		}

		return (
			pageFrames.find((f) => f.name === nameOrId || slugify(f.name) === nameOrId) ??
			pageFrames.find(
				(f) => f.id === (nameOrId.startsWith('shape:') ? nameOrId : `shape:${nameOrId}`),
			)
		)
	}

	// TODO memoize
	private async getPageFrames(): Promise<PageFrame[]> {
		if (!this.page) throw new Error('Controller not started')
		// Returns empty array if no frames
		return (await this.page.evaluate(
			`editor.getCurrentPageShapes().reduce((accumulator, shape) => {
				if (shape.type === 'frame') {
					accumulator.push({ id: shape.id, name: shape.props.name })
				}
				return accumulator
			}, [])`,
		)) as PageFrame[]
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
}
