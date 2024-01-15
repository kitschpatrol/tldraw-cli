import { tldrawToImage } from '../src/lib/tldraw-to-image'
import { expectFileToBeValid } from './utilities/file'
import { randomId } from './utilities/random'
import { mkdirSync, rmSync, rmdirSync } from 'node:fs'
import { expect, it } from 'vitest'

const tldrTestFilePath = './test/assets/box.tldr'

it('should convert the tldr file to an svg in the current folder by default', async () => {
	const savedImageFileName = await tldrawToImage(tldrTestFilePath)
	expect(savedImageFileName).toBe(`${process.cwd()}/box.svg`)

	expectFileToBeValid(
		savedImageFileName,
		'svg',
		'ec05e4f7adfb1e8e8f911f4f52337233adcd11969a224c19356b83a8f94f4bbe',
	)

	rmSync(savedImageFileName)
})

it('should convert the tldr file to an svg when specified', async () => {
	const savedImageFileName = await tldrawToImage(tldrTestFilePath, 'svg')
	expect(savedImageFileName).toBe(`${process.cwd()}/box.svg`)

	expectFileToBeValid(
		savedImageFileName,
		'svg',
		'ec05e4f7adfb1e8e8f911f4f52337233adcd11969a224c19356b83a8f94f4bbe',
	)

	rmSync(savedImageFileName)
})

it('should convert the tldr file to a png when specified', async () => {
	const savedImageFileName = await tldrawToImage(tldrTestFilePath, 'png')
	expect(savedImageFileName).toBe(`${process.cwd()}/box.png`)

	expectFileToBeValid(
		savedImageFileName,
		'png',
		'f1e4fdb6af22c637c5928c26333b0bfc300633ad59a10a81cbb42f2015387449',
	)

	rmSync(savedImageFileName)
})

it('should save the file to a specific directory when specified', async () => {
	const randomPath = randomId()
	mkdirSync(randomPath)

	const savedImageFileName = await tldrawToImage(tldrTestFilePath, 'png', `./${randomPath}/`)
	expect(savedImageFileName).toBe(`${process.cwd()}/${randomPath}/box.png`)

	expectFileToBeValid(
		savedImageFileName,
		'png',
		'f1e4fdb6af22c637c5928c26333b0bfc300633ad59a10a81cbb42f2015387449',
	)

	rmdirSync(randomPath, { recursive: true })
})
