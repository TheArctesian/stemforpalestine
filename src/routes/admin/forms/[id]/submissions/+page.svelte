<script lang="ts">
	import { enhance } from '$app/forms';
	import ConfirmButton from '$lib/admin/ConfirmButton.svelte';
	import DataTable, { type Column } from '$lib/admin/DataTable.svelte';
	import { answerText } from '$lib/forms/conditions';
	import { DISPLAY_TYPES } from '$lib/forms/fields';

	let { data, form: result } = $props();

	// Every question that can have answers, archived ones included, in form order.
	const fields = $derived(data.form.fields.filter((f) => !DISPLAY_TYPES.has(f.type)));

	/** "2026-10-08 19:05": readable, sorts correctly, and SearchBuilder treats it as a date. */
	const stamp = (date: Date) => {
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
	};

	type Row = Record<string, string>;
	const rows = $derived<Row[]>(
		data.submissions.map((s) => ({
			id: s.id,
			submittedAt: stamp(new Date(s.submittedAt)),
			source: s.source,
			...Object.fromEntries(fields.map((f) => [`f_${f.id}`, answerText(s.data[f.id])]))
		}))
	);

	const columns = $derived<Column[]>([
		{ title: 'Submitted', data: 'submittedAt', type: 'date' },
		...fields.map((f) => ({
			title: f.archived ? `${f.label || f.key} (archived)` : f.label || f.key,
			data: `f_${f.id}`,
			defaultContent: ''
		})),
		{ title: 'Source', data: 'source' }
	]);

	let selected = $state<Row[]>([]);
	let openId = $state<string | null>(null);
	const open = $derived(data.submissions.find((s) => s.id === openId));
</script>

<svelte:head>
	<title>Submissions: {data.form.title} | STEM4Palestine Admin</title>
</svelte:head>

<a href="/admin/forms" class="back-link"><i class="fas fa-arrow-left"></i> Forms</a>
<header class="page-header">
	<div>
		<h1>{data.form.title}</h1>
		<p>
			{data.submissions.length} submission{data.submissions.length === 1 ? '' : 's'}. Click a row to
			see it in full.
		</p>
	</div>
	<div class="actions">
		<a href="/admin/forms/{data.form.id}/import" class="btn"
			><i class="fas fa-file-import"></i> Import CSV</a
		>
		<a href="/admin/forms/{data.form.id}/edit" class="btn"><i class="fas fa-pen"></i> Edit form</a>
	</div>
</header>

{#if result?.deleted}
	<p class="flash flash-success" role="status">
		Deleted {result.deleted} submission{result.deleted === 1 ? '' : 's'}.
	</p>
{:else if result?.message}
	<p class="flash flash-error" role="alert">{result.message}</p>
{/if}

<div class="card">
	{#if selected.length}
		<form method="POST" action="?/delete" class="selection" use:enhance>
			{#each selected as row (row.id)}<input type="hidden" name="id" value={row.id} />{/each}
			<span><strong>{selected.length}</strong> selected</span>
			<ConfirmButton
				label="Delete selected"
				question="Delete {selected.length} submission{selected.length === 1 ? '' : 's'}?"
				confirmLabel="Delete"
			/>
		</form>
	{/if}

	<DataTable
		{columns}
		{rows}
		selectable
		order={[[1, 'desc']]}
		exportName="{data.form.slug}-submissions"
		onSelectionChange={(r) => (selected = r)}
		onRowClick={(row) => (openId = row.id)}
	/>
</div>

{#if open}
	<div class="drawer-backdrop" role="presentation" onclick={() => (openId = null)}></div>
	<aside class="drawer card" aria-label="Submission">
		<div class="drawer-header">
			<h2>Submission</h2>
			<button type="button" class="btn btn-small" aria-label="Close" onclick={() => (openId = null)}
				><i class="fas fa-xmark"></i></button
			>
		</div>
		<p class="muted">
			{new Date(open.submittedAt).toLocaleString('en-US', {
				dateStyle: 'full',
				timeStyle: 'short'
			})}
			· {open.source === 'import' ? 'Imported' : 'Submitted on the site'}
		</p>
		<dl>
			{#each fields as field (field.id)}
				<dt>
					{field.label || field.key}{#if field.archived}
						<span class="badge">archived</span>{/if}
				</dt>
				<dd class:muted={!answerText(open.data[field.id])}>
					{answerText(open.data[field.id]) || '—'}
				</dd>
			{/each}
			{#if open.metadata.referrer}
				<dt>Came from</dt>
				<dd>{open.metadata.referrer}</dd>
			{/if}
		</dl>
		<form
			method="POST"
			action="?/delete"
			use:enhance={() =>
				async ({ update }) => {
					openId = null;
					await update();
				}}
		>
			<input type="hidden" name="id" value={open.id} />
			<ConfirmButton
				label="Delete submission"
				question="Delete this submission?"
				confirmLabel="Delete"
			/>
		</form>
	</aside>
{/if}

<style>
	.selection {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.6rem 0.85rem;
		margin-bottom: 1rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
	}

	.drawer-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(15, 23, 42, 0.35);
		z-index: 40;
	}

	.drawer {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: min(520px, 100vw);
		z-index: 41;
		overflow-y: auto;
		border-radius: 0;
	}

	.drawer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.drawer-header h2 {
		margin: 0;
	}

	dl {
		margin: 1rem 0 1.5rem;
	}

	dt {
		font-weight: 600;
		font-size: 0.85rem;
		color: var(--color-text-light);
		margin-top: 0.85rem;
	}

	dd {
		white-space: pre-wrap;
		word-break: break-word;
	}
</style>
