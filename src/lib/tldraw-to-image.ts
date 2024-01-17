/* eslint-disable complexity */

import { validatePathOrUrl } from './validation'
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
import { slugify } from 'voca'

export type TldrawImageOptions = {
	darkMode?: boolean
	format?: 'png' | 'svg'
	frames?: boolean | string[]
	output?: string
	transparent?: boolean
	verbose?: boolean
}

const defaultOptions: Required<TldrawImageOptions> = {
	darkMode: false,
	format: 'svg',
	frames: false,
	output: './',
	transparent: false,
	verbose: false,
}

export async function tldrawToImage(
	tldrPathOrUrl: string,
	options: TldrawImageOptions = {},
): Promise<string | string[]> {
	const resolvedOptions = { ...defaultOptions, ...stripUndefined(options) }
	const { darkMode, format, frames, output, transparent, verbose } = resolvedOptions

	if (verbose) console.time('Export time')

	const validatedPathOrUrl = validatePathOrUrl(tldrPathOrUrl, {
		requireFileExistence: true,
		validFileExtensions: ['.tldr'],
		validHostnames: ['www.tldraw.com'],
	})

	// Identify URL vs. file path
	const isLocal = typeof validatedPathOrUrl === 'string'
	if (verbose) console.log(isLocal ? 'Local file detected' : 'tldraw URL detected')

	// Use source filename if available, otherwise the ID from the URL
	// May be suffixed if --frames is set
	// TODO consider 'editor.getDocumentSettings().name', but always appears empty?
	const outputFilename = isLocal
		? path.basename(validatedPathOrUrl, path.extname(validatedPathOrUrl))
		: validatedPathOrUrl.pathname.split('/').pop() ?? validatedPathOrUrl.pathname

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
		// Console.log(`pageFrames: ${JSON.stringify(pageFrames, undefined, 2)}`)

		if (typeof frames === 'boolean') {
			// Check for frame.name collisions, if we have any then include frame id in the filename
			const frameNames = pageFrames.map((frame) => slugify(frame.name))
			const frameNamesUnique = [...new Set(frameNames)]
			const isFrameNameCollision = frameNames.length !== frameNamesUnique.length
			if (verbose && isFrameNameCollision) {
				console.warn(
					'Frame names are not unique, including frame IDs in the output filenames to avoid collisions',
				)
			}

			// Export all frames
			for (const frame of pageFrames) {
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
				)

				if (verbose) console.log(`Download complete, saved to: "${outputPath}"`)
				exportReport.push(outputPath)
			}
		} else if (Array.isArray(frames)) {
			// Export specific frames
			// TODO validate frame names and IDs
		}
	} else {
		// Single file download
		if (verbose) console.log(`Downloading sketch`)
		exportReport = await requestDownload(page, client, output, outputFilename, format)
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
): Promise<string> {
	// Brittle, TODO how to invoke this from the browser console?
	await closeMenus(page)
	await clickMenuTestIds(page, [
		'main.menu',
		'menu-item.edit',
		'menu-item.export-as',
		`menu-item.export-as-${format}`,
	])

	const downloadGuid = await waitForDownloadCompletion(client)

	// Move and rename the downloaded file from temp to output destination
	const downloadPath = path.join(os.tmpdir(), downloadGuid)
	const outputPath = path.resolve(untildify(path.join(output, `${filename}.${format}`)))
	await fs.rename(downloadPath, outputPath)
	return outputPath
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
