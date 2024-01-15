import { tldrawToImage } from '../src/lib/tldraw-to-image'
import { expectFileToBeValid } from './utilities/file'
import { randomId } from './utilities/random'
import { mkdirSync, rmSync, rmdirSync } from 'node:fs'
import { expect, it } from 'vitest'

const tldrawTestUrl = 'https://www.tldraw.com/s/v2_c_cQCtLu41OH97xkTl2Mt-9'

it('should convert the tldraw url to an svg in the current folder by default', async () => {
	const savedImageFileName = await tldrawToImage(tldrawTestUrl)
	// TODO vet file names

	expectFileToBeValid(
		savedImageFileName,
		'svg',
		'067a1704f5990ee35ddf69d5a76f1c610f768018fd5bfb2f2471ebeb66baebf2',
	)

	rmSync(savedImageFileName)
})

it('should convert the tldraw url to an svg when specified', async () => {
	const savedImageFileName = await tldrawToImage(tldrawTestUrl, 'svg')
	// TODO vet file names

	expectFileToBeValid(
		savedImageFileName,
		'svg',
		'067a1704f5990ee35ddf69d5a76f1c610f768018fd5bfb2f2471ebeb66baebf2',
	)

	rmSync(savedImageFileName)
})

it('should convert the tldraw url to a png when specified', async () => {
	const savedImageFileName = await tldrawToImage(tldrawTestUrl, 'png')

	expectFileToBeValid(
		savedImageFileName,
		'png',
		'3c001a27024eeca57bbe8bf70917171563aea862be281479538d123184e2b3de',
	)

	rmSync(savedImageFileName)
})

it('should save the file to a specific directory when specified', async () => {
	const randomPath = randomId()
	mkdirSync(randomPath)

	const savedImageFileName = await tldrawToImage(tldrawTestUrl, 'png', `./${randomPath}/`)
	expect(savedImageFileName).toContain(randomPath)

	expectFileToBeValid(
		savedImageFileName,
		'png',
		'3c001a27024eeca57bbe8bf70917171563aea862be281479538d123184e2b3de',
	)

	rmdirSync(randomPath, { recursive: true })
})
