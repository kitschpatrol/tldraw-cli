import esbuild from 'esbuild'
import iifePlugin from './plugins/esbuild-plugin-iife'

await esbuild.build({
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
