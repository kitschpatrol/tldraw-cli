import LocalTldrawServer from './local-tldraw-server'
import { tldrawToImage } from './tldraw-to-image'
import { tldrawToShareUrl } from './tldraw-to-share-url'
import log from './utilities/log'
import { validatePathOrUrl } from './validation'
import { nanoid } from 'nanoid'
import fs from 'node:fs/promises'
import os from 'node:os'
import open from 'open'

export async function tldrawOpen(tldrPathOrUrl?: string, local = false): Promise<string> {
	const tldrawRemoteUrl = 'https://www.tldraw.com'

	// Open a blank sketch locally
	if (tldrPathOrUrl === undefined && local) {
		const tldrawServer = new LocalTldrawServer()
		await tldrawServer.start()

		// If running form the cli, we have to return the href before opening the
		// browser since it's long-running
		log.info(`Opened tldraw.com sketch locally at ${tldrawServer.href}`)
		process.stdout.write(`${tldrawServer.href}\n`)

		// Open in default browser
		// Some tldraw functions require continued access to the server,
		// so it keeps running until all browsers are closed
		await open(tldrawServer.href, { wait: true })

		return tldrawServer.href
	}

	// Open a blank sketch remotely
	if (tldrPathOrUrl === undefined && !local) {
		await open(tldrawRemoteUrl)
		log.info(`Opened tldraw.com`)
		process.stdout.write(`${tldrawRemoteUrl}\n`)
		return tldrawRemoteUrl
	}

	// Open an existing tldraw sketch
	if (tldrPathOrUrl !== undefined) {
		const validatedPathOrUrl = validatePathOrUrl(tldrPathOrUrl, {
			requireFileExistence: true,
			validFileExtensions: ['.tldr'],
			validHostnames: ['www.tldraw.com'],
		})

		// Open local file locally
		if (typeof validatedPathOrUrl === 'string' && local) {
			const tldrData = await fs.readFile(validatedPathOrUrl, 'utf8')
			const tldrawServer = new LocalTldrawServer(tldrData)
			await tldrawServer.start()
			log.info(
				`Opened copy of tldraw sketch "${validatedPathOrUrl}" locally at "${tldrawServer.href}"`,
			)
			process.stdout.write(`${tldrawServer.href}\n`)
			// Long running
			await open(tldrawServer.href, { wait: true })
			return tldrawServer.href
		}

		// Open local file remotely
		if (typeof validatedPathOrUrl === 'string' && !local) {
			const remoteUrl = await tldrawToShareUrl(validatedPathOrUrl)
			log.info(
				`Opened copy of local tldraw sketch "${validatedPathOrUrl}" remotely at "${remoteUrl}"`,
			)
			await open(remoteUrl)
			process.stdout.write(`${remoteUrl}\n`)
			return remoteUrl
		}

		// Open remote tldraw.com URL locally
		if (typeof validatedPathOrUrl !== 'string' && local) {
			// Download to temp
			const [savedFile] = await tldrawToImage(validatedPathOrUrl.href, {
				format: 'tldr',
				name: nanoid(),
				output: os.tmpdir(),
			})

			const tldrData = await fs.readFile(savedFile, 'utf8')
			await fs.rm(savedFile, { force: true })
			const tldrawServer = new LocalTldrawServer(tldrData)
			await tldrawServer.start()
			log.info(
				`Opened a local copy of tldraw sketch url "${validatedPathOrUrl.href}" locally at ${tldrawServer.href}`,
			)
			process.stdout.write(`${tldrawServer.href}\n`)
			// Long running
			await open(tldrawServer.href, { wait: true })
			return tldrawServer.href
		}

		// Open remote tldraw.com URL remotely
		if (typeof validatedPathOrUrl !== 'string' && !local) {
			await open(validatedPathOrUrl.href)
			log.info(`Opened tldraw sketch url at ${validatedPathOrUrl.href}`)
			process.stdout.write(`${validatedPathOrUrl.href}\n`)
			return validatedPathOrUrl.href
		}
	}

	// Should be unreachable
	throw new Error('No file or URL provided')
}
