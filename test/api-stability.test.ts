import { tldrawToImage, tldrawToShareUrl } from '../dist/lib'
import { expectFileToExist } from './utilities/file'
import fs from 'node:fs/promises'
import { describe, expect, it, vi } from 'vitest'

const cleanUp = true

describe('api stability', () => {
	it('should survive a round trip to and from tldraw.com', { timeout: 60_000 }, async () => {
		// Spy on console.error and console.warn
		const spyError = vi.spyOn(console, 'error')
		const spyWarn = vi.spyOn(console, 'warn')

		// Open a local sketch on tldraw.com, receiving its url
		const remoteSketchUrl = await tldrawToShareUrl(
			'./test/assets/valid/2024-01-test-sketch-basic.tldr',
		)

		// Download as a tldr file
		const [localSketchFromWeb] = await tldrawToImage(remoteSketchUrl, {
			dark: false,
			format: 'tldr',
			name: 'sketch-from-tldraw-com',
			transparent: false,
		})

		// Try to re-save the file locally as an svg
		const [localFile] = await tldrawToImage(localSketchFromWeb)

		// Assert that the files exist
		expectFileToExist(localSketchFromWeb)
		expectFileToExist(localFile)

		// Assert that there were no console errors or warnings
		expect(spyError).not.toHaveBeenCalled()
		expect(spyWarn).not.toHaveBeenCalled()

		// Restore the original console methods
		spyError.mockRestore()
		spyWarn.mockRestore()

		// Clean up
		if (cleanUp) {
			await fs.rm(localSketchFromWeb, { force: true })
			await fs.rm(localFile, { force: true })
		}
	})
})
