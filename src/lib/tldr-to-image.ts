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
import type { CDPSession } from 'puppeteer'
import untildify from 'untildify'

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

export async function tldrToImage(
	tldrPath: string,
	format: ExportFormat = 'svg',
	destination = './',
	verbose = false,
): Promise<string> {
	const scriptDirectory = dirname(fileURLToPath(import.meta.url))
	const resolvedTldrPath = path.resolve(untildify(tldrPath))
	if (verbose) console.log(`Loading tldr file "${resolvedTldrPath}"`)
	const tldrFile = await fs.readFile(resolvedTldrPath, 'utf8')

	// Serve local tldraw
	if (verbose) console.log('Starting tldraw server...')

	// Handle dev or prod relative paths, brittle
	console.log(`scriptDirectory: ${scriptDirectory}`)
	const tldrawPath = path.join(
		scriptDirectory,
		scriptDirectory.endsWith('/src/lib')
			? '../../dist/tldraw'
			: scriptDirectory.endsWith('/dist/lib')
				? '../tldraw'
				: '../dist/tldraw',
	)

	if (verbose) console.log(`tldraw served from "${tldrawPath}"`)

	const server = await startServer(tldrawPath)
	const { port } = server.address() as AddressInfo

	if (verbose) console.log(`tldraw hosted at "http://localhost:${port}"`)

	// Launch Puppeteer and access the Vite-served website
	if (verbose) console.log('Starting Puppeteer...')
	const browser = await puppeteer.launch({ headless: 'new' })
	const page = await browser.newPage()

	// Hush the favicon kvetch
	await page.setRequestInterception(true)
	page.on('request', (request) => {
		if (request.url().endsWith('favicon.ico')) {
			void request.respond({ status: 200 })
		} else {
			void request.continue()
		}
	})

	// Forward messages from the browser console
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

	const client = await page.target().createCDPSession()
	await client.send('Browser.setDownloadBehavior', {
		behavior: 'allowAndName',
		downloadPath: os.tmpdir(),
		eventsEnabled: true,
	})

	await page.goto(`http://localhost:${port}`)
	await page.waitForFunction(() => window.tldrawExportFile !== undefined)

	// Send the tldr file to the page
	if (verbose) console.log('Requesting download')
	await page.evaluate(
		(tldrFile, format) => {
			window.tldrawExportFile(tldrFile, format)
		},
		tldrFile,
		format,
	)

	const downloadGuid = await waitForDownloadCompletion(client)
	if (verbose) console.log('Download complete')

	await browser.close()
	if (verbose) console.log('Stopped Puppeteer')

	// Move and rename the downloaded file from temp to output destination
	const originalFilename = path.basename(tldrPath, path.extname(tldrPath))
	const downloadPath = path.join(os.tmpdir(), downloadGuid)
	const destinationPath = untildify(path.join(destination, `${originalFilename}.${format}`))
	await fs.rename(downloadPath, destinationPath)

	if (verbose) console.log(`Saved to "${destinationPath}"`)

	server.close()
	if (verbose) console.log('Stopped tldraw server')

	return path.resolve(destinationPath)
}
