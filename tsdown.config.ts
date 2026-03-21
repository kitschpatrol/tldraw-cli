import { defineConfig } from 'tsdown'
import iifePlugin from './scripts/plugins/rolldown-plugin-iife.ts'

export default defineConfig([
	// CLI tool
	{
		dts: false,
		entry: 'src/bin/cli.ts',
		fixedExtension: false,
		minify: true,
		outDir: 'dist/bin',
		platform: 'node',
		plugins: [iifePlugin()],
	},
	// TypeScript Library
	{
		// Types with tsc instead
		dts: false,
		entry: 'src/lib/index.ts',
		fixedExtension: false,
		minify: true,
		outDir: 'dist/lib',
		platform: 'node',
		plugins: [iifePlugin()],
		tsconfig: 'tsconfig.build.json',
	},
])
