<script lang="ts">
	import Papa from 'papaparse';
	import { deserialize } from '$app/forms';
	import { answerText } from '$lib/forms/conditions';
	import { guessMapping, importAnswers, SUBMITTED_AT, unlistedChoices } from '$lib/forms/import';
	import { answerableFields } from '$lib/forms/validate';

	let { data } = $props();
	const fields = $derived(answerableFields({ fields: data.form.fields }));

	let fileName = $state('');
	let headers = $state<string[]>([]);
	let csvRows = $state<Record<string, string>[]>([]);
	let mapping = $state<Record<string, string>>({});
	let skipExisting = $state(true);
	let parseError = $state('');

	let importing = $state(false);
	let done = $state(0);
	let summary = $state<{ imported: number; skipped: number } | null>(null);
	let importError = $state('');

	function pick(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;
		parseError = '';
		summary = null;
		fileName = file.name;
		Papa.parse<Record<string, string>>(file, {
			header: true,
			skipEmptyLines: 'greedy',
			complete: (results) => {
				headers = (results.meta.fields ?? []).filter(Boolean);
				csvRows = results.data;
				mapping = guessMapping(headers, data.form.fields);
				if (!csvRows.length) parseError = 'That file has no rows.';
			},
			error: (err) => (parseError = err.message)
		});
	}

	/** The rows, as the server will receive them: cells keyed by field id. */
	const mapped = $derived(
		csvRows.map((row, i) => {
			const cells: Record<string, string> = {};
			let submittedAt: string | undefined;
			for (const header of headers) {
				const target = mapping[header];
				if (target === SUBMITTED_AT) submittedAt = row[header];
				else if (target) cells[target] = row[header] ?? '';
			}
			// Line numbers in the file: 1 is the header row.
			return { line: i + 2, submittedAt, cells };
		})
	);

	const preview = $derived(
		mapped.slice(0, 5).map((row) => importAnswers(data.form.fields, row.cells))
	);
	const mappedFields = $derived(fields.filter((f) => Object.values(mapping).includes(f.id)));

	/** Choice answers in the file that aren't options of the question, with how often they appear. */
	const warnings = $derived.by(() => {
		const counts = new Map<string, Map<string, number>>();
		for (const row of mapped) {
			const answers = importAnswers(data.form.fields, row.cells);
			for (const field of mappedFields) {
				for (const value of unlistedChoices(field, answers[field.id])) {
					const forField = counts.get(field.id) ?? new Map();
					forField.set(value, (forField.get(value) ?? 0) + 1);
					counts.set(field.id, forField);
				}
			}
		}
		return [...counts].map(([id, values]) => ({
			field: fields.find((f) => f.id === id)!,
			values: [...values].sort((a, b) => b[1] - a[1])
		}));
	});

	const CHUNK = 500;
	async function runImport() {
		importing = true;
		importError = '';
		done = 0;
		const totals = { imported: 0, skipped: 0 };
		for (let i = 0; i < mapped.length; i += CHUNK) {
			const body = new FormData();
			body.set('payload', JSON.stringify({ skipExisting, rows: mapped.slice(i, i + CHUNK) }));
			const response = await fetch(window.location.pathname, {
				method: 'POST',
				body,
				headers: { 'x-sveltekit-action': 'true' }
			});
			const result = deserialize(await response.text());
			if (result.type !== 'success') {
				importError =
					result.type === 'failure'
						? String(result.data?.message ?? 'Import failed.')
						: result.type === 'error'
							? String(result.error?.message ?? 'Import failed.')
							: 'Import failed.';
				break;
			}
			totals.imported += Number(result.data?.imported ?? 0);
			totals.skipped += Number(result.data?.skipped ?? 0);
			done = Math.min(i + CHUNK, mapped.length);
		}
		summary = totals;
		importing = false;
	}
</script>

<svelte:head>
	<title>Import: {data.form.title} | STEM4Palestine Admin</title>
</svelte:head>

<a href="/admin/forms/{data.form.id}/submissions" class="back-link"
	><i class="fas fa-arrow-left"></i> Submissions</a
>
<header class="page-header">
	<div>
		<h1>Import submissions</h1>
		<p>
			Add rows from a CSV export (Fillout, Google Forms, a spreadsheet) to <strong
				>{data.form.title}</strong
			>.
		</p>
	</div>
</header>

{#if summary}
	<div class="flash flash-success" role="status">
		Imported <strong>{summary.imported}</strong> submission{summary.imported === 1
			? ''
			: 's'}{#if summary.skipped}; skipped {summary.skipped} (empty, or the email was already there){/if}.
		<a href="/admin/forms/{data.form.id}/submissions">See the submissions →</a>
	</div>
{/if}
{#if importError}<p class="flash flash-error" role="alert">
		{importError}
		{done ? `(${done} rows were imported before that.)` : ''}
	</p>{/if}

<div class="card">
	<h2>1. Choose a CSV file</h2>
	<input type="file" accept=".csv,text/csv" onchange={pick} aria-label="CSV file" />
	{#if parseError}<p class="field-error">{parseError}</p>{/if}
	{#if csvRows.length}<p class="hint">
			{fileName}: {csvRows.length} rows, {headers.length} columns.
		</p>{/if}
</div>

{#if csvRows.length}
	<div class="card">
		<h2>2. Match columns to questions</h2>
		<p class="hint">
			Columns whose header matches a question were matched for you. Leave a column on “Don't import”
			to skip it.
		</p>
		<div class="table-wrap">
			<table class="list">
				<thead><tr><th>CSV column</th><th>Example</th><th>Goes into</th></tr></thead>
				<tbody>
					{#each headers as header (header)}
						<tr>
							<td><strong>{header}</strong></td>
							<td class="muted example">{csvRows.find((r) => r[header])?.[header] ?? ''}</td>
							<td>
								<select bind:value={mapping[header]} aria-label="Question for {header}">
									<option value={undefined}>Don't import</option>
									<option value={SUBMITTED_AT}>Submission time</option>
									{#each fields as field (field.id)}
										<option value={field.id}>{field.label || field.key}</option>
									{/each}
								</select>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<div class="card">
		<h2>3. Check and import</h2>
		{#if warnings.length}
			<div class="flash flash-info">
				<p><strong>Answers that aren't options.</strong> They'll be kept as written:</p>
				<ul>
					{#each warnings as w (w.field.id)}
						<li>
							{w.field.label}: {w.values
								.slice(0, 6)
								.map(([v, n]) => `“${v}” (${n})`)
								.join(', ')}{w.values.length > 6 ? `, and ${w.values.length - 6} more` : ''}
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if mappedFields.length}
			<p class="hint">The first {preview.length} rows, as they'll be saved:</p>
			<div class="table-wrap preview">
				<table class="list">
					<thead
						><tr
							>{#each mappedFields as f (f.id)}<th>{f.label || f.key}</th>{/each}</tr
						></thead
					>
					<tbody>
						{#each preview as answers, i (i)}
							<tr
								>{#each mappedFields as f (f.id)}<td>{answerText(answers[f.id])}</td>{/each}</tr
							>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="field-error">Match at least one column to a question.</p>
		{/if}

		<label class="check">
			<input type="checkbox" bind:checked={skipExisting} />
			Skip rows whose email is already in this form's submissions
		</label>

		<button
			type="button"
			class="btn btn-primary"
			disabled={importing || !mappedFields.length}
			onclick={runImport}
		>
			<i class="fas fa-file-import"></i>
			{importing ? `Importing… ${done} of ${mapped.length}` : `Import ${mapped.length} rows`}
		</button>
		{#if importing}<progress max={mapped.length} value={done}></progress>{/if}
	</div>
{/if}

<style>
	.example {
		max-width: 22rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.preview td {
		max-width: 16rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.flash ul {
		margin: 0.4rem 0 0 1.25rem;
	}

	progress {
		display: block;
		width: 100%;
		margin-top: 0.75rem;
		accent-color: var(--color-primary);
	}
</style>
