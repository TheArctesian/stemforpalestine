import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		// The admin loads these lazily. Listing them stops Vite discovering them mid-session in dev,
		// re-bundling, and failing the import that triggered it.
		include: [
			'tinymce',
			'tinymce/icons/default',
			'tinymce/themes/silver',
			'tinymce/models/dom',
			'tinymce/plugins/autolink',
			'tinymce/plugins/code',
			'tinymce/plugins/image',
			'tinymce/plugins/link',
			'tinymce/plugins/lists',
			'tinymce/plugins/table',
			'datatables.net-dt',
			'datatables.net-buttons-dt',
			'datatables.net-buttons/js/buttons.html5.mjs',
			'datatables.net-buttons/js/buttons.colVis.mjs',
			'datatables.net-datetime',
			'datatables.net-searchbuilder-dt',
			'datatables.net-select-dt',
			'datatables.net-responsive-dt',
			'papaparse'
		]
	},
	test: {
		include: ['src/**/*.test.ts']
	}
});
