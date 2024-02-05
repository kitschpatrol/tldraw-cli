// Note special inline IIFE import, see ./plugins/esbuild-plugin-iife.ts
import downloadTldrInlineScript from './inline/download-tldr?iife'
import uploadTldrInlineScript from './inline/upload-tldr?iife'
import type { TldrawFormat } from './tldraw-to-image'
import log from './utilities/log'
import slugify from '@sindresorhus/slugify'
import * as cheerio from 'cheerio'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import puppeteer from 'puppeteer'
import type { Browser, CDPSession, Page } from 'puppeteer'
import untildify from 'untildify'

type PageFrame = { id: string; name: string }

/* eslint-disable perfectionist/sort-classes */
export default class TldrawController {
	private page?: Page
	private isEmpty?: boolean
	private browser?: Browser
	private client?: CDPSession
	private originalDarkMode?: boolean

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

		// Set up download rules
		this.client = await this.page.target().createCDPSession()
		await this.client.send('Browser.setDownloadBehavior', {
			behavior: 'allowAndName',
			downloadPath: os.tmpdir(),
			eventsEnabled: true,
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
		if (this.originalDarkMode !== undefined) {
			log.info(`Restoring dark mode: ${this.originalDarkMode}`)
			await this.setDarkMode(this.originalDarkMode)
		}

		await this.browser.close()
		log.info('Stopped controller')
	}

	// Public method doesn't expose pageFrame
	async download(
		output: string,
		filename: string,
		format: TldrawFormat,
		stripStyle: boolean,
		print: boolean,
	): Promise<string[]> {
		return this._download(output, filename, format, stripStyle, undefined, print)
	}

	async downloadFrame(
		output: string,
		filename: string,
		format: TldrawFormat,
		stripStyle: boolean,
		frameNameOrId: string,
		print: boolean,
	): Promise<string[]> {
		return this.downloadFrames(output, filename, format, stripStyle, [frameNameOrId], print)
	}

	async downloadFrames(
		output: string,
		filename: string,
		format: TldrawFormat,
		stripStyle: boolean,
		frameNamesOrIds: string[],
		print: boolean,
	): Promise<string[]> {
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
				...(await this._download(
					output,
					`${filename}${frameSuffix}`,
					format,
					stripStyle,
					frame,
					print,
				)),
			)
		}

		return outputAccumulator
	}

	async downloadAllFrames(
		output: string,
		filename: string,
		format: TldrawFormat,
		stripStyle: boolean,
		print: boolean,
	): Promise<string[]> {
		const pageFrames = await this.getPageFrames()
		const frameNamesOrIds = pageFrames.map((f) => f.id)
		return this.downloadFrames(output, filename, format, stripStyle, frameNamesOrIds, print)
	}

	// Ephemeral means we don't have to restore the user's value
	async setTransparency(transparent: boolean): Promise<void> {
		if (!this.page) throw new Error('Controller not started')
		log.info(`Setting background transparency: ${transparent}`)
		await this.page.evaluate(
			`editor.updateInstanceState(
			{ exportBackground: ${!transparent} },
			{ ephemeral: true },
		 )`,
		)
	}

	async setDarkMode(darkMode: boolean) {
		if (!this.page) throw new Error('Controller not started')
		log.info(`Setting dark mode: ${darkMode}`)
		if (!this.originalDarkMode) this.originalDarkMode = await this.getDarkMode()
		await this.page.evaluate(`editor.user.updateUserPreferences({ isDarkMode: ${darkMode}})`)
	}

	async loadFile(filePath: string) {
		if (!this.page) throw new Error('Controller not started')
		if (this.isLocal)
			throw new Error(
				'File loading is only supported for remote tldraw.com instances. See tldraw-open for local file loading approach.',
			)

		await this.closeMenus()
		await this.page.evaluate(`userPreferences.showFileOpenWarning.set(false);`)

		log.info(`Uploading local file to tldraw.com: ${filePath}`)
		const tldrFile = await fs.readFile(filePath, 'utf8')

		// We have to call a custom function to upload the tldr file,
		// puppeteer waitForFileChooser fileInput.accept etc. does NOT work
		await this.page.evaluate(uploadTldrInlineScript)
		await this.page.evaluate("console.log('window.uploadTldr')")
		await this.page.evaluate(`window.uploadTldr(${tldrFile.toString()})`)
	}

	async getShareUrl(): Promise<string> {
		if (!this.page) throw new Error('Controller not started')
		if (this.isLocal)
			throw new Error('Share URLs are only supported for remote tldraw.com instances.')

		await this.closeMenus()
		await this.clickMenuTestIds(['main.menu', 'menu-item.file', 'menu-item.share-project'])
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
		output: string,
		filename: string,
		format: TldrawFormat,
		stripStyle: boolean,
		pageFrame: PageFrame | undefined, // Trust that existence has been validated
		print: boolean,
	): Promise<string[]> {
		if (!this.page) throw new Error('Controller not started')

		if (this.isEmpty) {
			throw new Error('Cannot export an empty document')
		}

		if (stripStyle && format !== 'svg') {
			log.warn('--strip-style is only supported for SVG output')
		}

		if (pageFrame !== undefined && format === 'tldr') {
			log.warn('--frames is not supported for tldr output, downloading entire document')
		}

		// Brittle, TODO how to invoke this from the browser console?
		const completionPromise = this.waitForDownloadCompletion()
		await this.closeMenus()

		let frameSuffix = ''

		// Todo what happens with tldr?
		if (pageFrame !== undefined && format !== 'tldr') {
			log.info(`Selecting sketch frame "${pageFrame.name}" with ID "${pageFrame.id}"`)

			frameSuffix = `-${slugify(pageFrame.name)}`

			// Select the frame shape
			await this.page.evaluate('editor.selectNone()')
			await this.page.evaluate(`editor.select('${pageFrame.id}')`)
		}

		if (pageFrame === undefined && format === 'json') {
			// For some reason json export returns undefined when nothing
			// is selected
			await this.page.evaluate('editor.selectAll()')
		}

		// eslint-disable-next-line unicorn/prefer-ternary
		if (format === 'tldr') {
			// We have to call a custom function to download the tldr file
			await this.page.evaluate(downloadTldrInlineScript)
		} else {
			// Export
			await this.clickMenuTestIds([
				'main.menu',
				'menu-item.edit',
				'menu-item.export-as',
				`menu-item.export-as-${format}`,
			])
		}

		const downloadGuid = await completionPromise

		// _really_ wait for download to complete, can get intermittent failures
		// without this
		await this.page.waitForNetworkIdle()

		// Move and rename the downloaded file from temp to output destination
		const downloadPath = path.join(os.tmpdir(), downloadGuid)

		// Don't move the file if we're printing
		const outputPath = print
			? downloadPath
			: path.resolve(untildify(path.join(output, `${filename}${frameSuffix}.${format}`)))

		if (!print) await fs.rename(downloadPath, outputPath)

		if (stripStyle && format === 'svg') {
			// Strip style from the SVG
			const svg = await fs.readFile(outputPath, 'utf8')
			const strippedSvg = this.stripStyleElement(svg)
			await fs.writeFile(outputPath, strippedSvg)
		}

		// Naive implementation
		if (print) {
			if (format === 'png') {
				// Convert to base64
				const buffer = await fs.readFile(outputPath)
				const outputBase64 = buffer.toString('base64')
				return [outputBase64]
			}

			// All others are plain text, without newlines
			const outputString: string = await fs.readFile(outputPath, 'utf8')
			const outputStringNoNewlines = outputString.replaceAll('\n', '')
			return [outputStringNoNewlines]
		}

		return [outputPath]
	}

	private async closeMenus(): Promise<void> {
		if (!this.page) throw new Error('Controller not started')
		await this.page.evaluate(`app.clearOpenMenus()`)
	}

	private async clickMenuTestIds(testIds: string[]) {
		if (!this.page) throw new Error('Controller not started')
		for (const testId of testIds) {
			await this.page.waitForSelector(`[data-testid="${testId}"]`)
			await this.page.click(`[data-testid="${testId}"]`)
		}
	}

	private async waitForDownloadCompletion(): Promise<string> {
		return new Promise((resolve, reject) => {
			if (!this.client) throw new Error('Controller not started')
			this.client.on('Browser.downloadProgress', (event) => {
				if (event.state === 'completed') {
					resolve(event.guid)
				} else if (event.state === 'canceled') {
					reject(new Error('Download was canceled'))
				}
			})
		})
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

	// TODO possible performance gains by only setting transparency as needed?
	// async function getTransparency(page: Page): Promise<boolean> {
	// 	return !(await page.evaluate('editor.getInstanceState().exportBackground'))
	// }

	private async getDarkMode(): Promise<boolean> {
		if (!this.page) throw new Error('Controller not started')
		return Boolean(await this.page.evaluate('editor.user.getUserPreferences().isDarkMode'))
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

	private stripStyleElement(svg: string): string {
		const dom = cheerio.load(svg, { xmlMode: true })
		dom('style').remove()
		return dom.xml()
	}
}
