import reactPlugin from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	build: {
		emptyOutDir: true,
		outDir: '../../dist/tldraw',
	},
	plugins: [reactPlugin()],
	root: 'src/tldraw',
	test: {
		// Disable concurrent test execution across files
		maxConcurrency: 1,
		maxWorkers: 1,
		root: '.',
		sequence: {
			// Disable concurrent test execution within files
			concurrent: false,
		},
		testTimeout: 60_000,
	},
})
