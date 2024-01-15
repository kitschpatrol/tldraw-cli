import type { TldrFile, ExportFormat } from './types'

declare global {
	interface Window {
		tldrawExportFile: (data: TldrFile, format: ExportFormat, transparent: null | boolean) => void
	}
}
