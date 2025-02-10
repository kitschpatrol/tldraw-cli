import { build } from 'esbuild'
import iifePlugin from './plugins/esbuild-plugin-iife'

await build({
	// Fixes "Dynamic require of "buffer" is not supported" runtime CLI error
	// https://github.com/evanw/esbuild/issues/1921#issuecomment-1491470829
	banner: {
		js: `
		import { createRequire as topLevelCreateRequire } from 'module';
		const require = topLevelCreateRequire(import.meta.url);
		`,
	},
	bundle: true,
	entryPoints: ['src/cli/cli.ts'],
	external: ['express', 'puppeteer', 'yargs'],
	format: 'esm',
	minify: false,
	outfile: 'bin/cli.js',
	platform: 'node',
	plugins: [iifePlugin()],
	target: 'node18',
})
