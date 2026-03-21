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
		attw: {
			profile: 'esm-only',
		},
		dts: true,
		entry: 'src/lib/index.ts',
		fixedExtension: false,
		minify: true,
		outDir: 'dist/lib',
		platform: 'node',
		plugins: [iifePlugin()],
		publint: true,
		tsconfig: 'tsconfig.build.json',
	},
])
