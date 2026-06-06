import type { Editor, TLStore } from 'tldraw'
import { getAssetUrls } from '@tldraw/assets/selfHosted'
import { useEffect, useState } from 'react'
import { createTLStore, parseTldrawJsonFile, Tldraw } from 'tldraw'
import './index.css'

// Can't get this to work
// import { getAssetUrlsByImport } from '@tldraw/assets/imports'

declare global {
	// eslint-disable-next-line ts/consistent-type-definitions
	interface Window {
		editor: Editor
	}
}

type LoadState = { kind: 'loading' } | { kind: 'ready'; store: TLStore | undefined }

/**
 * Minimal tldraw app
 */
export default function App() {
	const [loadState, setLoadState] = useState<LoadState>({ kind: 'loading' })

	// Fetch the tldr data before mounting <Tldraw> so the editor is created
	// exactly once. The previous "mount empty → setStore → remount" pattern
	// tore down the first editor's FontManager while font loads were still in
	// flight, which surfaced as "AtomMap: key [object Object] not found".
	useEffect(() => {
		let cancelled = false

		async function load() {
			try {
				const response = await fetch('/tldr-data')

				if (!response.ok) {
					console.log(`No tldr data to load from local endpoint (${response.status})`)
					if (!cancelled) {
						setLoadState({ kind: 'ready', store: undefined })
					}

					return
				}

				const tldrData = await response.text()

				// Build a default store to source the schema for parsing. The
				// resulting parsed store uses the same default shape/binding
				// utils that <Tldraw> would create anyway.
				const parseFileResult = parseTldrawJsonFile({
					json: tldrData,
					schema: createTLStore().schema,
				})

				if (cancelled) {
					return
				}

				if (parseFileResult.ok) {
					console.log('Loaded tldr file from local endpoint')
					setLoadState({ kind: 'ready', store: parseFileResult.value })
				} else {
					console.error(`Couldn't parse tldr file: ${parseFileResult.error.type}`)
					setLoadState({ kind: 'ready', store: undefined })
				}
			} catch (error) {
				console.error("Couldn't fetch data:", error)
				if (!cancelled) {
					setLoadState({ kind: 'ready', store: undefined })
				}
			}
		}

		void load()

		return () => {
			cancelled = true
		}
	}, [])

	if (loadState.kind === 'loading') {
		return
	}

	const { store } = loadState

	function onMount(editor: Editor) {
		// Expose editor to window
		// Works around https://github.com/tldraw/tldraw/pull/2995
		// @ts-expect-error - TS doesn't know about globalThis
		globalThis.editor = editor

		if (store !== undefined) {
			editor.zoomToFit()
			editor.menus.clearOpenMenus()
		}
	}

	return (
		<div style={{ inset: 0, position: 'fixed' }}>
			<Tldraw assetUrls={getAssetUrls()} onMount={onMount} store={store} />
		</div>
	)
}
