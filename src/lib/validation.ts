import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isFileSync } from 'path-type'
import untildify from 'untildify'

/**
 * Validates a path or URL.
 */
export function validatePathOrUrl(
	pathOrUrl: string,
	options: {
		requireFileExistence?: boolean
		validFileExtensions?: string[]
		validHostnames?: string[]
	} = {},
): string | URL {
	const { requireFileExistence, validFileExtensions, validHostnames } = options

	if (URL.canParse(pathOrUrl)) {
		const url = new URL(pathOrUrl)

		if (url.protocol === 'file:') {
			return validatePathOrUrl(fileURLToPath(url), options)
		}

		if (validHostnames && !validHostnames.includes(url.hostname)) {
			throw new Error(`Bad input URL. Only ${validHostnames.join(', ')} URLs are supported.`)
		}

		return url
	}

	const expandedPath = untildify(pathOrUrl)
	const normalizedPath = path.normalize(expandedPath)

	if (requireFileExistence && !isFileSync(normalizedPath)) {
		throw new Error(`Input is not a file.`)
	}

	const fileExtension = path.extname(normalizedPath)
	if (validFileExtensions && !validFileExtensions.includes(fileExtension)) {
		throw new Error(
			`Bad input file name. Only ${validFileExtensions.join(', ')} files are supported.`,
		)
	}

	return normalizedPath
}
