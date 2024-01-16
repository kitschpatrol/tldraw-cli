/* eslint-disable @typescript-eslint/naming-convention */
import { getAssetUrls } from '@tldraw/assets/selfHosted'
import { type Editor, type TLStore, Tldraw, parseTldrawJsonFile } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { useState } from 'react'

// Can't get this to work
// import { getAssetUrlsByImport } from '@tldraw/assets/imports'

export default function App() {
	const [store, setStore] = useState<TLStore>()

	function onMount(editor: Editor) {
		if (store === undefined) {
			// LocalStorage is set by by Puppeteer
			const tldrData = localStorage.getItem('tldrData')

			if (tldrData === null) {
				console.error('No tldrData in local storage')
				return
			}

			const parseFileResult = parseTldrawJsonFile({ json: tldrData, schema: editor.store.schema })
			if (parseFileResult.ok) {
				console.log('Loaded tldr file')
				setStore(parseFileResult.value)
			} else {
				console.error(`Error parsing tldr file: ${String(parseFileResult.error)}`)
			}
		}
	}

	return (
		<div style={{ inset: 0, position: 'fixed' }}>
			<Tldraw assetUrls={getAssetUrls()} onMount={onMount} store={store} />
		</div>
	)
}
