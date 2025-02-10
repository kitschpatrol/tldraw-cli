import { expect } from 'vitest'

/**
 * Test fails if the given text is more than one line.
 */
export function expectSingleLine(text: string): void {
	expect(text).not.toMatch(/\r\n/g)
}
