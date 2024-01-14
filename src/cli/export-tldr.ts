import type { ExportFormat } from '../types'
import express from 'express'
import getPort from 'get-port'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'
import type { CDPSession } from 'puppeteer'
import untildify from 'untildify'

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
	const app = express()
	const port = await getPort()

	// Handle dev or prod relative paths, brittle
	const tldrawPath = path.join(
		scriptDirectory,
		scriptDirectory.endsWith('/src/cli') ? '../../dist' : '../dist',
	)

	if (verbose) console.log(`tldraw hosted from "${tldrawPath}"`)

	app.use(express.static(tldrawPath))

	const server = app.listen(port, () => {
		if (verbose) console.log(`tldraw running at http://localhost:${port}`)
	})

	if (verbose) console.log('Running Puppeteer...')
	// Launch Puppeteer and access the Vite-served website
	const browser = await puppeteer.launch({ headless: 'new' })
	const page = await browser.newPage()

	const client = await page.target().createCDPSession()
	await client.send('Browser.setDownloadBehavior', {
		behavior: 'allowAndName',
		downloadPath: os.tmpdir(),
		eventsEnabled: true,
	})

	async function waitForDownloadCompletion(client: CDPSession) {
		return new Promise((resolve, reject) => {
			client.on('Browser.downloadProgress', async (event) => {
				if (event.state === 'completed') {
					await browser.close()
					if (verbose) console.log('Closed Puppeteer')
					resolve(event.guid)
				} else if (event.state === 'canceled') {
					console.error('Export download canceled')
					await browser.close()
					reject(new Error('Download was canceled'))
				}
			})
		})
	}

	// Navigate to the URL served by Vite, download starts automatically
	await page.goto(`http://localhost:${port}`) // Adjust the URL to match your Vite configuration
	await page.waitForFunction(() => window.tldrawExportFile !== undefined)

	// Send the tldr file to the page
	await page.evaluate(
		(tldrFile, format) => {
			window.tldrawExportFile(tldrFile, format)
		},
		tldrFile,
		format,
	)

	// TODO types from function
	const downloadGuid = (await waitForDownloadCompletion(client)) as string

	// Get the base filename without the extension
	// TODO handle file-like destination
	const originalFilename = path.basename(tldrPath, path.extname(tldrPath))
	const downloadPath = path.join(os.tmpdir(), downloadGuid)
	const destinationPath = untildify(path.join(destination, `${originalFilename}.${format}`))
	await fs.rename(downloadPath, destinationPath)

	if (verbose) console.log(`Saved to "${destinationPath}"`)

	// Stop the Express server
	server.close()
	if (verbose) console.log('Stopped tldraw server')
}
