// Staying basic

import chalk from 'chalk'

export let cli = false
export let verbose = false

export function setCli(value: boolean) {
	cli = value
}

export function setVerbose(value: boolean) {
	verbose = value
}

export function log(...data: unknown[]): void {
	// To stdout in all contexts
	console.log(...data)
}

export function warn(...data: unknown[]): void {
	// To stderr in all contexts
	console.warn(chalk.yellow('[Warning]'), ...data)
}

export function error(...data: unknown[]): void {
	// To stderr in all contexts
	console.error(chalk.red('[Error]'), ...data)
}

export function info(...data: unknown[]): void {
	if (!verbose) return
	// To stderr in cli only
	if (cli) {
		console.warn(chalk.green('[Info]'), ...data)
	} else {
		console.log(...data)
	}
}
