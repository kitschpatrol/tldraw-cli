// Note this tests the src implementation, because it's not exported
import { validatePathOrUrl } from '../src/lib/validation'
import { expect, it } from 'vitest'

const validationOptions = {
	requireFileExistence: true,
	validFileExtensions: ['.tldr'],
	validHostnames: ['www.tldraw.com'],
}

it('should correctly distinguish between files and URLs', () => {
	expect(
		validatePathOrUrl('https://www.tldraw.com/s/v2_c_9nMYBwT8UQ99RGDWfGr8H', validationOptions),
	).toBeInstanceOf(URL)
	expect(validatePathOrUrl('./test/assets/test-sketch.tldr', validationOptions)).toBeTypeOf(
		'string',
	)
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
		validatePathOrUrl(`file:///${process.cwd()}/test/assets/test-sketch.tldr`, validationOptions),
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
