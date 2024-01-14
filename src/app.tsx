/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable unicorn/consistent-function-scoping */
/* eslint-disable @typescript-eslint/naming-convention */

import { transact } from '@tldraw/editor'
import { type Editor, Tldraw, exportAs, parseTldrawJsonFile } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'

// TODO wherefrom import?
type TLExportType = 'jpeg' | 'json' | 'png' | 'svg' | 'webp'

// TODO post it instead...
const parseUrlParams = (): {
	decodedData: string | undefined
	format: TLExportType | undefined
} => {
	const searchParams = new URLSearchParams(window.location.search)
	const format = searchParams.get('format') as TLExportType | undefined
	const data = searchParams.get('data')

	// Assuming 'data' is a URL-encoded JSON string
	const decodedData = data ? decodeURIComponent(data) : undefined

	return { decodedData, format }
}

export default function App() {
	const ready = (editor: Editor) => {
		console.log('tldraw mounted')
		// Default to svg
		const { decodedData, format = 'svg' } = parseUrlParams()

		if (!decodedData) {
			throw new Error('No data provided')
		}

		parseAndLoadDocument(editor, decodedData)

		// Look for frames?
		// const shapeIds = editor.getPageShapeIds('page:page')
		// console.log(`shapeIds: ${shapeIds}`)
		exportAs(editor, [], format, {}).then(() => {
			console.log('exported data')
		})
	}

	return (
		<div style={{ inset: 0, position: 'fixed' }}>
			<Tldraw onMount={ready} />
		</div>
	)
}

// Rework of
// https://github.com/tldraw/tldraw/blob/231354d93c521c12071105fce1ae486c96aa862d/packages/tldraw/src/lib/utils/tldr/file.ts#L216
function parseAndLoadDocument(editor: Editor, document: string) {
	const parseFileResult = parseTldrawJsonFile({
		json: document,
		schema: editor.store.schema,
	})
	if (!parseFileResult.ok) {
		console.error(parseFileResult.error)
		return
	}

	// Tldraw file contain the full state of the app,
	// including ephemeral data. it up to the opener to
	// decide what to restore and what to retain. Here, we
	// just restore everything, so if the user has opened
	// this file before they'll get their camera etc.
	// restored. we could change this in the future.
	transact(() => {
		const { isFocused } = editor.getInstanceState()
		editor.store.clear()
		const [shapes, nonShapes] = partition(
			parseFileResult.value.allRecords(),
			(record) => record.typeName === 'shape',
		)
		editor.store.put(nonShapes, 'initialize')
		// TODO internal?
		// editor.store.ensureStoreIsUsable()
		editor.store.put(shapes, 'initialize')
		editor.history.clear()
		editor.updateViewportScreenBounds()
		// TODO internal?
		// editor.updateRenderingBounds()

		const bounds = editor.getCurrentPageBounds()
		if (bounds) {
			editor.zoomToBounds(bounds, 1)
		}

		editor.updateInstanceState({ isFocused })
	})
}

// https://github.com/tldraw/tldraw/blob/main/packages/utils/src/lib/array.ts#L62
function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
	const satisfies: T[] = []
	const doesNotSatisfy: T[] = []
	for (const item of array) {
		if (predicate(item)) {
			satisfies.push(item)
		} else {
			doesNotSatisfy.push(item)
		}
	}

	return [satisfies, doesNotSatisfy]
}
