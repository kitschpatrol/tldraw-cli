// Note this tests the src implementation, because it's not exported
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, it } from 'vitest'
import { validatePathOrUrl } from '../src/lib/validation'

const validationOptions = {
	requireFileExistence: true,
	validFileExtensions: ['.tldr'],
	validHostnames: ['www.tldraw.com'],
}

it('should correctly distinguish between files and URLs', () => {
	expect(
		validatePathOrUrl('https://www.tldraw.com/s/v2_c_9nMYBwT8UQ99RGDWfGr8H', validationOptions),
	).toBeInstanceOf(URL)
	expect(
		validatePathOrUrl('./test/assets/valid/2024-01-test-sketch-basic.tldr', validationOptions),
	).toBeTypeOf('string')
})

it('should expand the home directory', () => {
	expect(
		validatePathOrUrl('~/some/path/file.tldr', {
			...validationOptions,
			requireFileExistence: false,
		}),
	).not.toContain('~')
})

it('should export file URLs to paths', () => {
	expect(
		validatePathOrUrl(
			pathToFileURL(path.join(process.cwd(), 'test/assets/valid/2024-01-test-sketch-basic.tldr'))
				.href,
			validationOptions,
		),
	).toBeTypeOf('string')
})

it('should reject bad paths', () => {
	expect(() => validatePathOrUrl('./some/path/file.jpeg', validationOptions)).toThrow()
})

it('should reject bad paths', () => {
	expect(() => validatePathOrUrl('./some/path/file.jpeg', validationOptions)).toThrow()
})

it('should reject bad URLs', () => {
	expect(() =>
		validatePathOrUrl('https://www.example.com/s/v2_c_9nMYBwT8UQ99RGDWfGr8H', validationOptions),
	).toThrow()
})
