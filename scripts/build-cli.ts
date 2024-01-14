import esbuild from 'esbuild'

await esbuild.build({
	bundle: true,
	entryPoints: ['src/cli/tldraw-cli.ts'],
	external: ['express', 'puppeteer'],
	format: 'esm',
	minify: true,
	outfile: 'bin/cli.js',
	platform: 'node',
	target: 'node18',
})
