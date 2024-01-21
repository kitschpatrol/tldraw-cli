import LocalTldrawServer from './local-tldraw-server'
import TldrawController from './tldraw-controller'
import log from './utilities/log'
import { validatePathOrUrl } from './validation'
import fs from 'node:fs/promises'
import path from 'node:path'
import prettyMilliseconds from 'pretty-ms'

export type TldrawFormat = 'json' | 'png' | 'svg' | 'tldr'

export type TldrawToImageOptions = {
	darkMode?: boolean
	format?: TldrawFormat
	frames?: boolean | string[]
	name?: string
	output?: string
	print?: boolean
	stripStyle?: boolean
	transparent?: boolean
}

// Name should default to undefined

type TldrawToImageOptionsRequired = Required<Omit<TldrawToImageOptions, 'name'>> &
	Pick<TldrawToImageOptions, 'name'>

const defaultOptions: TldrawToImageOptionsRequired = {
	darkMode: false,
	format: 'svg',
	frames: false,
	name: undefined,
	output: './',
	print: false,
	stripStyle: false,
	transparent: false,
}

export async function tldrawToImage(
	tldrPathOrUrl: string,
	options?: TldrawToImageOptions,
): Promise<string[]> {
	const resolvedOptions: TldrawToImageOptionsRequired = {
		...defaultOptions,
		...stripUndefined(options ?? {}),
	}
	const { darkMode, format, frames, name, output, print, stripStyle, transparent } = resolvedOptions

	if (options?.print && options.output !== undefined) {
		throw new Error('Cannot use --output with --print')
	}

	if (options?.print && options.name !== undefined) {
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
	const outputFilename =
		name === undefined
			? isLocal
				? path.basename(validatedPathOrUrl, path.extname(validatedPathOrUrl))
				: validatedPathOrUrl.pathname.split('/').pop() ?? validatedPathOrUrl.pathname
			: sanitizeName(name, format)

	// Start up local server if appropriate

	if (isLocal) log.info(`Loading tldr data "${validatedPathOrUrl}"`)
	const tldrData = isLocal ? await fs.readFile(validatedPathOrUrl, 'utf8') : undefined
	const tldrawServer = new LocalTldrawServer(tldrData)
	if (isLocal) await tldrawServer.start()

	// Start puppeteer controller
	const tldrawUrl = isLocal ? tldrawServer.href : validatedPathOrUrl.href
	const tldrawController = new TldrawController(tldrawUrl)
	await tldrawController.start()

	// Set transparency
	await tldrawController.setTransparency(transparent)

	// Set dark mode
	await tldrawController.setDarkMode(darkMode)

	// Run the download
	let exportReport: string[]

	if (typeof frames === 'boolean' && frames) {
		exportReport = await tldrawController.downloadAllFrames(
			output,
			outputFilename,
			format,
			stripStyle,
			print,
		)
	} else if (Array.isArray(frames) && frames.length > 0) {
		exportReport = await tldrawController.downloadFrames(
			output,
			outputFilename,
			format,
			stripStyle,
			frames,
			print,
		)
	} else {
		exportReport = await tldrawController.download(
			output,
			outputFilename,
			format,
			stripStyle,
			print,
		)
	}

	// Clean up
	await tldrawController.close()
	if (isLocal) tldrawServer.close()

	log.info(`Export time: ${prettyMilliseconds(performance.now() - startTime)}`)

	return exportReport
}

// Helpers
function stripUndefined(options: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined))
}

function sanitizeName(name: string, format: TldrawFormat): string {
	// Remove extension if it matches the expected output
	const extension = path.extname(name)
	if (extension === `.${format}`) {
		return path.basename(name, extension)
	}

	return path.basename(name)
}
