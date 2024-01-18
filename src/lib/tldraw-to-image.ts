/* eslint-disable complexity */

import { validatePathOrUrl } from './validation'
import slugify from '@sindresorhus/slugify'
import * as cheerio from 'cheerio'
import express from 'express'
import getPort from 'get-port'
import fs from 'node:fs/promises'
import { type Server } from 'node:http'
import { type AddressInfo } from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'
import type { CDPSession, Page } from 'puppeteer'
import untildify from 'untildify'

export type TldrawToImageOptions = {
	darkMode?: boolean
	format?: 'png' | 'svg'
	frames?: boolean | string[]
	name?: string
	output?: string
	stripStyle?: boolean
	transparent?: boolean
	verbose?: boolean
}

// Name should default to undefined

type TldrawToImageOptionsRequired = Required<Omit<TldrawToImageOptions, 'name'>> &
	Pick<TldrawToImageOptions, 'name'>

const defaultOptions: TldrawToImageOptionsRequired = {
	darkMode: false,
	format: 'svg',
	frames: false,
	name: undefined,
	output: './',
	stripStyle: false,
	transparent: false,
	verbose: false,
}

// Overloaded for clean return types
// TODO Maybe get rid of this and always return an array in 3.0
export async function tldrawToImage(
	tldrPathOrUrl: string,
	options?: TldrawToImageOptions & { frames?: false | undefined },
): Promise<string>
export async function tldrawToImage(
	tldrPathOrUrl: string,
	options?: TldrawToImageOptions & { frames: string[] | true },
): Promise<string[]>
export async function tldrawToImage(
	tldrPathOrUrl: string,
	options?: TldrawToImageOptions,
): Promise<string | string[]> {
	const resolvedOptions: TldrawToImageOptionsRequired = {
		...defaultOptions,
		...stripUndefined(options ?? {}),
	}
	const { darkMode, format, frames, name, output, stripStyle, transparent, verbose } =
		resolvedOptions

	if (stripStyle && format === 'png') {
		console.warn('Warning: --strip-style is only supported for SVG output')
	}

	if (verbose) console.time('Export time')

	const validatedPathOrUrl = validatePathOrUrl(tldrPathOrUrl, {
		requireFileExistence: true,
		validFileExtensions: ['.tldr'],
		validHostnames: ['www.tldraw.com'],
	})

	// Identify URL vs. file path
	const isLocal = typeof validatedPathOrUrl === 'string'
	if (verbose) console.log(isLocal ? 'Local file detected' : 'tldraw URL detected')

	// Use name flag if available then source filename if available, otherwise the ID from the URL
	// May be suffixed if --frames is set
	// TODO consider 'editor.getDocumentSettings().name', but always appears empty?
	const outputFilename =
		name === undefined
			? isLocal
				? path.basename(validatedPathOrUrl, path.extname(validatedPathOrUrl))
				: validatedPathOrUrl.pathname.split('/').pop() ?? validatedPathOrUrl.pathname
			: sanitizeName(name, format)

	// Set up local server if appropriate
	let port = 0
	let server: Server | undefined
	if (isLocal) {
		// Serve local tldraw
		if (verbose) console.log('Starting tldraw server...')

		const scriptDirectory = dirname(fileURLToPath(import.meta.url))

		// Handle dev or prod relative paths, brittle
		const tldrawPath = path.join(
			scriptDirectory,
			scriptDirectory.endsWith('/src/lib')
				? '../../dist/tldraw'
				: scriptDirectory.endsWith('/dist/lib')
					? '../tldraw'
					: '../dist/tldraw',
		)

		if (verbose) console.log(`tldraw served from "${tldrawPath}"`)
		server = await startServer(tldrawPath)
		port = (server.address() as AddressInfo).port
		if (verbose) console.log(`tldraw hosted at "http://localhost:${port}"`)
	}

	// Set up Puppeteer
	if (verbose) console.log('Starting Puppeteer...')
	const browser = await puppeteer.launch({
		args: isLocal ? ['--no-sandbox', '--disable-web-security'] : [],
		headless: 'new',
	})
	const page = await browser.newPage()
	echoBrowserConsole(page, verbose)
	const client = await page.target().createCDPSession()
	await client.send('Browser.setDownloadBehavior', {
		behavior: 'allowAndName',
		downloadPath: os.tmpdir(),
		eventsEnabled: true,
	})

	if (isLocal) {
		// Hush the favicon kvetch (for local tldraw)
		await page.setRequestInterception(true)
		page.on('request', (request) => {
			if (request.url().endsWith('favicon.ico')) {
				void request.respond({ status: 200 })
			} else {
				void request.continue()
			}
		})

		// Load tldr data and put it in local storage
		if (verbose) console.log(`Loading tldr file "${validatedPathOrUrl}"`)
		const tldrFile = await fs.readFile(validatedPathOrUrl, 'utf8')

		await page.evaluateOnNewDocument((data) => {
			localStorage.clear()
			localStorage.setItem('tldrData', data)
		}, tldrFile)
	}

	// Navigate to tldraw
	const tldrawUrl = isLocal ? `http://localhost:${port}` : validatedPathOrUrl.href
	if (verbose) console.log(`Navigating to: ${tldrawUrl}`)
	await page.goto(tldrawUrl, { waitUntil: 'networkidle0' })

	// Check for emptiness
	const shapeCount = (await page.evaluate('editor.getCurrentPageShapes().length')) as number
	if (verbose) console.log(`Shape count: ${shapeCount}`)
	if (shapeCount === 0) {
		throw new Error('The sketch is empty')
	}

	// Set transparency
	if (verbose) console.log(`Setting background transparency: ${transparent}`)
	await setTransparency(page, transparent)

	// Set dark mode
	if (verbose) console.log(`Setting dark mode: ${darkMode}`)
	const originalDarkMode = await getDarkMode(page)
	await setDarkMode(page, darkMode)

	// Run the downloads
	let exportReport: string | string[] = []

	// Check for frames
	// Get frames from the page
	const pageFrames = frames
		? ((await page.evaluate(
				`editor.getCurrentPageShapes().reduce((accumulator, shape) => {
				if (shape.type === 'frame') {
					accumulator.push({ id: shape.id, name: shape.props.name })
				}
				return accumulator
			}, [])`,
			)) as Array<{ id: string; name: string }>)
		: []

	if (frames && pageFrames.length === 0) {
		console.warn('No frames found in the sketch, exporting entire page instead.')
	}

	if (frames && pageFrames.length > 0) {
		let isFrameNameCollision = false
		let framesToExport: Array<{ id: string; name: string }> = []
		if (typeof frames === 'boolean') {
			// Export all frames
			framesToExport = pageFrames
		} else if (Array.isArray(frames)) {
			// Export specific frames, match with frames found in the document and validate
			for (const requestedFrameName of frames) {
				// Match by name first, then id
				const matchingFrame =
					pageFrames.find(
						(f) => f.name === requestedFrameName || slugify(f.name) === requestedFrameName,
					) ??
					pageFrames.find(
						(f) =>
							f.id ===
							(requestedFrameName.startsWith('shape:')
								? requestedFrameName
								: `shape:${requestedFrameName}`),
					)

				if (!matchingFrame) {
					throw new Error(`No frame found matching: "${requestedFrameName}"`)
				}

				framesToExport.push(matchingFrame)
			}
		}

		// TODO never happens?
		if (framesToExport.length === 0) {
			throw new Error('No frames found matching the specified frames')
		}

		// Check for frame.name collisions, if we have any then include frame id in the filename
		const frameNames = framesToExport.map((frame) => slugify(frame.name))
		const frameNamesUnique = [...new Set(frameNames)]
		isFrameNameCollision = frameNames.length !== frameNamesUnique.length
		if (verbose && isFrameNameCollision) {
			console.warn(
				'Frame names are not unique, including frame IDs in the output filenames to avoid collisions',
			)
		}

		// Export all frames
		for (const frame of framesToExport) {
			if (verbose) console.log(`Downloading sketch frame: "${frame.name}"`)

			// Select the shape
			await page.evaluate('editor.selectNone()')
			await page.evaluate(`editor.select('${frame.id}')`)

			const frameSuffix =
				(isFrameNameCollision ? `-${frame.id.replace('shape:', '')}` : '') +
				`-${slugify(frame.name)}`

			const outputPath = await requestDownload(
				page,
				client,
				output,
				outputFilename + frameSuffix,
				format,
				stripStyle,
			)

			if (verbose) console.log(`Download complete, saved to: "${outputPath}"`)
			exportReport.push(outputPath)
		}
	} else {
		// Single file download
		if (verbose) console.log(`Downloading sketch`)
		exportReport = await requestDownload(page, client, output, outputFilename, format, stripStyle)
		if (verbose) console.log(`Download complete, saved to: "${exportReport}"`)
	}

	// Restore dark mode
	if (verbose) console.log(`Restoring dark mode: ${originalDarkMode}`)
	await setDarkMode(page, originalDarkMode)

	await browser.close()
	if (verbose) console.log('Stopped Puppeteer')

	if (isLocal && server) {
		server.close()
		if (verbose) console.log('Stopped tldraw server')
	}

	if (verbose) console.timeEnd('Export time')

	// Note string or array depending on --frames
	return exportReport
}

// Helpers

async function requestDownload(
	page: Page,
	client: CDPSession,
	output: string,
	filename: string,
	format: 'png' | 'svg',
	stripStyle: boolean,
): Promise<string> {
	// Brittle, TODO how to invoke this from the browser console?

	const completionPromise = waitForDownloadCompletion(client)

	await closeMenus(page)
	await clickMenuTestIds(page, [
		'main.menu',
		'menu-item.edit',
		'menu-item.export-as',
		`menu-item.export-as-${format}`,
	])

	const downloadGuid = await completionPromise

	// _really_ wait for download to complete, can get intermittent failures
	// without this
	await page.waitForNetworkIdle()

	// Move and rename the downloaded file from temp to output destination
	const downloadPath = path.join(os.tmpdir(), downloadGuid)
	const outputPath = path.resolve(untildify(path.join(output, `${filename}.${format}`)))
	await fs.rename(downloadPath, outputPath)

	if (stripStyle && format === 'svg') {
		// Strip style from the SVG
		const svg = await fs.readFile(outputPath, 'utf8')
		const strippedSvg = stripStyleElement(svg)
		await fs.writeFile(outputPath, strippedSvg)
	}

	return outputPath
}

function stripStyleElement(svg: string): string {
	const dom = cheerio.load(svg, { xmlMode: true })
	dom('style').remove()
	return dom.xml()
}

async function startServer(path: string): Promise<Server> {
	const app = express()
	const port = await getPort()
	app.use(express.static(path))

	return new Promise((resolve, reject) => {
		const server = app.listen(port, () => {
			resolve(server)
		})

		server.on('error', (error) => {
			reject(error)
		})
	})
}

async function waitForDownloadCompletion(client: CDPSession): Promise<string> {
	return new Promise((resolve, reject) => {
		client.on('Browser.downloadProgress', (event) => {
			if (event.state === 'completed') {
				resolve(event.guid)
			} else if (event.state === 'canceled') {
				reject(new Error('Download was canceled'))
			}
		})
	})
}

async function clickMenuTestIds(page: Page, testIds: string[]) {
	for (const testId of testIds) {
		await page.waitForSelector(`[data-testid="${testId}"]`)
		await page.click(`[data-testid="${testId}"]`)
	}
}

function stripUndefined(options: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined))
}

async function closeMenus(page: Page): Promise<void> {
	await page.evaluate(`app.clearOpenMenus()`)
}

// TODO possible performance gains by only setting transparency as needed?
// async function getTransparency(page: Page): Promise<boolean> {
// 	return !(await page.evaluate('editor.getInstanceState().exportBackground'))
// }

async function getDarkMode(page: Page): Promise<boolean> {
	return Boolean(await page.evaluate('editor.user.getUserPreferences().isDarkMode'))
}

async function setDarkMode(page: Page, darkMode: boolean): Promise<void> {
	await page.evaluate(`editor.user.updateUserPreferences({ isDarkMode: ${darkMode}})`)
}

// Ephemeral means we don't have to restore the user's value
async function setTransparency(page: Page, transparent: boolean): Promise<void> {
	await page.evaluate(
		`editor.updateInstanceState(
			{ exportBackground: ${!transparent} },
			{ ephemeral: true },
		 )`,
	)
}

function echoBrowserConsole(page: Page, verbose: boolean) {
	page.on('console', (message) => {
		const messageType = message.type()
		const messageText = message.text()

		if (messageType === 'error') {
			console.error(`[Browser] ${messageText}`)
		} else if (messageType === 'warning') {
			console.warn(`[Browser] ${messageText}`)
		} else if (verbose) {
			console.log(`[Browser] ${messageText}`)
		}
	})
}

function sanitizeName(name: string, format: 'png' | 'svg'): string {
	// Remove extension if it matches the expected output
	const extension = path.extname(name)
	if (extension === `.${format}`) {
		return path.basename(name, extension)
	}

	return path.basename(name)
}
