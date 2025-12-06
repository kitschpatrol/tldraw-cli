import { knipConfig } from '@kitschpatrol/knip-config'

export default knipConfig({
	entry: ['src/tldraw/main.tsx', './test/utilities/file.ts'],
	ignoreDependencies: ['@fontsource/inter', 'node-addon-api', 'node-gyp'],
})
