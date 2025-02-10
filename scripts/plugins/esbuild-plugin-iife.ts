// This plugin intercepts imports ending with ?iife, sends them through esbuild,
// and then returns the result as a string which may then be inlined or passed
// to puppeteer's evaluation functions

/* eslint-disable ts/no-unsafe-argument */
/* eslint-disable ts/no-unsafe-member-access */
import type { Plugin } from 'esbuild'
import * as esbuild from 'esbuild'
import path from 'node:path'

/**
 * IIFE plugin
 */
export default function iifePlugin(): Plugin {
	return {
		name: 'iife',
		setup(build) {
			build.onResolve({ filter: /\?iife$/ }, (args) => ({
				namespace: 'iife-loader',
				path: args.path,
				pluginData: {
					isAbsolute: path.isAbsolute(args.path),
					resolveDir: args.resolveDir,
				},
			}))
			build.onLoad({ filter: /\?iife$/, namespace: 'iife-loader' }, async (args) => {
				const fullPath = args.pluginData.isAbsolute
					? args.path
					: path.join(args.pluginData.resolveDir, args.path)

				const result = await esbuild.build({
					bundle: true,
					entryPoints: [fullPath],
					format: 'iife',
					minify: true,
					platform: 'browser',
					target: 'es6',
					treeShaking: true,
					write: false,
				})

				return {
					contents: result.outputFiles[0].text,
					loader: 'text',
				}
			})
		},
	}
}
