import { knipConfig } from '@kitschpatrol/knip-config'

export default knipConfig({
	entry: ['./test/utilities/file.ts'],
	ignoreDependencies: ['@fontsource/inter'],
})
