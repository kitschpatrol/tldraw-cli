import { knipConfig } from '@kitschpatrol/knip-config'

export default knipConfig({
	entry: ['./test/utilities/file.ts'],
	ignoreDependencies: [
		'@fontsource/inter',
		'@kitschpatrol/chagent', // Typically invoked through bumpp's --execute argument, which Knip doesn't parse
	],
})
