import express from 'express'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'
import type { CDPSession } from 'puppeteer'

type ExportFormats = 'jpeg' | 'json' | 'png' | 'svg' | 'webp'

async function exportTldr(tldrPath: string, destination: string, format: ExportFormats = 'svg') {
	const scriptDirectory = dirname(fileURLToPath(import.meta.url))

	const resolvedTldrPath = path.join(scriptDirectory, tldrPath)
	console.log(`Loading tldr file "${resolvedTldrPath}"`)
	const tldrFile = await fs.readFile(resolvedTldrPath, 'utf8')
	const tldrFileEncoded = encodeURIComponent(tldrFile)

	console.log('Running tldraw...')

	// Serve local tldraw
	const app = express()
	const port = 3000 // Or any port you prefer
	app.use(express.static(path.join(scriptDirectory, '../dist')))

	const server = app.listen(port, () => {
		console.log(`tldraw running at http://localhost:${port}`)
	})

	console.log('Running Puppeteer...')
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
					console.log('Closed Puppeteer')
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
	await page.goto(`http://localhost:${port}?data=${tldrFileEncoded}&format=${format}`) // Adjust the URL to match your Vite configuration
	// TODO types from function
	const downloadGuid = (await waitForDownloadCompletion(client)) as string
	console.log(downloadGuid)

	// Get the base filename without the extension
	// TODO handle file-like destination
	const originalFilename = path.basename(tldrPath, path.extname(tldrPath))
	const downloadPath = path.join(os.tmpdir(), downloadGuid)
	const destinationPath = path.join(destination, `${originalFilename}.${format}`)
	await fs.rename(downloadPath, destinationPath)

	console.log(`Saved to "${destinationPath}"`)

	// Stop the Express server
	server.close()
	console.log('stopped tldraw server')
}

await exportTldr('../box.tldr', '/Users/mika/Desktop', 'svg')
