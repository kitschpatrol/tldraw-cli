import { expect } from 'vitest'

export function expectSingleLine(text: string): void {
	expect(text).not.toMatch(/\r\n/g)
}
