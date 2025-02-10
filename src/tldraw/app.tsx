import { getAssetUrls } from '@tldraw/assets/selfHosted'
import { useState } from 'react'
import { type Editor, parseTldrawJsonFile, Tldraw, type TLStore } from 'tldraw'
import './index.css'

// Can't get this to work
// import { getAssetUrlsByImport } from '@tldraw/assets/imports'

declare global {
	// eslint-disable-next-line ts/consistent-type-definitions
	interface Window {
		editor: Editor
	}
}

/**
 * Minimal tldraw app
 */
export default function App() {
	const [store, setStore] = useState<TLStore>()

	// Load store data from local endpoint
	function onMount(editor: Editor) {
		// Expose editor to window
		// Works around https://github.com/tldraw/tldraw/pull/2995
		// @ts-expect-error - TS doesn't know about globalThis
		globalThis.editor = editor

		if (store === undefined) {
			fetch('/tldr-data')
				.then(async (response) => {
					if (!response.ok) {
						console.log(`No tldr data to load from local endpoint (${response.status})`)
						return
					}

					return response.text()
				})
				.then((tldrData) => {
					if (tldrData === undefined) return

					// Note alternate approach with createTLSchema
					// https://github.com/tldraw/tldraw/issues/3155
					const parseFileResult = parseTldrawJsonFile({
						json: tldrData,
						schema: editor.store.schema,
					})

					if (parseFileResult.ok) {
						console.log('Loaded tldr file from local endpoint')
						setStore(parseFileResult.value)
					} else {
						console.error(`Couldn't parse tldr file: ${String(parseFileResult.error.type)}`)
					}
				})
				.catch((error: unknown) => {
					console.error("Couldn't fetch data:", error)
				})
		} else {
			editor.zoomToFit()
			editor.clearOpenMenus()
		}
	}

	return (
		<div style={{ inset: 0, position: 'fixed' }}>
			<Tldraw assetUrls={getAssetUrls()} onMount={onMount} store={store} />
		</div>
	)
}
