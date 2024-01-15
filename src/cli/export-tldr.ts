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

export async function exportTldr(
	tldrPath: string,
	format: ExportFormat = 'svg',
	destination = './',
	verbose = false,
) {
	const scriptDirectory = dirname(fileURLToPath(import.meta.url))

	const resolvedTldrPath = path.resolve(untildify(tldrPath))
	if (verbose) console.log(`Loading tldr file "${resolvedTldrPath}"`)
	const tldrFile = await fs.readFile(resolvedTldrPath, 'utf8')

	if (verbose) console.log('Starting tldraw server...')
	// Serve local tldraw

	// Handle dev or prod relative paths, brittle
	const tldrawPath = path.join(
		scriptDirectory,
		scriptDirectory.endsWith('/src/cli') ? '../../dist' : '../dist',
	)

	const server = await startServer(tldrawPath)

	const { port } = server.address() as AddressInfo

	if (verbose) console.log(`tldraw hosted from "http://localhost:${port}"`)

	if (verbose) console.log('Starting Puppeteer...')
	// Launch Puppeteer and access the Vite-served website
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
			console.log(message.args())
			console.log(message.location())
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

	// Navigate to the URL served by Vite, download starts automatically
	await page.goto(`http://localhost:${port}`) // Adjust the URL to match your Vite configuration
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

	// TODO types from function
	const downloadGuid = await waitForDownloadCompletion(client)
	if (verbose) console.log('Download complete')

	await browser.close()
	if (verbose) console.log('Stopped Puppeteer')

	// Get the base filename without the extension
	const originalFilename = path.basename(tldrPath, path.extname(tldrPath))
	const downloadPath = path.join(os.tmpdir(), downloadGuid)
	const destinationPath = untildify(path.join(destination, `${originalFilename}.${format}`))
	await fs.rename(downloadPath, destinationPath)

	if (verbose) console.log(`Saved to "${destinationPath}"`)

	// Stop the Express server
	server.close()
	if (verbose) console.log('Stopped tldraw server')
}
