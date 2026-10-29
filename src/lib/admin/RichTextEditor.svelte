<script lang="ts" module>
	export type Placeholder = { key: string; label: string };

	const TOOLBARS = {
		minimal:
			'blocks | bold italic underline | link | bullist numlist | alignleft aligncenter | removeformat',
		full:
			'blocks | bold italic underline strikethrough forecolor | link image table | bullist numlist | ' +
			'alignleft aligncenter alignright | placeholders | removeformat code'
	};

	// TinyMCE is big, so it loads on first use, and only in the admin.
	let loading: Promise<typeof import('tinymce').default> | undefined;
	function loadTinyMCE() {
		loading ??= (async () => {
			const { default: tinymce } = await import('tinymce');
			// These register themselves with the global tinymce, so they come after it.
			await Promise.all([
				import('tinymce/icons/default'),
				import('tinymce/themes/silver'),
				import('tinymce/models/dom'),
				import('tinymce/skins/ui/oxide/skin.js'),
				import('tinymce/skins/ui/oxide/content.js'),
				import('tinymce/skins/content/default/content.js'),
				import('tinymce/plugins/autolink'),
				import('tinymce/plugins/code'),
				import('tinymce/plugins/image'),
				import('tinymce/plugins/link'),
				import('tinymce/plugins/lists'),
				import('tinymce/plugins/table')
			]);
			return tinymce;
		})();
		return loading;
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import type { Editor } from 'tinymce';

	/*
	 * Self-hosted TinyMCE (GPL, bundled by Vite, no CDN or API key). The textarea underneath holds
	 * the HTML, so `name` works in a plain <form> too.
	 */
	let {
		value = $bindable(''),
		name,
		label,
		toolbar = 'minimal',
		height = 260,
		placeholders = [],
		uploadImage
	}: {
		value?: string;
		name?: string;
		label: string;
		toolbar?: keyof typeof TOOLBARS;
		height?: number;
		/** Fields for the "Insert field" menu, which inserts {{key}}. */
		placeholders?: Placeholder[];
		/** Uploads a pasted or chosen image and resolves to its public URL. */
		uploadImage?: (file: Blob, filename: string) => Promise<string>;
	} = $props();

	let textarea: HTMLTextAreaElement;
	let editor: Editor | undefined;
	let failed = $state(false);

	// TinyMCE tidies HTML as it loads it, which would look like an edit. Until the content really
	// changes, report the value we were given rather than TinyMCE's tidied copy of it.
	let loaded = { value: '', html: '' };
	let emitted: string | undefined;

	function emit(ed: Editor) {
		const html = ed.getContent();
		emitted = html === loaded.html ? loaded.value : html;
		value = emitted;
	}

	function load(ed: Editor, html: string) {
		ed.setContent(html);
		loaded = { value: html, html: ed.getContent() };
		emitted = html;
	}

	onMount(() => {
		let destroyed = false;
		loadTinyMCE()
			.then(async (tinymce) => {
				if (destroyed) return;
				const [instance] = await tinymce.init({
					target: textarea,
					license_key: 'gpl',
					height,
					menubar: false,
					branding: false,
					promotion: false,
					plugins: 'autolink code image link lists table',
					toolbar: TOOLBARS[toolbar],
					block_formats: 'Paragraph=p; Heading=h2; Subheading=h3; Small heading=h4',
					// Full URLs: this HTML ends up on other pages and in emails.
					relative_urls: false,
					remove_script_host: false,
					link_default_target: '_blank',
					automatic_uploads: true,
					images_upload_handler: uploadImage
						? (blob) => uploadImage(blob.blob(), blob.filename())
						: undefined,
					content_style: 'body { font-family: Inter, system-ui, sans-serif; font-size: 15px; }',
					setup(ed) {
						if (placeholders.length) {
							ed.ui.registry.addMenuButton('placeholders', {
								text: 'Insert field',
								icon: 'code-sample',
								fetch: (done) =>
									done(
										placeholders.map((p) => ({
											type: 'menuitem',
											text: `${p.label}  {{${p.key}}}`,
											onAction: () => ed.insertContent(`{{${p.key}}}`)
										}))
									)
							});
						}
						ed.on('init', () => load(ed, value ?? ''));
						ed.on('input change undo redo ExecCommand', () => emit(ed));
					}
				});
				if (destroyed) instance?.remove();
				else editor = instance;
			})
			.catch((error) => {
				console.error('Rich text editor failed to load', error);
				failed = true;
			});
		return () => {
			destroyed = true;
			editor?.remove();
		};
	});

	// Keep the editor in step when the value changes from outside (e.g. after saving).
	$effect(() => {
		const next = value ?? '';
		if (editor && next !== emitted) load(editor, next);
	});
</script>

<div class="rich-text-editor">
	<textarea bind:this={textarea} {name} aria-label={label} bind:value rows="8"></textarea>
	{#if failed}<p class="hint">The editor didn't load; you can still edit the HTML directly.</p>{/if}
</div>

<style>
	textarea {
		width: 100%;
		min-height: 10rem;
		font-family: ui-monospace, monospace;
	}

	.rich-text-editor :global(.tox-tinymce) {
		border-radius: 8px;
		border-color: var(--color-border-medium);
	}
</style>
