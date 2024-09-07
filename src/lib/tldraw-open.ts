import { nanoid } from 'nanoid'
import { type ChildProcess } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import { URL } from 'node:url'
import open from 'open'
import LocalTldrawServer from './local-tldraw-server'
import { tldrawToImage } from './tldraw-to-image'
import { tldrawToShareUrl } from './tldraw-to-share-url'
import log from './utilities/log'
import { validatePathOrUrl } from './validation'

const tldrawOpenDefaultOptions = {
	location: 'remote',
}

export type TldrawOpenOptions = {
	location: 'local' | 'remote'
}

export type TldrawOpenResult = {
	browserExitPromise: Promise<ChildProcess>
	openedSketchUrl: string
}

export async function tldrawOpen(
	tldrPathOrUrl?: string,
	options?: Partial<TldrawOpenOptions>,
): Promise<TldrawOpenResult> {
	const tldrawRemoteUrl = 'https://www.tldraw.com'
	const { location } = { ...tldrawOpenDefaultOptions, ...options }

	// Set below depending on the combination of options
	let urlToOpen: string | undefined

	const validatedPathOrUrl =
		tldrPathOrUrl === undefined
			? undefined
			: validatePathOrUrl(tldrPathOrUrl, {
					requireFileExistence: true,
					validFileExtensions: ['.tldr'],
					validHostnames: ['www.tldraw.com'],
				})

	// Open empty file locally
	if (location === 'local' && validatedPathOrUrl === undefined) {
		const tldrawServer = new LocalTldrawServer()
		await tldrawServer.start()
		urlToOpen = tldrawServer.href
		log.info(`Opened blank tldraw sketch locally at "${urlToOpen}"`)
	}
	// Open local file locally
	else if (location === 'local' && typeof validatedPathOrUrl === 'string') {
		const tldrData = await fs.readFile(validatedPathOrUrl, 'utf8')
		const tldrawServer = new LocalTldrawServer(tldrData)
		await tldrawServer.start()
		urlToOpen = tldrawServer.href
		log.info(`Opened copy of tldraw sketch "${validatedPathOrUrl}" locally at "${urlToOpen}"`)
	}
	// Open remote file locally
	else if (location === 'local' && validatedPathOrUrl instanceof URL) {
		const [savedFile] = await tldrawToImage(validatedPathOrUrl.href, {
			format: 'tldr',
			name: nanoid(),
			output: os.tmpdir(),
		})
		const tldrData = await fs.readFile(savedFile, 'utf8')
		await fs.rm(savedFile, { force: true })
		const tldrawServer = new LocalTldrawServer(tldrData)
		await tldrawServer.start()
		urlToOpen = tldrawServer.href
		log.info(
			`Opened a local copy of tldraw sketch url "${validatedPathOrUrl.href}" locally at ${urlToOpen}`,
		)
	}
	// Open empty file remotely, actually just opens tldraw.com
	else if (location === 'remote' && validatedPathOrUrl === undefined) {
		urlToOpen = tldrawRemoteUrl
		log.info(`Opened tldraw.com`)
	}
	// Open local file remotely
	else if (location === 'remote' && typeof validatedPathOrUrl === 'string') {
		urlToOpen = await tldrawToShareUrl(validatedPathOrUrl)
		log.info(
			`Opened copy of local tldraw sketch "${validatedPathOrUrl}" remotely at "${urlToOpen}"`,
		)
	}
	// Open remote url remotely
	else if (location === 'remote' && validatedPathOrUrl instanceof URL) {
		urlToOpen = validatedPathOrUrl.href
		log.info(`Opened tldraw sketch url at ${urlToOpen}`)
	} else {
		// Should be unreachable
		throw new Error('Invalid tldrawOpen options')
	}

	const exitPromise = open(urlToOpen, {
		wait: true,
	})

	return {
		browserExitPromise: exitPromise,
		openedSketchUrl: urlToOpen,
	}
}
