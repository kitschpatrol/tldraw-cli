// This is a special file that gets compiled down to an inlineable IIFE .js
// string by a loader plugin, and is then invoked by Puppeteer on either the
// local or remote tldraw page.

// It's sort of a glorified bookmarklet.

// Due to apparent tree shaking difficulties, Using imports dramatically
// increases the bundle size, but induces no measurable execution performance
// penalty vs. inlining the required functions in this file, and should be more
// maintainable.

// We can't simply bake the functions into the local tldraw instance because
// they need to work on live tldraw.com URLs as well.

// No top level await in IIFE or in ES6 (the target for the inline-bundler)
/* eslint-disable unicorn/prefer-top-level-await */
/* eslint-disable @typescript-eslint/consistent-type-definitions */

import { type Editor, serializeTldrawJsonBlob } from '@tldraw/tldraw'

declare global {
	interface Window {
		editor: Editor
	}
}

if (!window.editor.store) throw new Error('Store is undefined')

// No top-level await in iife or es6
serializeTldrawJsonBlob(window.editor.store)
	.then((blob) => {
		const name = '' // Managed by Puppeteer
		const file = new File([blob], name, { type: blob.type })
		const link = document.createElement('a')
		const url = URL.createObjectURL(file)

		link.href = url
		link.download = file.name
		link.click()
		URL.revokeObjectURL(url)
	})
	.catch((error) => {
		console.error(error)
	})
