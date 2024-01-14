import type { TldrFile, ExportFormat } from './types'

declare global {
	interface Window {
		tldrawExportFile: (data: TldrFile, format: ExportFormat) => void
	}
}
