import TldrawController from './tldraw-controller'
import { validatePathOrUrl } from './validation'

/**
 * Gets a share URL from a tldraw file or URL
 */
export async function tldrawToShareUrl(tldrPathOrUrl: string): Promise<string> {
	const validatedPathOrUrl = validatePathOrUrl(tldrPathOrUrl, {
		requireFileExistence: true,
		validFileExtensions: ['.tldr'],
		validHostnames: ['www.tldraw.com'],
	})

	if (typeof validatedPathOrUrl === 'string') {
		// It's a local file, so we need to upload it to tldraw.com
		// and then get the share link
		const tldrawController = new TldrawController('https://www.tldraw.com')
		await tldrawController.start()
		await tldrawController.loadFile(validatedPathOrUrl)
		const shareUrl = await tldrawController.getShareUrl()
		await tldrawController.close()
		return shareUrl
	}

	// It's already a tldraw.com url, just return that
	// TODO better to download and make a copy?
	return validatedPathOrUrl.href
}
