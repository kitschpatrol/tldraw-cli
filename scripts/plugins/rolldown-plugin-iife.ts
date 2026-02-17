/* eslint-disable unicorn/no-null */

import type { Plugin } from 'rolldown'
import * as esbuild from 'esbuild'
import path from 'node:path'

/**
 * This Rolldown plugin intercepts imports ending with ?iife, sends them through esbuild,
 * and then returns the result as a string which may then be inlined or passed
 * to puppeteer's evaluation functions
 */
export default function iifePlugin(): Plugin {
	const prefix = '\0iife:'

	return {
		async load(id) {
			if (!id.startsWith(prefix)) {
				return null
			}

			let filePath = id.slice(prefix.length)
			// Add .ts extension if not already present
			if (!path.extname(filePath)) {
				filePath = `${filePath}.ts`
			}

			const result = await esbuild.build({
				bundle: true,
				entryPoints: [filePath],
				format: 'iife',
				minify: true,
				platform: 'browser',
				target: 'es6',
				treeShaking: true,
				write: false,
			})

			const code = result.outputFiles[0].text
			return `export default ${JSON.stringify(code)};`
		},
		name: 'iife',
		resolveId(source, importer) {
			if (!source.endsWith('?iife')) {
				return null
			}

			const cleanPath = source.slice(0, -'?iife'.length)
			const resolveDirectory = importer ? path.dirname(importer) : process.cwd()
			const resolved = path.resolve(resolveDirectory, cleanPath)
			return { id: `${prefix}${resolved}` }
		},
	}
}
