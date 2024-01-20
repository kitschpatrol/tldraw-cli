import LocalTldrawServer from './local-tldraw-server'
import { tldrawToImage } from './tldraw-to-image'
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

	// Open in default browser
	await open(tldrawServer.href)

	return tldrawServer.href
}
