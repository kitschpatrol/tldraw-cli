#!/usr/bin/env node
import { version } from '../../package.json'
import { tldrawOpen } from '../lib/tldraw-open'
import { type TldrawFormat, tldrawToImage } from '../lib/tldraw-to-image'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

await yargs(hideBin(process.argv))
	.scriptName('tldraw-cli')
	.command('$0 <command>', 'CLI tools for tldraw.')
	.command(
		'open [file-or-url]',
		'Open a tldraw ".tldr" file or tldraw.com URL your default browser. Uses a locally-hosted instance of tldraw. Call open without an argument to open a blank sketch.',
		(yargs) =>
			yargs.positional('file-or-url', {
				describe:
					'The .tldr file or tldraw.com sketch url to open. Omit to open a blank sketch. Prints the url of the local server to stdout.',
				type: 'string',
			}),
		async (argv) => {
			const { fileOrUrl } = argv
			const localUrl = await tldrawOpen(fileOrUrl)
			console.log(localUrl)
		},
	)
	.command(
		'export <file-or-url>',
		'Export a local tldraw ".tldr" file or a tldraw.com URL to an svg, png, json, or tldr file. Prints the absolute path(s) to the exported image(s) to stdout.',
		(yargs) =>
			yargs
				.positional('file-or-url', {
					demandOption: true,
					describe:
						'The sketch to export to an image — either a path to a local ".tldr" file, or a tldraw.com sketch URL',
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
					defaultDescription: 'The original file name or URL id is used',
					describe: 'Output image name',
					type: 'string',
				})
				.option('transparent', {
					alias: 't',
					default: false,
					describe: 'Output an image with a transparent background.',
					type: 'boolean',
				})
				.option('dark-mode', {
					alias: 'd',
					default: false,
					describe: 'Output a dark theme version of the image.',
					type: 'boolean',
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
						'Export each sketch "frame" as a separate image, use the option flag alone to export all frames, or pass one or more frame names or IDs.',
					type: 'array',
				})
				.option('strip-style', {
					default: false,
					describe: 'Remove all style tags from the SVG output. Applies to SVG output only.',
					type: 'boolean',
				})
				.option('print', {
					alias: 'p',
					default: false,
					describe:
						'Print the exported image(s) to stdout instead of saving to a file. Incompatible with --output, and overrides --name. PNGs are printed as base64-encoded strings.',
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
					describe: 'Enable verbose output',
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
				fileOrUrl,
				format,
				frames,
				name,
				output,
				print,
				stripStyle,
				transparent,
				verbose,
			} = argv

			try {
				const exportList = await tldrawToImage(fileOrUrl, {
					darkMode,
					format: format as TldrawFormat,
					// CLI never returns false, but the function accepts it for stand-alone use
					frames: frames as typeof frames & false,
					name,
					output,
					print,
					stripStyle,
					transparent,
					verbose,
				})

				console.log(exportList.join('\n'))
				process.exit(0)
			} catch (error) {
				console.error('Export failed:', error)
				process.exit(1)
			}
		},
	)
	.alias('h', 'help')
	.version('version', version)
	.alias('v', 'version')
	.help()
	.parse()
