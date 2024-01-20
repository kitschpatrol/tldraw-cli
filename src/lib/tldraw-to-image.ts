import LocalTldrawServer from './local-tldraw-server'
import TldrawController from './tldraw-controller'
import { validatePathOrUrl } from './validation'
import fs from 'node:fs/promises'
import path from 'node:path'

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
	verbose?: boolean
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
	verbose: false,
}

export function openTldraw(tldrPathOrUrl?: string) {
	// Start the server
	console.log(`tldrPathOrUrl: ${tldrPathOrUrl}`)

	// Load the file

	// open in browser
}

export async function tldrawToImage(
	tldrPathOrUrl: string,
	options?: TldrawToImageOptions,
): Promise<string[]> {
	const resolvedOptions: TldrawToImageOptionsRequired = {
		...defaultOptions,
		...stripUndefined(options ?? {}),
	}
	const { darkMode, format, frames, name, output, stripStyle, transparent, verbose } =
		resolvedOptions

	if (verbose) console.time('Export time')

	const validatedPathOrUrl = validatePathOrUrl(tldrPathOrUrl, {
		requireFileExistence: true,
		validFileExtensions: ['.tldr'],
		validHostnames: ['www.tldraw.com'],
	})

	// Identify URL vs. file path
	const isLocal = typeof validatedPathOrUrl === 'string'
	if (verbose) console.log(isLocal ? 'Local file detected' : 'tldraw URL detected')

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
	const tldrawServer = new LocalTldrawServer(verbose)
	let tldrData: string | undefined
	if (isLocal) {
		await tldrawServer.start()
		if (verbose) console.log(`Loading tldr data "${validatedPathOrUrl}"`)
		tldrData = await fs.readFile(validatedPathOrUrl, 'utf8')
	}

	// Start puppeteer controller
	const tldrawUrl = isLocal ? tldrawServer.href : validatedPathOrUrl.href
	const tldrawController = new TldrawController(tldrawUrl, tldrData, verbose)
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
		)
	} else if (Array.isArray(frames) && frames.length > 0) {
		exportReport = await tldrawController.downloadFrames(
			output,
			outputFilename,
			format,
			stripStyle,
			frames,
		)
	} else {
		exportReport = await tldrawController.download(output, outputFilename, format, stripStyle)
	}

	// Clean up
	await tldrawController.close()
	if (isLocal) tldrawServer.close()
	if (verbose) console.timeEnd('Export time')

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
