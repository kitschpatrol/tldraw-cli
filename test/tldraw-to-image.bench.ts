import { bench, describe } from 'vitest'
import type { TldrawFormat } from '../dist/lib'
import { tldrawToImage } from '../dist/lib'

// Largest / most complex fixture in the repo.
const tldrTestFilePath = './test/assets/valid/2024-06-test-sketch-basic.tldr'

// Each conversion launches a fresh headless browser, so keep iteration counts low.
const benchOptions = {
	iterations: 3,
	time: 0,
	warmupIterations: 1,
	warmupTime: 0,
}

const formats: TldrawFormat[] = ['svg', 'png', 'tldr']

describe('local file export', () => {
	for (const format of formats) {
		bench(
			`export ${format}`,
			async () => {
				// Print: true exercises the full local pipeline without writing files.
				await tldrawToImage(tldrTestFilePath, { format, print: true })
			},
			benchOptions,
		)
	}
})
