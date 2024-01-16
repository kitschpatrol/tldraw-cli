import { tldrawToImage } from '../src/lib/tldraw-to-image'
import { expectFileToBeValid } from './utilities/file'
import { randomId } from './utilities/random'
import { mkdirSync, rmSync, rmdirSync } from 'node:fs'
import { expect, it } from 'vitest'

const tldrTestFilePath = './test/assets/test-sketch.tldr'

// TODO snapshots
const tldrTestFileHashSvg = 'e48f33d96c7cf113b4fafed71bc8e38bce540eef9bf56d0e2a93adad9c3e9c2b'
const tldrTestFileHashPng = '9fb348e37e574a11d5948b7c89d26479090e038383b7260e16018bec7b696b99'

it('should convert the tldr file to an svg in the current folder by default', async () => {
	const savedImageFileName = await tldrawToImage(tldrTestFilePath)
	expect(savedImageFileName).toBe(`${process.cwd()}/test-sketch.svg`)

	expectFileToBeValid(savedImageFileName, 'svg', tldrTestFileHashSvg)

	rmSync(savedImageFileName)
})

it('should convert the tldr file to an svg when specified', async () => {
	const savedImageFileName = await tldrawToImage(tldrTestFilePath, { format: 'svg' })
	expect(savedImageFileName).toBe(`${process.cwd()}/test-sketch.svg`)

	expectFileToBeValid(savedImageFileName, 'svg', tldrTestFileHashSvg)

	rmSync(savedImageFileName)
})

it('should convert the tldr file to a png when specified', async () => {
	const savedImageFileName = await tldrawToImage(tldrTestFilePath, { format: 'png' })
	expect(savedImageFileName).toBe(`${process.cwd()}/test-sketch.png`)

	expectFileToBeValid(savedImageFileName, 'png', tldrTestFileHashPng)

	rmSync(savedImageFileName)
})

it('should save the file to a specific directory when specified', async () => {
	const randomPath = randomId()
	mkdirSync(randomPath)

	const savedImageFileName = await tldrawToImage(tldrTestFilePath, {
		format: 'png',
		output: `./${randomPath}/`,
	})
	expect(savedImageFileName).toBe(`${process.cwd()}/${randomPath}/test-sketch.png`)

	expectFileToBeValid(savedImageFileName, 'png', tldrTestFileHashPng)

	rmdirSync(randomPath, { recursive: true })
})
