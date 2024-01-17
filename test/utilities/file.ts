import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { expect } from 'vitest'

function getFileHash(filePath: string): string {
	const fileBuffer = readFileSync(filePath)
	const hash = createHash('sha256')
	hash.update(fileBuffer)
	return hash.digest('hex')
}

function expectFileToMatchHash(filePath: string): void {
	// Also tested jest-image-snapshot, which was interesting, but it's only
	// compatible with PNGs, and it and pollutes the repo with big files
	expect(getFileHash(filePath)).matchSnapshot()
}

function expectFileToExist(filePath: string): void {
	expect(existsSync(filePath))
}

function expectFileToHaveType(filePath: string, extension: string): void {
	expect(filePath.endsWith(`.${extension}`))
}

export function expectFileToBeValid(filePath: string, extension: string): void {
	expectFileToExist(filePath)
	expectFileToHaveType(filePath, extension)
	expectFileToMatchHash(filePath)
}
