// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="vitest" />

import reactPlugin from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
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
		minWorkers: 1,
		root: '.',
		testTimeout: 120_000,
		// Not needed
		// sequence: {
		// 	// Disable concurrent test execution within files
		// 	concurrent: false,
		// },
	},
})
