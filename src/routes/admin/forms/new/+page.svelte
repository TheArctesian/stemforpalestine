<script lang="ts">
	import { enhance } from '$app/forms';
	import { slugifyUrl } from '$lib/forms/fields';

	let { data, form } = $props();
	const errors = $derived<Record<string, string | undefined>>(form?.errors ?? {});

	let template = $state(form?.values?.template ?? data.templates[0].id);
	let title = $state(form?.values?.title ?? '');
	let slug = $state(form?.values?.slug ?? '');
	let slugEdited = $state(!!form?.values?.slug);

	// Picking a template suggests its title and address; typing a title updates the address.
	function pickTemplate(id: string) {
		template = id;
		const t = data.templates.find((t) => t.id === id)!;
		if (id !== 'blank') {
			title = t.title;
			slug = t.slug;
			slugEdited = true;
		}
	}

	function onTitle(value: string) {
		title = value;
		if (!slugEdited) slug = slugifyUrl(value);
	}
</script>

<svelte:head>
	<title>New form | STEM4Palestine Admin</title>
</svelte:head>

<a href="/admin/forms" class="back-link"><i class="fas fa-arrow-left"></i> Forms</a>
<header class="page-header">
	<div>
		<h1>New form</h1>
		<p>New forms start as drafts. Only admins can see them until you open them.</p>
	</div>
</header>

<form method="POST" class="card" use:enhance>
	<h2>Start from</h2>
	<div class="templates">
		{#each data.templates as t (t.id)}
			<label class="template" class:selected={template === t.id}>
				<input
					type="radio"
					name="template"
					value={t.id}
					checked={template === t.id}
					onchange={() => pickTemplate(t.id)}
				/>
				<strong>{t.name}</strong>
				<span class="muted">{t.description}</span>
			</label>
		{/each}
	</div>

	<div class="form-grid">
		<div class="field">
			<label for="title">Title</label>
			<input
				id="title"
				name="title"
				type="text"
				required
				value={title}
				oninput={(e) => onTitle(e.currentTarget.value)}
				aria-invalid={!!errors.title}
			/>
			{#if errors.title}<p class="field-error">{errors.title}</p>{/if}
		</div>
		<div class="field">
			<label for="slug">Address</label>
			<input
				id="slug"
				name="slug"
				type="text"
				required
				value={slug}
				oninput={(e) => {
					slug = e.currentTarget.value;
					slugEdited = true;
				}}
				aria-invalid={!!errors.slug}
			/>
			<p class="hint">stem4pal.org/forms/<strong>{slug || '…'}</strong></p>
			{#if errors.slug}<p class="field-error">{errors.slug}</p>{/if}
		</div>
	</div>

	<button type="submit" class="btn btn-primary"><i class="fas fa-plus"></i> Create form</button>
</form>

<style>
	.templates {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.template {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 1rem;
		border: 2px solid var(--color-border-light);
		border-radius: 10px;
		cursor: pointer;
	}

	.template.selected {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 5%, #ffffff);
	}

	.template input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.template:has(input:focus-visible) {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
