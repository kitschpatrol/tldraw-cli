#!/usr/bin/env node
import { version } from '../../package.json'
import { type ExportFormat } from '../types'
import { exportTldr } from './export-tldr'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

await yargs(hideBin(process.argv))
	.command(
		'$0 <file>',
		'convert a file',
		(yargs) =>
			yargs
				.positional('file', {
					demandOption: true,
					describe: '.tldr file to convert',
					type: 'string',
				})
				.option('format', {
					alias: 'f',
					choices: ['jpeg', 'png', 'svg', 'webp'],
					default: 'svg',
					describe: 'output format',
					type: 'string',
				})
				.option('output', {
					alias: 'o',
					default: './',
					describe: 'output path',
					type: 'string',
				})
				.option('verbose', {
					default: false,
					describe: 'enable verbose output',
					type: 'boolean',
				}),
		async (argv) => {
			const { file, format, output, verbose } = argv

			try {
				await exportTldr(file, format as ExportFormat, output, verbose)
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
