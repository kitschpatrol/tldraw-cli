import { existsSync } from 'node:fs'
import { describe, test } from 'vitest'
import type { TldrawFormat } from '../dist/lib'
import { tldrawToImage } from '../dist/lib'

// Largest / most complex fixture in the repo.
const tldrTestFilePath = './test/assets/valid/2024-06-test-sketch-basic.tldr'

// Set by the `bench:baseline` script to overwrite the stored baselines.
const writeBaseline = process.env.TLDRAW_BENCH_WRITE_BASELINE === 'true'

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
		// eslint-disable-next-line test/expect-expect -- Benchmarks report timings instead of asserting
		test(`export ${format}`, async ({ bench: benchmark }) => {
			const baselinePath = `./test/benchmarks/export-${format}.json`

			const current = benchmark(
				'current',
				writeBaseline ? { writeResult: baselinePath } : {},
				async () => {
					// Print: true exercises the full local pipeline without writing files.
					await tldrawToImage(tldrTestFilePath, { format, print: true })
				},
			)

			if (existsSync(baselinePath)) {
				await benchmark.compare(current, benchmark.from('baseline', baselinePath), benchOptions)
			} else {
				await current.run(benchOptions)
			}
		})
	}
})
