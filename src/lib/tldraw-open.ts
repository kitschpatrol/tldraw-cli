import LocalTldrawServer from './local-tldraw-server'
import { tldrawToImage } from './tldraw-to-image'
import log from './utilities/log'
import { validatePathOrUrl } from './validation'
import { nanoid } from 'nanoid'
import fs from 'node:fs/promises'
import os from 'node:os'
import open from 'open'

export async function tldrawOpen(tldrPathOrUrl?: string): Promise<string> {
	let tldrData: string | undefined

	if (tldrPathOrUrl !== undefined) {
		const validatedPathOrUrl = validatePathOrUrl(tldrPathOrUrl, {
			requireFileExistence: true,
			validFileExtensions: ['.tldr'],
			validHostnames: ['www.tldraw.com'],
		})

		// Download remote urls
		if (typeof validatedPathOrUrl !== 'string') {
			// Download to temp
			const [savedFile] = await tldrawToImage(validatedPathOrUrl.href, {
				format: 'tldr',
				name: nanoid(),
				output: os.tmpdir(),
			})
			const href = await tldrawOpen(savedFile)
			// Clean up the local file
			await fs.rm(savedFile, { force: true })
			return href
		}

		// Read file into base64 string

		// Start the server
		tldrData = await fs.readFile(validatedPathOrUrl, 'utf8')
	}

	const tldrawServer = new LocalTldrawServer(tldrData)
	await tldrawServer.start()

	// If running form the cli, we have to return the href before opening the
	// browser since it's long-running
	if (tldrPathOrUrl === undefined) {
		log.info(`Opened empty tldraw sketch at ${tldrawServer.href}`)
	} else {
		log.info(`Opened tldraw sketch "${tldrPathOrUrl}" at ${tldrawServer.href}`)
	}

	process.stdout.write(`${tldrawServer.href}\n`)

	// Open in default browser
	// Some tldraw functions require continued access to the server,
	// so it keeps running until all browsers are closed
	await open(tldrawServer.href, { wait: true })

	return tldrawServer.href
}
