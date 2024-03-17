import LocalTldrawServer from './local-tldraw-server'
import TldrawController from './tldraw-controller'
import log from './utilities/log'
import { validatePathOrUrl } from './validation'
import fs from 'node:fs/promises'
import path from 'node:path'
import prettyMilliseconds from 'pretty-ms'

// Essentially TLExportType + 'tldr'

// Basically TLExportType + 'tldr'
// 'jpeg' | 'webp' formats should be supported but result in "Not a PNG" errors
export type TldrawFormat = 'json' | 'png' | 'svg' | 'tldr'

// Basically TLSvgOptions, with some extra options
// TODO what about preserveAspectRatio?
export type TldrawToImageOptions = {
	dark?: boolean
	format: TldrawFormat
	frames?: boolean | string[]
	name?: string
	output?: string
	padding?: number
	print?: boolean
	scale?: number
	stripStyle?: boolean
	transparent?: boolean
}

export async function tldrawToImage(
	tldrPathOrUrl: string,
	options?: TldrawToImageOptions,
): Promise<string[]> {
	const resolvedOptions: TldrawToImageOptions = {
		format: options?.format ?? 'svg',
		...options,
	}

	if (resolvedOptions.print && resolvedOptions.output !== undefined) {
		throw new Error('Cannot use --output with --print')
	}

	if (resolvedOptions.print && resolvedOptions.name !== undefined) {
		log.warn('Ignoring --name when using --print')
	}

	const startTime = performance.now()

	const validatedPathOrUrl = validatePathOrUrl(tldrPathOrUrl, {
		requireFileExistence: true,
		validFileExtensions: ['.tldr'],
		validHostnames: ['www.tldraw.com'],
	})

	// Identify URL vs. file path
	const isLocal = typeof validatedPathOrUrl === 'string'
	log.info(isLocal ? 'Local file detected' : 'tldraw URL detected')

	// Use name flag if available then source filename if available, otherwise the ID from the URL
	// May be suffixed if --frames is set
	// TODO consider 'editor.getDocumentSettings().name', but always appears empty?
	resolvedOptions.name =
		resolvedOptions.name === undefined
			? isLocal
				? path.basename(validatedPathOrUrl, path.extname(validatedPathOrUrl))
				: validatedPathOrUrl.pathname.split('/').pop() ?? validatedPathOrUrl.pathname
			: sanitizeName(resolvedOptions.name, resolvedOptions.format)

	// Start up local server if appropriate
	if (isLocal) log.info(`Loading tldr data "${validatedPathOrUrl}"`)
	const tldrData = isLocal ? await fs.readFile(validatedPathOrUrl, 'utf8') : undefined
	const tldrawServer = new LocalTldrawServer(tldrData)
	if (isLocal) await tldrawServer.start()

	// Start puppeteer controller
	const tldrawUrl = isLocal ? tldrawServer.href : validatedPathOrUrl.href
	const tldrawController = new TldrawController(tldrawUrl)
	await tldrawController.start()

	// Run the download
	let exportReport: string[]

	if (resolvedOptions.frames && typeof resolvedOptions.frames === 'boolean') {
		exportReport = await tldrawController.downloadAllFrames(resolvedOptions)
	} else if (Array.isArray(resolvedOptions.frames) && resolvedOptions.frames.length > 0) {
		exportReport = await tldrawController.downloadFrames(resolvedOptions.frames, resolvedOptions)
	} else {
		exportReport = await tldrawController.download(resolvedOptions)
	}

	// Clean up
	await tldrawController.close()
	if (isLocal) tldrawServer.close()

	log.info(`Export time: ${prettyMilliseconds(performance.now() - startTime)}`)

	return exportReport
}

function sanitizeName(name: string, format: TldrawFormat): string {
	// Remove extension if it matches the expected output
	const extension = path.extname(name)
	if (extension === `.${format}`) {
		return path.basename(name, extension)
	}

	return path.basename(name)
}
