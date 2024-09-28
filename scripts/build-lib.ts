import esbuild from 'esbuild'
import iifePlugin from './plugins/esbuild-plugin-iife'

await esbuild.build({
	// Fixes "Dynamic require of "buffer" is not supported" runtime CLI error
	// https://github.com/evanw/esbuild/issues/1921#issuecomment-1491470829
	banner: {
		js: `
		import { createRequire as topLevelCreateRequire } from 'module';
		const require = topLevelCreateRequire(import.meta.url);
		`,
	},
	bundle: true,
	entryPoints: ['src/lib/index.ts'],
	external: ['express', 'puppeteer'],
	format: 'esm',
	minify: false,
	outfile: 'dist/lib/index.js',
	platform: 'node',
	plugins: [iifePlugin()],
	target: 'node18',
})
