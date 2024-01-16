import { tldrawToImage } from '../src/lib/tldraw-to-image'
import { expectFileToBeValid } from './utilities/file'
import { randomId } from './utilities/random'
import { mkdirSync, rmSync, rmdirSync } from 'node:fs'
import { expect, it } from 'vitest'

const tldrawTestUrl = 'https://www.tldraw.com/s/v2_c_9nMYBwT8UQ99RGDWfGr8H'

// TODO snapshots
const tldrawTestUrlSvgHash = 'e48f33d96c7cf113b4fafed71bc8e38bce540eef9bf56d0e2a93adad9c3e9c2b'
const tldrawTestUrlPngHash = '9fb348e37e574a11d5948b7c89d26479090e038383b7260e16018bec7b696b99'

it('should convert the tldraw url to an svg in the current folder by default', async () => {
	const savedImageFileName = await tldrawToImage(tldrawTestUrl)
	// TODO vet file names

	expectFileToBeValid(savedImageFileName, 'svg', tldrawTestUrlSvgHash)

	rmSync(savedImageFileName)
})

it('should convert the tldraw url to an svg when specified', async () => {
	const savedImageFileName = await tldrawToImage(tldrawTestUrl, { format: 'svg' })
	// TODO vet file names

	expectFileToBeValid(savedImageFileName, 'svg', tldrawTestUrlSvgHash)

	rmSync(savedImageFileName)
})

it('should convert the tldraw url to a png when specified', async () => {
	const savedImageFileName = await tldrawToImage(tldrawTestUrl, { format: 'png' })

	expectFileToBeValid(savedImageFileName, 'png', tldrawTestUrlPngHash)

	rmSync(savedImageFileName)
})

it('should save the file to a specific directory when specified', async () => {
	const randomPath = randomId()
	mkdirSync(randomPath)

	const savedImageFileName = await tldrawToImage(tldrawTestUrl, {
		format: 'png',
		output: `./${randomPath}/`,
	})
	expect(savedImageFileName).toContain(randomPath)

	expectFileToBeValid(savedImageFileName, 'png', tldrawTestUrlPngHash)

	rmdirSync(randomPath, { recursive: true })
})
