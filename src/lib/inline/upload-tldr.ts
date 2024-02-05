/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { type Editor, parseTldrawJsonFile } from '@tldraw/tldraw'

declare global {
	interface Window {
		editor: Editor
		uploadTldr: (tldrData: string) => void
	}
}

if (!window.editor.store) throw new Error('Store is undefined')

window.uploadTldr = (tldrData: string): void => {
	if (tldrData === undefined) return

	const parseFileResult = parseTldrawJsonFile({
		json: JSON.stringify(tldrData),
		schema: window.editor.store.schema,
	})
	if (parseFileResult.ok) {
		const snapshot = parseFileResult.value.getSnapshot()
		window.editor.store.loadSnapshot(snapshot)
	} else {
		console.error(`Couldn't parse tldr file: ${String(parseFileResult.error.type)}`)
	}
}
