/* eslint-disable complexity */

import type { ExportFormat } from '../types'
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

export type TldrawImageOptions = {
	darkMode?: boolean
	format?: ExportFormat
	output?: string
	transparent?: boolean
	verbose?: boolean
}

const defaultOptions: Required<TldrawImageOptions> = {
	darkMode: false,
	format: 'svg',
	output: './',
	transparent: false,
	verbose: true,
}

export async function tldrawToImage(
	tldrPathOrUrl: string,
	options: TldrawImageOptions = {},
): Promise<string> {
	const resolvedOptions = { ...defaultOptions, ...stripUndefined(options) }
	const { darkMode, format, output, transparent, verbose } = resolvedOptions

	// Identify URL vs. file path
	const isLocal = !tldrPathOrUrl.startsWith('https://www.tldraw.com/')
	if (verbose) console.log(isLocal ? 'Local file detected' : 'tldraw URL detected')

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
		const resolvedTldrPath = path.resolve(untildify(tldrPathOrUrl))
		if (verbose) console.log(`Loading tldr file "${resolvedTldrPath}"`)
		const tldrFile = await fs.readFile(resolvedTldrPath, 'utf8')

		await page.evaluateOnNewDocument((data) => {
			localStorage.clear()
			localStorage.setItem('tldrData', data)
		}, tldrFile)
	}

	// Navigate to tldraw
	const tldrawUrl = isLocal ? `http://localhost:${port}` : tldrPathOrUrl
	if (verbose) console.log(`Navigating to: ${tldrawUrl}`)
	await page.goto(tldrawUrl, { waitUntil: 'networkidle0' })

	// Set transparency
	if (verbose) console.log(`Setting background transparency: ${transparent}`)
	await setTransparency(page, transparent)

	// Set dark mode
	if (verbose) console.log(`Setting dark mode: ${darkMode}`)
	const originalDarkMode = await getDarkMode(page)
	await setDarkMode(page, darkMode)

	// Download
	// Brittle, TODO how to invoke this from the browser console?
	if (verbose) console.log('Requesting download')
	await closeMenus(page)
	await clickMenuTestIds(page, [
		'main.menu',
		'menu-item.edit',
		'menu-item.export-as',
		`menu-item.export-as-${format}`,
	])

	const downloadGuid = await waitForDownloadCompletion(client)
	if (verbose) console.log('Download complete')

	// Restore dark mode
	if (verbose) console.log(`Restoring dark mode: ${originalDarkMode}`)
	await setDarkMode(page, originalDarkMode)

	await browser.close()
	if (verbose) console.log('Stopped Puppeteer')

	if (isLocal && server) {
		server.close()
		if (verbose) console.log('Stopped tldraw server')
	}

	// TODO better naming strategy for URLs...
	// Move and rename the downloaded file from temp to output destination
	const outputFilename = isLocal
		? path.basename(tldrPathOrUrl, path.extname(tldrPathOrUrl))
		: downloadGuid
	const downloadPath = path.join(os.tmpdir(), downloadGuid)
	const outputPath = untildify(path.join(output, `${outputFilename}.${format}`))
	await fs.rename(downloadPath, outputPath)

	if (verbose) console.log(`Saved to "${outputPath}"`)
	return path.resolve(outputPath)
}

// Helpers

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
