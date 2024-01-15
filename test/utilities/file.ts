import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { expect } from 'vitest'

function getFileHash(filePath: string): string {
	const fileBuffer = readFileSync(filePath)
	const hash = createHash('sha256')
	hash.update(fileBuffer)
	return hash.digest('hex')
}

function expectFileToHaveHash(filePath: string, hash: string): void {
	expect(getFileHash(filePath)).toBe(hash)
}

function expectFileToExist(filePath: string): void {
	expect(existsSync(filePath))
}

function expectFileToHaveType(filePath: string, extension: string): void {
	expect(filePath.endsWith(`.${extension}`))
}

export function expectFileToBeValid(filePath: string, extension: string, hash: string): void {
	expectFileToExist(filePath)
	expectFileToHaveType(filePath, extension)
	expectFileToHaveHash(filePath, hash)
}
