#!/usr/bin/env node
import { version } from '../../package.json'
import { tldrawOpen } from '../lib/tldraw-open'
import { type TldrawFormat, tldrawToImage } from '../lib/tldraw-to-image'
import * as logger from '../lib/utilities/logger'
import chalk from 'chalk'
import plur from 'plur'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

logger.setCli(true)

await yargs(hideBin(process.argv))
	.scriptName('tldraw-cli')
	.command('$0 <command>', 'CLI tools for tldraw.')
	.command(
		'export <files-or-urls..>',
		'Export a local tldraw ".tldr" file or a tldraw.com URL to an svg, png, json, or tldr file. Prints the absolute path(s) to the exported image(s) to stdout.',
		(yargs) =>
			yargs
				.positional('files-or-urls', {
					demandOption: true,
					describe:
						'The tldraw sketch to export. May be one or more paths to local `.tldr` files, or tldraw.com sketch URLs. Accepts a mix of both file paths and URLs, and supports glob matching via your shell. Prints the absolute path(s) to the exported image(s) to `stdout`.',
					type: 'string',
				})
				.option('format', {
					alias: 'f',
					choices: ['png', 'svg', 'json', 'tldr'],
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
						'Export each sketch "frame" as a separate image. Pass one or more frame names or IDs to export specific frames, or skip the arguments to export all frames.',
					type: 'array',
				})
				.option('transparent', {
					alias: 't',
					default: false,
					describe: 'Export an image with a transparent background.',
					type: 'boolean',
				})
				.option('dark-mode', {
					alias: 'd',
					default: false,
					describe: 'Export a dark theme version of the image.',
					type: 'boolean',
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
						'Print the exported image(s) to stdout instead of saving to a file. Incompatible with `--output`, and overrides `--name`. PNGs are printed as base64-encoded strings.',
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
		async (argv) => {
			const {
				darkMode,
				filesOrUrls,
				format,
				frames,
				name,
				output,
				print,
				stripStyle,
				transparent,
				verbose,
			} = argv

			logger.setVerbose(verbose)

			logger.info(`Exporting ${filesOrUrls.length} ${plur('sketch', filesOrUrls.length)}...`)

			let nameIndex = 0

			const errorReport = []
			for (const fileOrUrl of filesOrUrls) {
				try {
					// Increment names if multiple files are exported
					const resolvedName =
						filesOrUrls.length > 1 && name !== undefined ? `${name}-${nameIndex++}` : name

					const exportList = await tldrawToImage(fileOrUrl, {
						darkMode,
						format: format as TldrawFormat,
						// CLI never returns false, but the function accepts it for stand-alone use
						frames,
						name: resolvedName,
						output,
						print,
						stripStyle,
						transparent,
						verbose,
					})

					logger.log(exportList.join('\n'))
				} catch (error: unknown) {
					if (error instanceof Error) {
						errorReport.push(`Failed to export "${fileOrUrl}": ${error.message}`)
					}
				}
			}

			const successCount = filesOrUrls.length - errorReport.length
			if (errorReport.length > 0) {
				logger.error(
					`${successCount} of ${filesOrUrls.length} ${plur('sketch', filesOrUrls.length)} exported successfully`,
				)
				logger.error(errorReport.join('\n'))
				process.exit(1)
			}

			if (successCount === 0) {
				logger.error(
					`${successCount} of ${filesOrUrls.length} ${plur('sketch', filesOrUrls.length)} exported successfully`,
				)
			} else {
				logger.info(
					`All ${successCount} ${plur('sketch', filesOrUrls.length)} exported successfully`,
				)
			}

			process.exit(0)
		},
	)
	.command(
		'open [files-or-urls..]',
		'Open a tldraw `.tldr` file or tldraw.com URL your default browser. Uses a locally-hosted instance of tldraw. Call `open` without an argument to open a blank sketch. Sketches opened via URL are temporarily copied to the local system, and will not be kept in sync with tldraw.com.',
		(yargs) =>
			yargs.positional('files-or-urls', {
				describe:
					'The `.tldr` file(s) or tldraw.com sketch URL(s) to open. Omit the argument to open a blank sketch. Supports glob matching via your shell. Prints the URL of the local server to `stdout`.',
				type: 'string',
			}),
		async (argv) => {
			const { filesOrUrls } = argv

			const resultPromises = []
			let errorCount = 0

			if (filesOrUrls === undefined || filesOrUrls.length === 0) {
				try {
					// This prints server URLs to stdout
					resultPromises.push(tldrawOpen())
				} catch (error) {
					errorCount++
					if (error instanceof Error) {
						logger.error(`Failed to open:": ${error.message}`)
					}
				}
			} else {
				for (const fileOrUrl of filesOrUrls) {
					try {
						// This prints server URLs to stdout
						resultPromises.push(tldrawOpen(fileOrUrl))
					} catch (error) {
						errorCount++
						if (error instanceof Error) {
							logger.error(`Failed to open "${fileOrUrl}": ${error.message}`)
						}
					}
				}
			}

			logger.log(chalk.yellow(`Note: This process will exit once the browser is closed.`))
			await Promise.all(resultPromises)

			// Must keep running the process until the browsers are closed
			logger.log(`Closing local tldraw ${plur('server', filesOrUrls ? filesOrUrls.length : 1)}`)
			if (errorCount === 0) {
				process.exit(0)
			} else {
				process.exit(1)
			}
		},
	)
	.alias('h', 'help')
	.version('version', version)
	.alias('v', 'version')
	.help()
	.parse()
