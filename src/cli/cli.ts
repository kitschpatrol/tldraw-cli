#!/usr/bin/env node

import pc from 'picocolors'
import plur from 'plur'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import type { TldrawOpenOptions, TldrawOpenResult } from '../lib/tldraw-open'
import type { TldrawFormat } from '../lib/tldraw-to-image'
import { version } from '../../package.json'
import { tldrawOpen } from '../lib/tldraw-open'
import { tldrawToImage } from '../lib/tldraw-to-image'
import log from '../lib/utilities/log'

const yargsInstance = yargs(hideBin(process.argv))

await yargsInstance
	.scriptName('tldraw')
	.command('$0 <command>', 'CLI tools for tldraw.')
	.command(
		'export <files-or-urls..>',
		'Export a local tldraw ".tldr" file or a tldraw.com URL to an svg, png, or tldr file. Prints the absolute path(s) to the exported image(s) to stdout.',
		(yargs) =>
			yargs
				.positional('files-or-urls', {
					array: true,
					default: undefined,
					demandOption: true,
					describe:
						'The tldraw sketch to export. May be one or more paths to local `.tldr` files, or tldraw.com sketch URLs. Accepts a mix of both file paths and URLs, and supports glob matching via your shell. Prints the absolute path(s) to the exported image(s) to `stdout`.',
					type: 'string',
				})
				.option('format', {
					alias: 'f',
					choices: ['png', 'svg', 'tldr'] as const,
					default: 'svg',
					describe: 'Output image format.',
					type: 'string',
				})
				.option('output', {
					alias: 'o',
					default: undefined,
					defaultDescription: '"./"',
					describe: 'Output image directory.',
					type: 'string',
				})
				.option('name', {
					alias: 'n',
					defaultDescription: 'The original file name or URL id is used.',
					describe: 'Output image name (without extension).',
					type: 'string',
				})
				.option('frames', {
					coerce(args: string[]) {
						// If --frames is not passed, missing from argv, and therefore it's automatically undefined
						// If --frames is passed without arguments, it's an empty array, which we treat as true

						// Could also handle --frames true and --frames false, but this
						// creates a minor edge case of not being able to pass "true" or
						// "false" as a frame name if we do this... so we don't
						// if (args.length === 1 && (args[0] === 'true')) return true
						// if (args.length === 1 && (args[0] === 'false')) return false

						return args.length === 0 ? true : args
					},
					// Do not set a default value, so we can coerce --frames without a
					// value to true, and still be able to extract meaning from the
					// absence of the option
					defaultDescription: 'false',
					describe:
						'Export each sketch "frame" as a separate image. Pass one or more frame names or IDs to export specific frames, or pass the flag without the arguments to export all frames. By default, the entire first page is exported with all frames.',
					type: 'array',
				})
				.option('pages', {
					coerce(args: string[]) {
						// If --pages is not passed, missing from argv, and therefore it's automatically undefined
						// If --pages is passed without arguments, it's an empty array, which we treat as true

						// Could also handle --pages true and --pages false, but this
						// creates a minor edge case of not being able to pass "true" or
						// "false" as a frame name if we do this... so we don't
						// if (args.length === 1 && (args[0] === 'true')) return true
						// if (args.length === 1 && (args[0] === 'false')) return false

						return args.length === 0 ? true : args
					},
					// Do not set a default value, so we can coerce --pages without a
					// value to true, and still be able to extract meaning from the
					// absence of the option
					defaultDescription: 'false',
					describe:
						'Export each sketch "page" as a separate image. Pass one or more page names or IDs to export specific page, or pass one or more page index numbers (from 0), or pass the flag without the arguments to export all pages. By default, only the first page is exported.',
					type: 'array',
				})
				.option('transparent', {
					alias: 't',
					default: false,
					describe: 'Export an image with a transparent background.',
					type: 'boolean',
				})
				.option('dark', {
					alias: 'd',
					default: false,
					describe: 'Export a dark theme version of the image.',
					type: 'boolean',
				})
				.option('padding', {
					default: undefined,
					defaultDescription: '32',
					describe: 'Set a specific padding amount around the exported image.',
					type: 'number',
				})
				.option('scale', {
					default: undefined,
					defaultDescription: '1',
					describe: 'Set a sampling factor for raster image exports.',
					type: 'number',
				})
				.option('strip-style', {
					default: false,
					describe:
						'Remove `<style>` elements from SVG output, useful to lighten the load of embedded fonts if you intend to provide your own stylesheets. Applies to SVG output only.',
					type: 'boolean',
				})
				.option('print', {
					alias: 'p',
					default: false,
					describe:
						'Print the exported image(s) to stdout instead of saving to a file. Incompatible with `--output`, and disregards `--name`. PNGs are printed as base64-encoded strings.',
					type: 'boolean',
				})
				// Too aggro, just warn instead...
				// .check((argv) => {
				// 	if (argv.format === 'png') {
				// 		throw new Error('--strip-style may only be applied when --format is "svg"')
				// 	}
				// })
				.option('verbose', {
					default: false,
					describe:
						'Enable verbose logging. All verbose logs and prefixed with their log level and are printed to `stderr` for ease of redirection.',
					type: 'boolean',
				})
				.check((argv) => {
					if (argv.print && argv.output !== undefined) {
						throw new Error('Cannot use --output with --print')
					}

					return true
				}),
		async ({
			dark,
			filesOrUrls,
			format,
			frames,
			name,
			output,
			padding,
			pages,
			print,
			scale,
			stripStyle,
			transparent,
			verbose,
		}) => {
			// Undefined values sneaking through?
			const cleanFilesOrUrls = (filesOrUrls as Array<string | undefined>).filter(
				(fileOrUrl) => fileOrUrl !== undefined,
			)

			log.verbose = verbose

			log.info(`Exporting ${cleanFilesOrUrls.length} ${plur('sketch', cleanFilesOrUrls.length)}...`)

			let nameIndex = 0

			const errorReport = []
			for (const fileOrUrl of cleanFilesOrUrls) {
				try {
					// Increment names if multiple files are exported
					const resolvedName =
						cleanFilesOrUrls.length > 1 && name !== undefined ? `${name}-${nameIndex++}` : name

					const exportList = await tldrawToImage(fileOrUrl, {
						dark,
						// eslint-disable-next-line ts/no-unsafe-type-assertion
						format: format as TldrawFormat,
						// CLI never returns false, but the function accepts it for stand-alone use
						frames,
						name: resolvedName,
						output,
						padding,
						pages,
						print,
						scale,
						stripStyle,
						transparent,
					})

					process.stdout.write(`${exportList.join('\n')}\n`)
				} catch (error: unknown) {
					errorReport.push(
						`Failed to export "${fileOrUrl}": ${error instanceof Error ? error.message : 'Unknown Error'}`,
					)
				}
			}

			const successCount = cleanFilesOrUrls.length - errorReport.length
			if (errorReport.length > 0) {
				log.error(
					`${successCount} of ${cleanFilesOrUrls.length} ${plur('sketch', cleanFilesOrUrls.length)} exported successfully`,
				)
				log.error(errorReport.join('\n'))
				process.exit(1)
			}

			if (successCount === 0) {
				log.error(
					`${successCount} of ${cleanFilesOrUrls.length} ${plur('sketch', cleanFilesOrUrls.length)} exported successfully`,
				)
			} else {
				log.info(
					`${successCount} of ${cleanFilesOrUrls.length} ${plur('sketch', cleanFilesOrUrls.length)} exported successfully`,
				)
			}

			process.exit(0)
		},
	)
	.command(
		'open [files-or-urls..]',
		'Open a tldraw `.tldr` file or tldraw.com URL in your default browser with either the official tldraw.com site or a locally-hosted instance of the editor. Call `open` without an argument to open a blank sketch. Sketches opened via URL with the `--local` flag will be temporarily copied to the local system, and will not be kept in sync with tldraw.com. This process does not exit until the browser is closed. Warning: Passing a local .tldr file without the `--local` option will upload and share the sketch on tldraw.com.',
		(yargs) =>
			yargs
				.positional('files-or-urls', {
					array: true,
					default: undefined,
					describe:
						'The `.tldr` file(s) or tldraw.com sketch URL(s) to open. Omit the argument to open a blank sketch. Supports glob matching via your shell. Prints the URL of the local server to `stdout`.',
					type: 'string',
				})
				.option('local', {
					alias: 'l',
					default: false,
					describe: 'Open the file or URL in a local instance of tldraw, instead of tldraw.com.',
					type: 'boolean',
				})
				.option('verbose', {
					default: false,
					describe:
						'Enable verbose logging. All verbose logs and prefixed with their log level and are printed to `stderr` for ease of redirection.',
					type: 'boolean',
				}),
		async ({ filesOrUrls, local, verbose }) => {
			const cleanFilesOrUrls =
				filesOrUrls === undefined
					? [undefined]
					: filesOrUrls.length > 1
						? // Undefined values sneaking through?
							(filesOrUrls as Array<string | undefined>).filter(
								(fileOrUrl) => fileOrUrl !== undefined,
							)
						: filesOrUrls

			const tlDrawOpenOptions: TldrawOpenOptions = { location: local ? 'local' : 'remote' }
			log.verbose = verbose

			let errorCount = 0
			const browserExitPromises: Array<TldrawOpenResult['browserExitPromise']> = []

			// Open everything
			for (const fileOrUrl of cleanFilesOrUrls) {
				try {
					// This prints server URLs to stdout
					const openResult = await tldrawOpen(fileOrUrl, tlDrawOpenOptions)
					process.stdout.write(`${openResult.openedSketchUrl}\n`)
					browserExitPromises.push(openResult.browserExitPromise)
				} catch (error) {
					errorCount++
					log.error(
						`Failed to open "${fileOrUrl}": ${error instanceof Error ? error.message : 'Unknown Error'}`,
					)
				}
			}

			// Some tldraw actions require access to the server, so we wait for the
			// browser to close before exiting, so that we don't close the local
			// server too early
			if (local) {
				log.info(pc.yellow(`Note: This process will exit once the browser is closed.`))
				await Promise.allSettled(browserExitPromises)
				log.info(`Closing local tldraw ${plur('server', filesOrUrls ? filesOrUrls.length : 1)}`)
			}

			if (errorCount === 0) {
				process.exit(0)
			} else {
				process.exit(1)
			}
		},
	)
	.demandCommand(1)
	.alias('h', 'help')
	.version(version)
	.alias('v', 'version')
	.help()
	.wrap(process.stdout.isTTY ? Math.min(120, yargsInstance.terminalWidth()) : 0)
	.parse()
