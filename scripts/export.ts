import express from 'express'
import path from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'
import type { CDPSession } from 'puppeteer'

console.log('Running tldraw...')

// Serve local tldraw
const app = express()
const port = 3000 // Or any port you prefer
app.use(express.static(path.join(dirname(fileURLToPath(import.meta.url)), '../dist')))

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
	// TODO os.tmpdir()
	downloadPath: '/Users/mika/Desktop',
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
await page.goto(`http://localhost:${port}`) // Adjust the URL to match your Vite configuration
const downloadGuid = await waitForDownloadCompletion(client)
console.log(downloadGuid)

// Stop the Express server
server.close()
console.log('stopped tldraw server')
