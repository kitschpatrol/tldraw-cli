declare module 'sharp-phash' {
	import type sharp from 'sharp'

	type SharpImage = Parameters<typeof sharp>[0]
	type SharpOptions = Parameters<typeof sharp>[1]

	export default function phash(image: SharpImage, options?: SharpOptions): Promise<string>
}

declare module 'sharp-phash/distance' {
	export default function distance(a: string, b: string): number
}
