// Cross-platform node fs implementation of:
// rsync -av --include='/*/' --exclude='/*' --exclude='favicon.ico' ./node_modules/@tldraw/assets/ ./src/tldraw/public/
// cpy 'embed-icons/**' 'fonts/**' 'icons/**' 'translations/**' ../../../src/tldraw/public/ --cwd=./node_modules/@tldraw/assets --base=cwd

// eslint-disable-next-line node/no-unsupported-features/node-builtins
import { cpSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const src = './node_modules/@tldraw/assets'
const destination = './src/tldraw/public'

const subdirectories = readdirSync(src, { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map((entry) => entry.name)

for (const directory of subdirectories) {
	cpSync(join(src, directory), join(destination, directory), { recursive: true })
	console.log(`${directory}/`)
}
