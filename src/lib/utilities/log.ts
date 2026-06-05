/* eslint-disable ts/no-unnecessary-condition */
/* eslint-disable perfectionist/sort-objects */

// Staying basic, always log to stderr

// Backported to Node.js ^22.13.0, within our Node version targets
// eslint-disable-next-line node/no-unsupported-features/node-builtins
import { styleText } from 'node:util'

const isNode = process?.versions?.node !== undefined

const log = {
	verbose: false,

	// Intended for temporary logging
	log(...data: unknown[]): void {
		if (!this.verbose) {
			return
		}

		const levelPrefix = styleText('gray', '[Log]')
		if (isNode) {
			// Log to stderr in node for ease of redirection
			console.warn(levelPrefix, ...data)
		} else {
			console.log(levelPrefix, ...data)
		}
	},
	logPrefixed(prefix: string, ...data: unknown[]): void {
		this.info(styleText('blue', `[${prefix}]`), ...data)
	},

	info(...data: unknown[]): void {
		if (!this.verbose) {
			return
		}

		const levelPrefix = styleText('green', '[Info]')
		if (isNode) {
			// Log info to stderr in node for ease of redirection
			console.warn(levelPrefix, ...data)
		} else {
			console.info(levelPrefix, ...data)
		}
	},
	infoPrefixed(prefix: string, ...data: unknown[]): void {
		this.info(styleText('blue', `[${prefix}]`), ...data)
	},

	warn(...data: unknown[]): void {
		console.warn(styleText('yellow', '[Warning]'), ...data)
	},
	warnPrefixed(prefix: string, ...data: unknown[]): void {
		this.warn(styleText('blue', `[${prefix}]`), ...data)
	},

	error(...data: unknown[]): void {
		console.error(styleText('red', '[Error]'), ...data)
	},
	errorPrefixed(prefix: string, ...data: unknown[]): void {
		this.error(styleText('blue', `[${prefix}]`), ...data)
	},
}

export default log
