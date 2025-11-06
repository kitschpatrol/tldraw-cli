// This is a special file that gets compiled down to an inlineable IIFE .js
// string by a loader plugin, and is then invoked by Puppeteer on either the
// local or remote tldraw page.

// It's sort of a glorified bookmarklet.

// Technically this function could be called directly in tldraw-controller.ts
// via page.evaluate since the methods we need are in the editor namespace, but
// the nested async results are a pain to manage without basically manually
// constructing an IIFE string in the controller

// We have to convert the array buffer to a string in the browser because of
// https://github.com/puppeteer/puppeteer/issues/3722

// No top level await in IIFE or in ES6 (the target for the inline-bundler)

/* eslint-disable ts/consistent-type-definitions */
/* eslint-disable unicorn/prefer-global-this */

import type { Editor } from 'tldraw'
import { uint8ArrayToBase64 } from 'uint8array-extras'

declare global {
	// eslint-disable-next-line ts/naming-convention
	interface Window {
		editor: Editor
		getImage: (options: {
			background?: boolean
			darkMode?: boolean
			// 'jpeg' | 'webp' formats should be supported but result in "Not a PNG" errors
			format: 'png' | 'svg'
			padding?: number
			scale?: number
		}) => Promise<string>
	}
}

// Assumes the shape / page selections have already been set
// before this function is called.
window.getImage = async ({ background, darkMode, format, padding, scale }) => {
	const { editor } = window
	let ids = editor.getSelectedShapeIds()

	if (ids.length === 0) {
		console.warn('No shapes selected, attempting to select all shapes')
		ids = [...editor.getCurrentPageShapeIds().values()]
	}

	if (ids.length === 0) {
		throw new Error('No shapes to download')
	}

	try {
		const { blob } = await editor.toImage(ids, {
			background,
			darkMode,
			format,
			padding,
			pixelRatio: scale,
		})

		const uint8Array = new Uint8Array(await blob.arrayBuffer())
		return uint8ArrayToBase64(uint8Array)
	} catch (error) {
		throw error instanceof Error ? error : new Error('Unknown error')
	}
}
