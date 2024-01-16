#!/usr/bin/env node
import { version } from '../../package.json'
import { tldrawToImage } from '../lib/tldraw-to-image'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

await yargs(hideBin(process.argv))
	.command(
		'$0 <file-or-url>',
		'Convert a tldraw ".tldr" file or tldraw.com URL to an svg or png image',
		(yargs) =>
			yargs
				.positional('file-or-url', {
					demandOption: true,
					describe:
						'The sketch to convert to an image — either a path to a local ".tldr" file, or a tldraw.com sketch URL',
					type: 'string',
				})
				.option('format', {
					alias: 'f',
					choices: ['png', 'svg'],
					default: 'svg',
					describe: 'Output image format',
					type: 'string',
				})
				.option('output', {
					alias: 'o',
					default: './',
					describe: 'Output image directory',
					type: 'string',
				})
				.option('transparent', {
					alias: 't',
					default: false,
					describe: 'Output an image with a transparent background',
					type: 'boolean',
				})
				.option('dark-mode', {
					alias: 'd',
					default: false,
					describe: 'Output a dark theme version of the image',
					type: 'boolean',
				})
				.option('verbose', {
					default: false,
					describe: 'Enable verbose output',
					type: 'boolean',
				}),
		async (argv) => {
			const { darkMode, fileOrUrl, format, output, transparent, verbose } = argv

			try {
				await tldrawToImage(fileOrUrl, {
					darkMode,
					format: format as 'png' | 'svg',
					output,
					transparent,
					verbose,
				})
				process.exit(0)
			} catch (error) {
				console.error('Error during conversion:', error)
				process.exit(1)
			}
		},
	)
	.alias('h', 'help')
	.version('version', version)
	.alias('v', 'version')
	.help()
	.parse()
