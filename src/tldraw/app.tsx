/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable @typescript-eslint/naming-convention */

import type { ExportFormat, TldrFile } from '../types'

// Can't get this to work
// import { getAssetUrlsByImport } from '@tldraw/assets/imports'

import { getAssetUrls } from '@tldraw/assets/selfHosted'
import { transact } from '@tldraw/editor'
import { type Editor, Tldraw, exportAs, parseTldrawJsonFile } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { useEffect, useState } from 'react'

declare global {
	interface Window {
		tldrawExportFile: (data: TldrFile, format: ExportFormat) => void
	}
}

export default function App() {
	const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null)
	const [tldrFile, setTldrFile] = useState<TldrFile | null>(null)
	const [editor, setEditor] = useState<Editor | null>(null)

	// Define global functions accessible from puppeteer
	useEffect(() => {
		const tldrawExportFile = (tldrFile: string, format: ExportFormat = 'svg') => {
			setExportFormat(format)
			setTldrFile(tldrFile)
		}

		window.tldrawExportFile = tldrawExportFile
	}, [])

	// Execute the export when both the editor and the exportOptions are defined
	useEffect(() => {
		if (editor && exportFormat && tldrFile) {
			console.log(`tldraw is exporting to ${exportFormat}`)

			try {
				parseAndLoadDocument(editor, tldrFile)
			} catch (error) {
				console.error(`error parsing and loading data: ${String(error)}`)
			}

			// TODO Look for frames?
			exportAs(editor, [], exportFormat, {})
				.then(() => {
					console.log('exported data successfully')
				})
				.catch((error) => {
					console.error(`error exporting data: ${error}`)
				})
		}
	}, [editor, tldrFile, exportFormat])

	const ready = (editor: Editor) => {
		console.log('tldraw is ready')
		setEditor(editor)
	}

	return (
		<div style={{ inset: 0, position: 'fixed' }}>
			<Tldraw assetUrls={getAssetUrls()} onMount={ready} />
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
		throw new Error(String(parseFileResult.error))
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
