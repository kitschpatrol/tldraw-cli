/* eslint-disable unicorn/consistent-function-scoping */

/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { transact } from '@tldraw/editor'
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type Editor, Tldraw, parseTldrawJsonFile } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'

const tldrFileContent =
	'{"tldrawFileFormatVersion":1,"schema":{"schemaVersion":1,"storeVersion":4,"recordVersions":{"asset":{"version":1,"subTypeKey":"type","subTypeVersions":{"image":3,"video":3,"bookmark":1}},"camera":{"version":1},"document":{"version":2},"instance":{"version":22},"instance_page_state":{"version":5},"page":{"version":1},"shape":{"version":3,"subTypeKey":"type","subTypeVersions":{"group":0,"text":1,"bookmark":2,"draw":1,"geo":8,"note":5,"line":1,"frame":0,"arrow":2,"highlight":0,"embed":4,"image":3,"video":2}},"instance_presence":{"version":5},"pointer":{"version":1}}},"records":[{"gridSize":10,"name":"","meta":{},"id":"document:document","typeName":"document"},{"id":"pointer:pointer","typeName":"pointer","x":58,"y":40,"lastActivityTimestamp":1705207679062,"meta":{}},{"meta":{},"id":"page:page","name":"Page 1","index":"a1","typeName":"page"},{"x":0,"y":0,"z":1,"meta":{},"id":"camera:page:page","typeName":"camera"},{"editingShapeId":null,"croppingShapeId":null,"selectedShapeIds":[],"hoveredShapeId":null,"erasingShapeIds":[],"hintingShapeIds":[],"focusedGroupId":null,"meta":{},"id":"instance_page_state:page:page","pageId":"page:page","typeName":"instance_page_state"},{"followingUserId":null,"opacityForNextShape":1,"stylesForNextShape":{"tldraw:geo":"rectangle"},"brush":null,"scribbles":[],"cursor":{"type":"default","rotation":0},"isFocusMode":false,"exportBackground":true,"isDebugMode":false,"isToolLocked":false,"screenBounds":{"x":0,"y":0,"w":1280,"h":1312},"zoomBrush":null,"isGridMode":false,"isPenMode":false,"chatMessage":"","isChatting":false,"highlightedUserIds":[],"canMoveCamera":true,"isFocused":true,"devicePixelRatio":2,"isCoarsePointer":false,"isHoveringCanvas":false,"openMenus":["main menu","main menu menu file"],"isChangingStyle":false,"isReadonly":false,"meta":{},"id":"instance:instance","currentPageId":"page:page","typeName":"instance"},{"x":570,"y":459,"rotation":0,"isLocked":false,"opacity":1,"meta":{},"id":"shape:HHhqOB__0sazC33k-7LDA","type":"geo","props":{"w":77,"h":68,"geo":"rectangle","color":"black","labelColor":"black","fill":"none","dash":"draw","size":"m","font":"draw","text":"","align":"middle","verticalAlign":"middle","growY":0,"url":""},"parentId":"page:page","index":"a1","typeName":"shape"}]}'

export default function App() {
	const ready = (editor: Editor) => {
		console.log('tldraw mounted')
		console.log(editor)
		parseAndLoadDocument(editor, tldrFileContent)
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
