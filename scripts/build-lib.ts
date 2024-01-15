import esbuild from 'esbuild'

await esbuild.build({
	bundle: true,
	entryPoints: ['src/lib/index.ts'],
	external: ['express', 'puppeteer'],
	format: 'esm',
	minify: true,
	outfile: 'dist/lib/index.js',
	platform: 'node',
	target: 'node18',
})
