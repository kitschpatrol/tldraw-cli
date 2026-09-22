import { defineConfig } from 'tsdown'
import iifePlugin from './scripts/plugins/rolldown-plugin-iife.ts'

export default defineConfig({
	attw: {
		profile: 'esm-only',
	},
	// Vite builds dist/tldraw first; clean only outputs owned by this build.
	clean: ['dist/bin', 'dist/lib', 'dist/chunks'],
	dts: {
		entry: 'src/lib/index.ts',
	},
	entry: {
		'bin/cli': 'src/bin/cli.ts',
		'lib/index': 'src/lib/index.ts',
	},
	fixedExtension: false,
	minify: true,
	outDir: 'dist',
	outputOptions: {
		// Keep shared code one level below dist for relative tldraw asset lookups.
		chunkFileNames: 'chunks/[name]-[hash].js',
	},
	platform: 'node',
	plugins: [iifePlugin()],
	publint: true,
	tsconfig: 'tsconfig.build.json',
})
