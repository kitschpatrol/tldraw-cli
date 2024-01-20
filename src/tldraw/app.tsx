/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable @typescript-eslint/naming-convention */
import { getAssetUrls } from '@tldraw/assets/selfHosted'
import { type Editor, type TLStore, Tldraw, parseTldrawJsonFile } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { useState } from 'react'

// Can't get this to work
// import { getAssetUrlsByImport } from '@tldraw/assets/imports'

declare global {
	interface Window {
		app: {
			clearOpenMenus: () => void
		}
	}
}

export default function App() {
	const [store, setStore] = useState<TLStore>()

	// Load store data from local endpoint
	function onMount(editor: Editor) {
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
					const parseFileResult = parseTldrawJsonFile({
						json: tldrData,
						schema: editor.store.schema,
					})
					if (parseFileResult.ok) {
						console.log('Loaded tldr file from local endpoint')
						setStore(parseFileResult.value)
					} else {
						console.error(`Error parsing tldr file: ${String(parseFileResult.error.type)}`)
					}
				})
				.catch((error) => {
					console.error('Error fetching data:', error)
				})
		} else {
			editor.updateViewportScreenBounds()
			editor.zoomToFit()
			window.app.clearOpenMenus()
		}
	}

	return (
		<div style={{ inset: 0, position: 'fixed' }}>
			<Tldraw assetUrls={getAssetUrls()} onMount={onMount} store={store} />
		</div>
	)
}
